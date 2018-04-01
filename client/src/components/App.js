import React from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
import CircularProgress from 'material-ui/CircularProgress';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';
import People from 'material-ui/svg-icons/social/people';
import PeopleOutline from 'material-ui/svg-icons/social/people-outline';
import Person from 'material-ui/svg-icons/social/person';
import PersonOutline from 'material-ui/svg-icons/social/person-outline';

import { muiTheme } from 'theme';

import ProfileView from 'components/ProfileView';
import RecommendationsView from 'components/RecommendationsView';

const testSettings = {
    'single': {
        'single-a': {
            label: 'Single user recommendations A',
            options: { clustering: true, aggregation: 'BC' }
        },
        'single-b': {
            label: 'Single user recommendations B',
            options: { clustering: false, aggregation: 'BC' }
        },
    },
    'group': {
        'group-a': {
            label: 'Group recommendations A',
            options: { clustering: true, aggregation: 'BC' }
        },
        'group-b': {
            label: 'Group recommendations B',
            options: { clustering: true, aggregation: 'LM' }
        },
        'group-c': {
            label: 'Group recommendations C',
            options: { clustering: false, aggregation: 'BC' }
        },
        'group-d': {
            label: 'Group recommendations D',
            options: { clustering: false, aggregation: 'LM' }
        }
    }
};

const recommendationCount = 20;

/**
 * A convenience function for easily sending a post request (via fetch())
 * with a JSON body along the request.
* @param {String} input
* @param {*} body
        */
async function fetchPostWithJsonBody(input, body) {
    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-Type', 'application/json');
    return await fetch(input, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });
}

/**
 * The root component of the application.
 */
class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            recommendationAppIds: [],
            recommendationAppDetails: [],
            recommendationStartIndex: 0,
            recommendationFilters: { minUserScore: 50 },
            singleRecSetting: Object.keys(testSettings['single'])[0],
            groupRecSetting: Object.keys(testSettings['group'])[0],
            profiles: [],
            waitingForRecommendations: false,
            waitingForFilterUpdate: false
        };

        this.filterChangeTimeout = setTimeout(0);
    }

    /**
     * Handles an addition of a new user profile.
     * @param {*} profile
     * @return {void}
            */
    handleAddProfile(profile) {
        const profiles = this.state.profiles.slice();
        profiles.push(profile);
        this.setState({ profiles });
    }

    /**
     * Handles a deletion of an existing user profile that has the key.
 * @param {Number} key
 * @return {void}
        */
    handleDeleteProfile(key) {
        for (let i = 0; i < this.state.profiles.length; ++i) {
            if (this.state.profiles[i].key === key) {
                let profiles = this.state.profiles.slice();
                profiles.splice(i, 1);
                this.setState({ profiles });
                break;
            }
        }
    }

    /**
     * Handles a change to an existing user profile that has the key.
         * @param {Number} key
         * @param {*} newProfile
         * @return {void}
                */
    handleChangeProfile(key, newProfile) {
        for (let i = 0; i < this.state.profiles.length; ++i) {
            if (this.state.profiles[i].key === key) {
                const profiles = this.state.profiles.slice();
                profiles[i] = newProfile;
                this.setState({ profiles });
                break;
            }
        }
    }

    /**
     * Handles a change in the list of recommended apps' IDs.
         * @param {Array<Number>} newRecommendationAppIds
         * @return {void}
                */
    handleChangeRecommendationAppIds(newRecommendationAppIds) {
        this.setState({ recommendationAppIds: newRecommendationAppIds }, () => {
            this.updateVisibleRecommendations();
        });
    }

    /**
     * Handles a change in the recommendation filters.
* @param {*} newFilters
* @return {void}
    */
    handleChangeRecommendationFilters(newFilters) {
        this.setState({ recommendationFilters: newFilters, waitingForFilterUpdate: true }, () => {
            clearTimeout(this.filterChangeTimeout);
            this.filterChangeTimeout = setTimeout(() => {
                this.setState({ recommendationStartIndex: 0 }, () => {
                    this.updateVisibleRecommendations()
                        .then(() => {
                            this.setState({ waitingForFilterUpdate: false });
                        })
                        .catch(error => console.error(error));
                });
            }, 1000);
        });
    }

    /**
     * Handles a change in the recommendation start index.
* @param {Number} newStartIndex
* @return {void}
    */
    handleChangeRecommendationStartIndex(newStartIndex) {
        const dffo = (newStartIndex, checkForEmpty) => {
            const oldStartIndex = this.state.recommendationStartIndex;
            newStartIndex = Math.max(newStartIndex, 0);
            this.setState({ recommendationStartIndex: newStartIndex }, () => {
                this.updateVisibleRecommendations()
                    .then(() => {
                        if (checkForEmpty && this.state.recommendationAppDetails.length <= 0) {
                            dffo(oldStartIndex, false);
                        }
                    })
                    .catch(e => console.error(e));
            });
        }
        dffo(newStartIndex, true);
    }

    /**
     * Handles a change in the single user recommendations setting
     * @param {String} value
    */
    handleChangeSingleUserRecSetting(value) {
        this.setState({ singleRecSetting: value });
    }

    /**
     * Handles a change in the group recommendations setting
     * @param {String} value
    */
    handleChangeGroupRecSetting(value) {
        this.setState({ groupRecSetting: value });
    }

    /**
     * According to current app id list and settings, fetches app details
     * for a sequence of apps to be displayed.
     */
    async updateVisibleRecommendations() {

        const profiles = this.state.profiles.slice();
        const requestBody = {
            appIds: this.state.recommendationAppIds,
            filters: this.state.recommendationFilters,
            startIndex: this.state.recommendationStartIndex,
            maxCount: recommendationCount
        };

        const recommendationAppDetails = await (await fetchPostWithJsonBody('/steamData/appDetailsFiltered', requestBody)).json();
        for (const appDetails of recommendationAppDetails) {
            const tagRatings = appDetails.steamSpyDetails.tags;
            const tagsPreferredByProfiles = Object.keys(tagRatings).slice().sort((tag1, tag2) => {
                let n1 = 1;
                let n2 = 1;
                for (const profile of profiles) {
                    n1 *= (profile.data.tags[tag1] || 0);
                    n2 *= (profile.data.tags[tag2] || 0);
                }
                return (n1 !== n2) ? (n2 - n1) : (tagRatings[tag2] - tagRatings[tag1]);
            });
            appDetails.uiDetails = { tagsPreferredByProfiles };
        }
        this.setState({ recommendationAppDetails });
    }

    /**
     * Requests a generation of recommendations for current user profiles and updates
     * the state at the arrival of said recommendations.
     */
    async generateRecommendations() {
        this.setState({ waitingForRecommendations: true });
        const profiles = this.state.profiles.map(profile => profile.data);
        const options = this.state.profiles.length <= 1
            ? testSettings['single'][this.state.singleRecSetting].options
            : testSettings['group'][this.state.groupRecSetting].options;
        const data = { profiles, options };
        const recommendationAppIds = await (await fetchPostWithJsonBody('recommendations', data)).json();
        this.handleChangeRecommendationAppIds(recommendationAppIds);
        this.setState({ waitingForRecommendations: false });
    }

    render() {

        return (
            <MuiThemeProvider muiTheme={muiTheme}>

                <div>
                    <Paper style={{
                        backgroundColor: 'rgba(0, 0, 0, 0)',
                        boxShadow: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        paddingTop: 30
                    }}>

                        <h1>Testing version</h1>

                        {/* Profiles */}
                        <ProfileView
                            profiles={this.state.profiles}
                            onAddProfile={p => this.handleAddProfile(p)}
                            onDeleteProfile={k => this.handleDeleteProfile(k)}
                            onChangeProfile={(key, profile) => this.handleChangeProfile(key, profile)}
                        />

                        {/* Recommendations */}
                        <div style={{ marginTop: 30 }}>

                            {this.state.waitingForRecommendations

                                // If waiting for recommendations, display a loading indicator
                                ? <div style={{ textAlign: 'center' }}>
                                    <div><CircularProgress /></div>
                                    <p>Generating recommendations. Please wait.</p>
                                </div>

                                // If not waiting for recommendations, display them
                                : <div>
                                    {this.state.profiles.length <= 0
                                        ? null
                                        : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <p>
                                                The setting below changes some parameters in the recommendation algorithms, which will affect the results.<br />
                                                Please follow the instructions in the survey and select the appropriate setting accordingly.
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <div>
                                                    {this.state.profiles.length <= 1
                                                        ? <RadioButtonGroup
                                                            name='singleRecSettings'
                                                            style={{ minWidth: 300 }}
                                                            valueSelected={this.state.singleRecSetting}
                                                            onChange={(_, v) => { this.handleChangeSingleUserRecSetting(v) }}
                                                        >
                                                            {Object.keys(testSettings['single']).map(key =>
                                                                <RadioButton
                                                                    key={key} value={key} label={testSettings['single'][key].label}
                                                                    checkedIcon={<Person />} uncheckedIcon={<PersonOutline />}
                                                                />)}
                                                        </RadioButtonGroup>
                                                        : <RadioButtonGroup
                                                            name='groupRecSettings'
                                                            style={{ minWidth: 300 }}
                                                            valueSelected={this.state.groupRecSetting}
                                                            onChange={(_, v) => { this.handleChangeGroupRecSetting(v) }}
                                                        >
                                                            {Object.keys(testSettings['group']).map(key =>
                                                                <RadioButton
                                                                    key={key} value={key} label={testSettings['group'][key].label}
                                                                    checkedIcon={<People />} uncheckedIcon={<PeopleOutline />}
                                                                />)}
                                                        </RadioButtonGroup>}
                                                </div>
                                                <RaisedButton
                                                    label={'Generate recommendations'}
                                                    primary={true}
                                                    onClick={e => this.generateRecommendations()}
                                                />
                                            </div>
                                        </div>}
                                    {this.state.recommendationAppIds.length <= 0
                                        ? null
                                        : <RecommendationsView
                                            recommendationAppDetails={this.state.recommendationAppDetails}
                                            recommendationFilters={this.state.recommendationFilters}
                                            recommendationStartIndex={this.state.recommendationStartIndex}
                                            recommendationCount={recommendationCount}
                                            waitingForFilterUpdate={this.state.waitingForFilterUpdate}
                                            onChangeRecommendationFilters={newFilters => this.handleChangeRecommendationFilters(newFilters)}
                                            onChangeRecommendationStartIndex={newIndex => this.handleChangeRecommendationStartIndex(newIndex)}
                                        />
                                    }
                                </div>
                            }

                        </div>
                    </Paper>
                </div>
            </MuiThemeProvider >
        );
    }
}

export default App;
