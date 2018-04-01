const express = require('express');

const recommendations = require('recommender/recommender');

const router = express.Router();

router.post('/', (req, res, next) => {

    /*
    Create recommendations for user profiles.
    Send created recommendations back as JSON.
    */

    const { options, profiles } = req.body;
    recommendations.generateRecommendationsForGroup(profiles, 500, (options.clustering ? 5 : 1), 50, options.aggregation)
        .then(recs => res.json(recs))
        .catch(error => next(error));
});

module.exports = router;
