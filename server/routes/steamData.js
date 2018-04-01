const express = require('express');

const steamDataAccess = require('steamDataAccess');

const router = express.Router();

/*
 * Endpoints for accessing steam data on the server.
*/

router.get('/appDetails/:appId', (req, res, next) => {
    const appId = req.params['appId'];
    steamDataAccess.apps.appDetails(appId)
        .then(appDetails => res.json(appDetails))
        .catch(error => next(error));
});

router.post('/appDetails', (req, res, next) => {
    const appIds = req.body;
    Promise.all(appIds.map(appId => steamDataAccess.apps.appDetails(appId)))
        .then(appDetails => res.json(appDetails))
        .catch(error => next(error));
});

router.post('/appDetailsFiltered', (req, res, next) => {
    const appIds = req.body.appIds || [];
    const filters = req.body.filters || {};
    const startIndex = req.body.startIndex || 0;
    const maxCount = req.body.maxCount || appIds.length;
    steamDataAccess.apps.manyAppDetailsFiltered(appIds, filters, startIndex, maxCount)
        .then(appDetailsList => res.json(appDetailsList))
        .catch(error => next(error));
});

router.get('/tagData', (req, res, next) => {
    steamDataAccess.tagData.tagData()
        .then(tagData => res.json(tagData))
        .catch(error => next(error));
});

router.get('/tags', (req, res, next) => {
    steamDataAccess.tagData.tags()
        .then(tags => res.json(tags))
        .catch(error => next(error));
});

module.exports = router;
