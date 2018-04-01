
const steamDataAccess = require('steamDataAccess');
const tagBlacklist = steamDataAccess.tagData.blacklist;

/**
 * Generates individual recommendations for users.
 * @param {Array} userProfiles
 * @return {Promise<Array<Array>>}
 */
async function generateUserRecommendations(userProfiles) {

    // Initialize an empty recommendation array for each user profile
    const recommendationsPerProfile = [];
    for (let i = 0; i < userProfiles.length; ++i) {
        recommendationsPerProfile.push([]);
    }

    for (const appId of await steamDataAccess.apps.appIds()) {
        const appDetails = await steamDataAccess.apps.appDetails(appId);

        // Only consider tags that aren't blacklisted
        const nonBlacklistedTags = appDetails.steamSpyDetails.tags;
        for (const tag in nonBlacklistedTags) {
            if (tagBlacklist.has(tag)) {
                delete nonBlacklistedTags.tag;
            }
        }

        // Only consider the game if it has some tags
        if (Object.keys(nonBlacklistedTags).length > 0) {

            // Normalize tag votes
            const maxVotes = Math.max(...Object.keys(nonBlacklistedTags).map(tag => nonBlacklistedTags[tag]));
            for (const tag in nonBlacklistedTags) {
                nonBlacklistedTags[tag] /= maxVotes;
            }

            // Calculate the rating for every user profile
            for (let i = 0; i < userProfiles.length; ++i) {

                let rating = 0;
                for (const tag in nonBlacklistedTags) {
                    rating += nonBlacklistedTags[tag] * (userProfiles[i].tags[tag] || 0);
                }
                rating /= Math.pow(Object.keys(nonBlacklistedTags).length, 1/3);

                recommendationsPerProfile[i].push({
                    tags: nonBlacklistedTags,
                    gameId: appId,
                    rating: rating
                });
            }
        }
    }

    // Sort each recommendation list by rating
    for (let i = 0; i < recommendationsPerProfile.length; ++i) {
        recommendationsPerProfile[i].sort((a, b) => (a.rating < b.rating) ? 1 : ((b.rating < a.rating) ? -1 : 0));
    }

    return recommendationsPerProfile;
}

/**
 * Aggregates individual recommendations using borda count
 * @param {Array<Array>} recommendationsPerProfile
 * @return {Array}
 */
function aggregateRecommendationsBordaCount(recommendationsPerProfile) {

    const numberOfItems = Math.max(...recommendationsPerProfile.map(r => r.length));

    const combinedRatings = {};
    for (const profileRecommendations of recommendationsPerProfile) {
        for (let i = 0; i < profileRecommendations.length; ++i) {
            const recommendation = profileRecommendations[i];
            if (combinedRatings[recommendation.gameId] === undefined) {
                combinedRatings[recommendation.gameId] = {
                    gameId: recommendation.gameId,
                    rating: 0,
                    tags: recommendation.tags
                };
            }
            combinedRatings[recommendation.gameId].rating += numberOfItems - i;
        }
    }

    const combinedRatingsList = [];
    for (const appId in combinedRatings) {
        combinedRatingsList.push(combinedRatings[appId]);
    }
    combinedRatingsList.sort((a, b) => (a.rating < b.rating) ? 1 : ((b.rating < a.rating) ? -1 : 0));

    return combinedRatingsList;
}

/**
 * Aggregates individual recommendations using least misery method
 * @param {Array<Array>} recommendationsPerProfile
 * @return {Array}
 */
function aggregateRecommendationsLeastMisery(recommendationsPerProfile) {

    const combinedRatings = {};
    for (const profileRecommendations of recommendationsPerProfile) {
        for (let i = 0; i < profileRecommendations.length; ++i) {
            const recommendation = profileRecommendations[i];
            if (combinedRatings[recommendation.gameId] === undefined) {
                combinedRatings[recommendation.gameId] = {
                    gameId: recommendation.gameId,
                    rating: 0,
                    leastMiseryRating: 100000,
                    tags: recommendation.tags
                };
            }
            if (recommendation.rating < combinedRatings[recommendation.gameId].leastMiseryRating)
            {
                combinedRatings[recommendation.gameId].leastMiseryRating = recommendation.rating;
            }
        }
    }

    const combinedRatingsList = [];
    for (const appId in combinedRatings) {
        var gameData = combinedRatings[appId];
        // Set the least misery rating to 0 if the game is not on someones top recommendations at all
        if (gameData.votes < Object.keys(recommendationsPerProfile).length){
            gameData.leastMiseryRating = 0;
        }
        gameData.rating = gameData.leastMiseryRating;

        combinedRatingsList.push(gameData);
    }
    combinedRatingsList.sort((a, b) => (a.rating < b.rating) ? 1 : ((b.rating < a.rating) ? -1 : 0));

    return combinedRatingsList;
}


/**
 * 
 * @param {Number} numberOfClusters 
 * @param {Array} datapoints 
 * @param {Number} maxIterations 
 * @return {Array} Clusters
 */
function generateClusters(numberOfClusters, datapoints, maxIterations) {

    // First cluster is centered on the first recommendation
    const clusters = [{
        id: 0,
        center: datapoints[0].tags,
        points: []
    }];

    // Find the other cluster centers
    for (let i = 1; i < numberOfClusters; ++i) {

        // Find the most distant datapoint from the top 100 to any existing cluster center
        let distanceToNearestCenter = -1;
        let mostDistantDatapoint;
        for (const datapoint of datapoints.slice(0,100)) {
            // Distance to the closest cluster center
            let minDistance = 100000;
            // For every datapoint, find the distance to every cluster center and keep track of the shortest distance
            for (const cluster of clusters) {
                const distance = manhattanDistance(datapoint.tags, cluster.center);
                if (distance < minDistance) {
                    minDistance = distance;
                }
            }
            // If the current datapoint is further away than the currently most distant, set it to be the most distant
            if (minDistance > distanceToNearestCenter) {
                distanceToNearestCenter = minDistance;
                mostDistantDatapoint = datapoint;
            }
        }
        clusters.push({
            id: i,
            center: mostDistantDatapoint.tags,
            points: []
        });
    }

    /**
     * Builds clusters around previously assigned cluster centers.
     * @return {Boolean} True of changes were made, false if not.
     */
    function buildClusters() {
        let reassigned = false;
        for (const datapoint of datapoints) {
            let nearestCluster;
            let minDistance = 100000;
            // For a single datapoint, find the closest center
            for (const cluster of clusters) {
                const newDistance = manhattanDistance(datapoint.tags, cluster.center);
                if (newDistance < minDistance) {
                    nearestCluster = cluster;
                    minDistance = newDistance;
                }
            }
            // Add the datapoint to the nearest cluster
            nearestCluster.points.push(datapoint);
            if (datapoint.clusterId != nearestCluster.id) {
                reassigned = true;
            }
            datapoint.clusterId = nearestCluster.id;
        }
        return reassigned;
    }

    // Build initial clusters around centers
    buildClusters();

    // Rebuild clusters until it doesn't make any changes
    let reassigned = true;
    let iterations = 0;
    while (reassigned && iterations < maxIterations) {
        // Recalculate centers and clear points
        for (const cluster of clusters) {
            cluster.center = calculateClusterCenter(cluster);
            cluster.points = [];
        }
        reassigned = buildClusters();
        ++iterations;
    }
    console.log(iterations);

    return clusters;
}

/**
 * Calculates the center of a cluster.
 * @param {*} cluster
 * @return {*} Center
 */
function calculateClusterCenter(cluster) {

    // First get the sums for each tag
    const tagSums = {};
    for (const datapoint of cluster.points) {
        for (const tag in datapoint.tags) {
            if (!tagSums.hasOwnProperty(tag)) {
                tagSums[tag] = 0;
            }
            tagSums[tag] += datapoint.tags[tag];
        }
    }

    // Get the average value by dividing the sums
    const center = {};
    for (const tag in tagSums) {
        center[tag] = tagSums[tag] / cluster.points.length;
    }

    return center;
}

/**
 * Picks recommendations from clusters evenly.
 * @param {Array} clusters
 * @return {Array<Number>}
 */
function pickAppIdsFromClusters(clusters) {

    for (const datapoint of clusters) {
        datapoint.points.sort((a, b) => (a.rating < b.rating) ? 1 : ((b.rating < a.rating) ? -1 : 0));
    }

    const recommendedAppIds = []
    let foundNew = true;
    let index = 0;

    // While there is still data in all clusters
    while (foundNew) {
        foundNew = false;
        // Once per interation, for each cluster, add one recommendation
        for (const datapoint of clusters) {
            if (datapoint.points.length > index) {
                foundNew = true;
                recommendedAppIds.push(datapoint.points[index].gameId);
            }
        }
        ++index;
    }

    return recommendedAppIds;

}

/**
 * Calculates the Manhattan distance between two objects.
 * @param {*} object1 
 * @param {*} object2 
 * @return {Number} Distance
 */
function manhattanDistance(object1, object2) {

    let distance = 0;

    const allKeys = new Set([...Object.keys(object1), ...Object.keys(object2)]);
    allKeys.forEach((key) => {
        // Treat as 0 if the dict doesn't contain the key
        let value1 = object1[key] || 0;
        let value2 = object2[key] || 0;
        distance += Math.abs(value1 - value2);
    });

    return distance;
}

/**
 * Generates recommendations for a group of users.
 * @param {Array} userProfiles 
 * @param {Number} numberOfClusterRecommendations 
 * @param {Number} numberOfClusters 
 * @param {Number} maxClusteringIterations 
 * @return {Promise<Array<Number>>}
 */
async function generateRecommendationsForGroup(userProfiles, numberOfClusterRecommendations, numberOfClusters, maxClusteringIterations, aggregationMethod) {
    if (userProfiles === null || userProfiles.length === 0) {
        // No profiles, no recommendations
        return [];
    }
    else {
        const recommendations = await generateUserRecommendations(userProfiles);
        // Aggregate user specific recommendations using borda count or least misery method
        const aggregatedRecommendations = (aggregationMethod == "BC" ? aggregateRecommendationsBordaCount(recommendations) : aggregateRecommendationsLeastMisery(recommendations) );
        
        const topRecommendations = aggregatedRecommendations.slice(0, numberOfClusterRecommendations);

        // Use clustering to get diversity in the top recommendations
        // Order top recommendations by clustering
        const clusterRecommendations = pickAppIdsFromClusters(generateClusters(numberOfClusters, topRecommendations, maxClusteringIterations));
        return clusterRecommendations;
    }
}

module.exports = { generateRecommendationsForGroup };
