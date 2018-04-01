
const path = require('path');

/*
 * Paths to various files and directories of interest containing Steam data.
 */

const root = path.join(__dirname, '../steamData');
const games = path.join(root, 'games');
const tagData = path.join(root, 'tagData.json');
const relevantCategoriesAndTags = path.join(root, 'relevantCategoriesAndTags.json');
function appDetails(appId) {
    return path.join(games, appId + '.json');
}

module.exports = {
    root,
    games,
    tagData,
    relevantCategoriesAndTags,
    appDetails
};
