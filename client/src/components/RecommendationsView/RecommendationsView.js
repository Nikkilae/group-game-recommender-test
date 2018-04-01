import React from 'react';
import IconButton from 'material-ui/IconButton';
import Paper from 'material-ui/Paper';

import ArrowForwardIcon from 'material-ui/svg-icons/navigation/arrow-forward';
import ArrowBackIcon from 'material-ui/svg-icons/navigation/arrow-back';

import Recommendation from './Recommendation';

/**
 * A view displaying a set of game recommendations.
 */
export default class RecommendationsView extends React.Component {

    static get defaultProps() {
        return {
            recommendationAppDetails: [],
            recommendationFilters: {},
            recommendationStartIndex: 0,
            recommendationCount: 0,
            waitingForFilterUpdate: false,

            onChangeRecommendationFilters: null,
            onChangeRecommendationStartIndex: null
        };
    }

    /**
     * Changes recommendation filters to new ones. Only replaces values
     * in the filters on keys given in the new filters.
     * @param {*} newFilters 
     * @return {void}
     */
    changeRecommendationFilters(newFilters) {
        const callback = this.props.onChangeRecommendationFilters;
        if (callback !== null && callback !== undefined) {
            callback(Object.assign(this.props.recommendationFilters, newFilters));
        }
    }

    /**
     * Changes the recommendation start index.
     * @param {Number} newIndex 
     * @return {void}
     */
    changeRecommendationStartIndex(newIndex) {
        const callback = this.props.onChangeRecommendationStartIndex;
        if (callback !== null && callback !== undefined) {
            callback(newIndex);
        }
    }

    render() {

        return (
            <div>
                <div style={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'center' }}>

                    <Paper style={{ flexBasis: '75%', textAlign: 'center', margin: 5, padding: 10 }}>

                        {/* List of recommendations */}
                        <h3>Recommendations</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {this.props.recommendationAppDetails.map((appDetails, index) =>
                                <div key={appDetails.storeDetails.SteamAppId} style={{ margin: 5 }}>
                                    <div style={{ backgroundColor: 'black', color: 'white' }}>
                                        <b>{this.props.recommendationStartIndex + index + 1}.</b>
                                    </div>
                                    <Recommendation appDetails={appDetails} />
                                </div>
                            )}
                        </div>

                        {/* Pagination controls */}
                        <div style={{ display: 'flex', alignContent: 'center', justifyContent: 'center' }}>
                            <IconButton onClick={e => {
                                this.changeRecommendationStartIndex(this.props.recommendationStartIndex - this.props.recommendationCount)
                            }}>
                                <ArrowBackIcon />
                            </IconButton>
                            <h4>{this.props.recommendationStartIndex}-{this.props.recommendationStartIndex + this.props.recommendationAppDetails.length}</h4>
                            <IconButton onClick={e => {
                                this.changeRecommendationStartIndex(this.props.recommendationStartIndex + this.props.recommendationCount)
                            }}>
                                <ArrowForwardIcon />
                            </IconButton>
                        </div>

                    </Paper>

                </div>

            </div>

        );
    }
}
