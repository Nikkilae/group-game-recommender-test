
const path = require('path');

const pGlob = require('promisified/glob');
const pFs = require('promisified/fs');

const paths = require('./paths');
const relevantCategoriesAndTags = require('./relevantCategoriesAndTags');

/**
 * Gets all existing apps' IDs
 */
async function appIds() {
    const filenames = await pGlob(paths.games + '/*.json');
    return filenames.map(filename => path.basename(filename, '.json'));
}

/**
 * Gets the app details of an app with an app id.
 * @param {Number} appId
 * @return {Promise}
 */
async function appDetails(appId) {
    return JSON.parse(await pFs.readFile(paths.appDetails(appId), 'utf8'));
}

/**
 * Checks if data for an app exists.
 * @param {Number} appId 
 * @return {Promise<Boolean>}
 */
async function appDetailsExist(appId) {
    return await pFs.exists(paths.appDetails(appId));
}

/**
 * Gets app details for a sequence of app IDs filtered.
 * @param {Array<Number>} appIds 
 * @param {*} filters 
 * @param {Number} startIndex 
 * @param {Number} maxCount 
 * @return {Promise<Array>}
 */
async function manyAppDetailsFiltered(appIds, filters, startIndex, maxCount) {

    const defaultFilters = {
        multiplayer: false,
        online: false,
        coop: false,
        localMultiplayer: false,
        minUserScore: 0
    };
    filters = { ...defaultFilters, ...filters };

    function appPassesFilters(appDetails, filters) {

        const appCategories = appDetails.storeDetails.Categories.map(c => c["Description"]);
        const appTags = Object.keys(appDetails.steamSpyDetails.tags);

        // Check the filters that are applicable to checking through an overlap of relevant categories and tags
        for (const key of ['multiplayer', 'online', 'coop', 'localMultiplayer']) {
            if (filters[key]) {
                if (appCategories.filter(cat => relevantCategoriesAndTags[key].categories.has(cat)).length > 0) {
                    continue;
                }
                if (appTags.filter(tag => relevantCategoriesAndTags[key].tags.has(tag)).length > 0) {
                    continue;
                }
                return false;
            }
        }

        if (appDetails.steamSpyDetails.userscore < filters.minUserScore) {
            return false;
        }

        return true;
    }

    const filteredAppDetailsList = [];
    let passingBufferCount = 0;
    for (const appId of appIds) {
        if (filteredAppDetailsList.length >= maxCount) {
            return filteredAppDetailsList;
        }
        else {
            const app = await appDetails(appId);
            if (appPassesFilters(app, filters)) {
                if (passingBufferCount >= startIndex) {
                    filteredAppDetailsList.push(app);
                }
                else {
                    ++passingBufferCount;
                }
            }
        }
    }
    return filteredAppDetailsList;
}

module.exports = { appDetails, appIds, appDetailsExist, manyAppDetailsFiltered };
