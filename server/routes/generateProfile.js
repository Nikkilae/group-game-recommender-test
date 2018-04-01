const express = require('express');

const profiler = require('recommender/profiler');

const router = express.Router();

router.get('/:steamUserId', (req, res, next) => {

    /*
    Generate a user profile for the recommender system from a Steam user account.
    Send generated user profile back as JSON.
    */

    const steamUserId = req.params['steamUserId'];
    profiler.generateUserProfile(steamUserId)
        .then(profile => res.json(profile))
        .catch(error => next(error));
});

module.exports = router;
