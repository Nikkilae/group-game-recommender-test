
const fs = require('promisified/fs');

const tagDataPath = require('./paths').tagData;
const blacklist = new Set([
    "e-sports",
    "Software",
    "Animation & Modeling",
    "Split Screen",
    "3D Vision",
    "Short",
    "Kickstarter",
    "Multiplayer",
    "Singleplayer",
    "Co-op",
    "Online Co-Op",
    "Free to Play",
    "Local Co-Op",
    "4 Player Local",
    "Early Access",
    "Local Multiplayer",
    "Design & Illustration",
    "Utilities",
    "Game Development"
]);

/**
* Gets all tag data.
* @return {Promise}
*/
async function tagData() {
    return JSON.parse(await fs.readFile(tagDataPath, 'utf8'));
}

/**
 * Gets an array of all existing tags in the order of frequency.
 * @return {Promise<Array<String>>}
 */
async function tags() {
    const freq = (await tagData()).tagFrequency;
    return Object.keys(freq).sort((n1, n2) => freq[n2] - freq[n1]);
}

module.exports = { tagData, tags, blacklist };
