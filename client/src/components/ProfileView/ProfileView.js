import React from 'react';

import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import FlatButton from 'material-ui/FlatButton';
import CircularProgress from 'material-ui/CircularProgress';
import Paper from 'material-ui/Paper';

import add_steam_user from './add_steam_user.png';

import Profile from './Profile';

/**
 * A view displaying a set of user profiles.
 */
export default class ProfileView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            dialogOpen: false,
            dialogInputText: "",
            generatingProfile: false,
            profileGenerationErrorOccurred: false
        };
    }

    static get defaultProps() {
        return {
            profiles: [],
            onAddProfile: null,
            onDeleteProfile: null,
            onChangeProfile: null
        }
    }

    /**
     * Creates a new key (used mostly for UI purposes) that
     * is unique to a profile.
     * @return {Number}
     */
    createUniqueKey() {
        let key = 1;
        while (true) {
            let reserved = false;
            for (const profile of this.props.profiles) {
                if (profile.key === key) {
                    reserved = true;
                    break;
                }
            }
            if (!reserved) {
                return key;
            }
            ++key;
        }
    }

    /**
     * Sends a request to the server to generate a user profile
     * for a Steam user with the given id.
     * @param {String} steamUserId 
     * @return {Promise}
     */
    async generateProfile(steamUserId) {
        const response = await fetch('generateProfile/' + steamUserId.trim());
        if (response.status !== 200) {
            throw new Error("Failed to generate profile for user " + steamUserId + ".");
        }
        else {
            return await response.json();
        }
    }

    /**
     * Adds a new profile to the list of profiles.
     * @param {*} profile 
     * @return {void}
     */
    addProfile(profile = {}) {
        const callback = this.props.onAddProfile;
        if (callback !== undefined && callback !== null) {
            const key = this.createUniqueKey();
            profile = {
                key: key,
                name: "Player " + key,
                data: { tags: {} },
                ...profile
            };
            callback(profile);
        }
    }

    /**
     * Deletes the profile that has the key.
     * @param {Number} profileKey
     * @return {void}
     */
    deleteProfile(profileKey) {
        const callback = this.props.onDeleteProfile;
        if (callback !== undefined && callback !== null) {
            callback(profileKey);
        }
    }

    /**
     * Changes an existing profile that has the key to the new profile.
     * @param {Number} profileKey 
     * @param {*} profile
     */
    changeProfile(profileKey, profile) {
        const callback = this.props.onChangeProfile;
        if (callback !== undefined && callback !== null) {
            callback(profileKey, profile);
        }
    }

    /**
     * Handles a change in the rating of a tag on profile.
     * @param {*} profile 
     * @param {String} tagName 
     * @param {Number} rating 
     * @return {void}
     */
    handleTagRatingChange(profile, tagName, rating) {
        // Modify the profile to have the updated tag rating on it.
        const newProfile = Object.assign({}, profile);
        if (isNaN(rating)) {
            // If a non-number was given, interpret that as deleting the rating
            delete newProfile.data.tags[tagName];
        }
        else {
            newProfile.data.tags[tagName] = rating;
        }
        this.changeProfile(profile.key, newProfile);
    }

    /**
     * Clears the dialog state variables.
     * @param {Boolean} dialogOpen Whether to leave the dialog open or not
     * @return {void}
     */
    clearDialogState(dialogOpen) {
        this.setState({
            profileGenerationErrorOccurred: false,
            generatingProfile: false,
            dialogInputText: '',
            dialogOpen: dialogOpen
        });
    }

    render() {

        const handleCommitSteamProfileName = () => {
            this.setState({ generatingProfile: true });
            this.generateProfile(this.state.dialogInputText)
                .then(profile => {
                    this.addProfile({ data: profile });
                    this.clearDialogState(false);
                })
                .catch(error => {
                    this.clearDialogState(true);
                    this.setState({ profileGenerationErrorOccurred: true });
                });
        }

        const dialogActions = [];

        if (this.state.profileGenerationErrorOccurred) {
            dialogActions.push(
                <FlatButton
                    label='Ok'
                    primary={true}
                    onClick={e => {
                        this.clearDialogState(true);
                    }}
                />
            );
        }
        else if (!this.state.generatingProfile) {
            dialogActions.push(
                <FlatButton
                    label="Add"
                    primary={true}
                    disabled={this.state.dialogInputText.length <= 0}
                    onClick={e => {
                        handleCommitSteamProfileName();
                    }}
                />,
                <FlatButton
                    label="Cancel"
                    primary={true}
                    onClick={e => {
                        this.clearDialogState(false);
                    }}
                />
            );
        }

        return ([
            <Paper style={{ display: 'flex', flexWrap: 'wrap', padding: 10 }} key='profiles'>

                {/* Profiles */}
                {this.props.profiles.length <= 0
                    ? null
                    : <div>
                        {this.props.profiles.map((profile, index) =>
                            <Profile
                                key={profile.key}
                                profile={profile}
                                onTagRatingChange={(tagName, rating) => this.handleTagRatingChange(profile, tagName, rating)}
                                onDelete={() => this.deleteProfile(profile.key)}
                            />)
                        }
                    </div>
                }

                {/* Buttons for creating new profiles */}
                < div style={{ display: 'flex', flexDirection: 'column' }}>
                    <FlatButton
                        label='Add Steam profile'
                        icon={<img src={add_steam_user} style={{ width: 26, height: 26 }} alt='Add Steam profile' />}
                        onClick={e => {
                            this.clearDialogState(true);
                        }}
                    />
                </div >
            </Paper >,

            <Dialog
                key='dialog'
                title="Add Steam profile"
                open={this.state.dialogOpen}
                actions={dialogActions}
                onRequestClose={e => {
                    this.clearDialogState();
                    this.setState({ dialogOpen: false });
                }}
                style={{
                    textAlign: 'center'
                }}
                contentStyle={{
                    maxWidth: 'none',
                    width: 'none',
                    display: 'inline-block'
                }}
            >
                {this.state.profileGenerationErrorOccurred
                    ? <div>Couldn't find a user with the given ID.</div>
                    : this.state.generatingProfile
                        ? <div>
                            <CircularProgress />
                            <p>Generating profile...</p>
                        </div>
                        : <div>
                            <p>Enter a Steam user ID or vanity URL:</p>
                            <TextField
                                ref={input => input && input.focus()} // autofocus
                                name="steamProfileInput"
                                value={this.state.dialogInputText}
                                onChange={(event, value) => { this.setState({ dialogInputText: value }); }}
                                onKeyPress={event => {
                                    if (event.charCode === 13) {
                                        event.preventDefault();
                                        handleCommitSteamProfileName();
                                    }
                                }}
                            />
                        </div>
                }
            </Dialog >
        ]
        );
    }
}
