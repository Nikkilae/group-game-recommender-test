const fs = require('fs');
const path = require('path');

const promiseRequest = require('util/promiseRequest');
const apiKey = require('steamApiConfig').key;
const steamDataAccess = require('steamDataAccess');
const tagBlacklist = steamDataAccess.tagData.blacklist;

/**
 * Generates a user profile for a Steam user.
 * @param {String} steamUserIdOrVanityUrl 
 * @return {Promise} User profile
 */
async function generateUserProfile(steamUserIdOrVanityUrl) {

    const summaryAndGames = await fetchPlayerSummaryAndGames(steamUserIdOrVanityUrl);

    // The user profile that will now be built and eventually returned
    const profile = {
        userData: summaryAndGames.userData,
        tags: {}
    };

    const playedGameAppIds = summaryAndGames.games
        .filter(game => game.playtime_forever >= 120)
        .map(game => game.appid);
    for (const appId of playedGameAppIds) {
        if (await steamDataAccess.apps.appDetailsExist(appId)) {

            const appDetails = await steamDataAccess.apps.appDetails(appId);

            // Only consider tag ratings that aren't blacklisted
            const nonBlacklistedTags = {};
            for (const tag in appDetails.steamSpyDetails.tags) {
                if (!tagBlacklist.has(tag)) {
                    nonBlacklistedTags[tag] = appDetails.steamSpyDetails.tags[tag];
                }
            }

            // Get the max votes for a single tag for the current game
            let maxVotes = 1;
            for (const tag in nonBlacklistedTags) {
                const votes = nonBlacklistedTags[tag];
                if (votes > maxVotes) {
                    maxVotes = votes;
                }
            }

            // Increase the total rating for the user profile for each tag the game has
            for (const tag in nonBlacklistedTags) {
                // Init the tag if it doesn't exist
                if (!profile.tags.hasOwnProperty(tag)) {
                    profile.tags[tag] = 0;
                }
                profile.tags[tag] += nonBlacklistedTags[tag] / maxVotes;
            }
        }
    }

    const tagData = await steamDataAccess.tagData.tagData();

    // Take IDF into account for all tags
    for (const tag in profile.tags) {
        profile.tags[tag] *= Math.pow(tagData.tagIDF[tag], 2) ;
    }

    // Normalize tag ratings
    const maxRating = Math.max(...Object.keys(profile.tags).map(tag => profile.tags[tag]));
    for (const tag in profile.tags) {
        profile.tags[tag] /= maxRating;
    }

    // Prune tag ratings
    let topTags = Object.keys(profile.tags).sort((a, b) => {return profile.tags[b] - profile.tags[a];} ).slice(0, 30);
    for (const tag in profile.tags) {
        if (topTags.indexOf(tag) < 0) {
            delete profile.tags[tag];
        }
    }

    return profile;
}

/**
 * Resolves a vanity URL of a Steam user into a Steam user ID.
 * @param {String} vanityUrl
 * @return {Promise<Number>}
 */
async function resolveVanityUrl(vanityUrl) {
    const url = 'http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001?vanityurl=' + vanityUrl + '&key=' + apiKey;
    const body = JSON.parse(await promiseRequest.get(url));
    if (body.response !== undefined && body.response.steamid !== undefined) {
        return body.response.steamid;
    }
    else {
        throw new Error("Vanity URL " + vanityUrl + " couldn't be resolved.");
    }
}

/**
 * Fetches player summaries and owned games of a Steam user.
 * @param {String} steamUserIdOrVanityUrl 
 */
async function fetchPlayerSummaryAndGames(steamUserIdOrVanityUrl) {

    try {
        steamUserIdOrVanityUrl = String(await resolveVanityUrl(steamUserIdOrVanityUrl));
    } catch (e) {
        // If vanity URL resolving failed, it's not a vanity URL.
        // Let's ignore this error and try regular user ID instead.
    }

    const url = 'http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=' + apiKey + '&steamid=' + steamUserIdOrVanityUrl + "&format=json&include_played_free_games=1";
    const ownedGames = JSON.parse(await promiseRequest.get(url));

    if (ownedGames.response !== undefined && ownedGames.response.games !== undefined) {
        const games = ownedGames.response.games;
        const url = 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=' + apiKey + '&steamids=' + steamUserIdOrVanityUrl;
        const playerSummaries = JSON.parse(await promiseRequest.get(url));
        if (playerSummaries.response !== undefined) {
            const userData = playerSummaries.response.players[0];
            return { games, userData };
        }
        else {
            throw new Error("Couldn't fetch owned games of " + steamUserIdOrVanityUrl + ".");
        }
    }
    else {
        throw new Error("Couldn't fetch user " + steamUserIdOrVanityUrl + ".");
    }
}

module.exports = { generateUserProfile };
