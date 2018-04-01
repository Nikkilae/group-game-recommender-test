
const { URL } = require('url');

/**
 * Sends an http or https request and returns the response data if successful.
 * @param {*} options 
 * @return {Promise<String>} Response data
 */
function get(options) {
    return new Promise((resolve, reject) => {

        function callback(response) {
            const statusCode = response.statusCode;
            if (statusCode !== 200) {
                response.resume();
                return reject(new Error("Request failed. Status code: " + statusCode));
            }
            else {
                let data = '';
                response.on('data', chunk => { data += chunk; });
                response.on('end', () => { return resolve(data); });
                response.on('error', error => { return reject(error); });
            }
        }

        let url;
        if (typeof options === 'string' || options instanceof String || options instanceof URL) {
            url = options;
        }
        else if (options instanceof Object) {
            url = options.url;
        }

        url.startsWith('https')
            ? require('https').get(options, callback)
            : require('http').get(options, callback);
    });
}

module.exports = { get };
