import React from 'react';

import Avatar from 'material-ui/Avatar';
import IconButton from 'material-ui/IconButton';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';
import Chip from 'material-ui/Chip';

import ClearIcon from 'material-ui/svg-icons/content/clear';
import ListIcon from 'material-ui/svg-icons/action/list';
import PersonIcon from 'material-ui/svg-icons/social/person';
import FileDownloadIcon from 'material-ui/svg-icons/file/file-download';

let existingTags;
async function getExistingTags() {
    if (existingTags === undefined) {
        existingTags = await (await fetch('steamData/tags')).json();
    }
    return existingTags;
}

/**
 * A component to display a single user profile.
 */
export default class Profile extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            editorOpen: false,
            tagSearchText: '',
            suggestedTags: [],
            profileDownloadOpen: false
        };
    }

    static get defaultProps() {
        return {
            profile: null,
            onTagRatingChange: null,
            onDelete: null
        };
    }

    /**
     * Changes a rating of a tag on this profile.
     * @param {String} tagName 
     * @param {Number} rating 
     * @return {void}
     */
    changeTagRating(tagName, rating) {
        rating = Math.min(Math.max(0, rating), 1);
        const callback = this.props.onTagRatingChange;
        if (callback !== null && callback !== undefined) {
            callback(tagName, rating);
        }
    }

    /**
     * Deletes this profile.
     * @return {void}
     */
    delete() {
        const callback = this.props.onDelete;
        if (callback !== null && callback !== undefined) {
            callback();
        }
    }

    makeDownloadedProfileText() {
        return JSON.stringify(this.props.profile.data.tags, null, 4);
    }

    downloadProfile() {
        const filename = 'profile.json';
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.makeDownloadedProfileText()));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    /**
     * Gets a sequence of tags that don't yet have a rating on this profile.
     * @param {Array<String>} ratedTags 
     * @param {Number} maxNumber 
     * @return {Promise<Array<String>>}
     */
    async getExistingNonRatedTags(ratedTags, maxNumber) {
        const tags = [];
        for (const existingTag of await getExistingTags()) {
            if (tags.length >= maxNumber) {
                break;
            }
            if (!(ratedTags.indexOf(existingTag) >= 0)) {
                tags.push(existingTag);
            }
        }
        return tags;
    }

    /**
     * Finds all tags that match the given regular expression.
     * @param {String} pattern 
     * @param {Number} maxNumber 
     * @return {Promise<Array<String>>}
     */
    async findExistingNonRatedTags(pattern, maxNumber) {
        pattern = pattern.split(' ').join(''); // Remove spaces
        const tags = [];
        const regex = new RegExp(pattern, 'i');
        for (const existingTag of await getExistingTags()) {
            if (tags.length >= maxNumber) {
                break;
            }
            if (regex.test(existingTag.split(' ').join(''))) {
                tags.push(existingTag);
            }
        }
        return tags;
    }

    /**
     * Changes the search text string.
     * @param {String} text 
     * @return {void}
     */
    changeTagSearchText(text) {
        this.setState({ tagSearchText: text }, () => this.updateSuggestedTags());
    }

    /**
     * Updates visible suggested tags according to current search text.
     * @return {Promise<void>}
     */
    async updateSuggestedTags() {
        const searchText = this.state.tagSearchText.trim();
        const suggestionCount = 5;
        this.setState({ suggestedTags: await this.findExistingNonRatedTags(searchText, suggestionCount) });
    }

    render() {

        /** Display info for the profile, no matter if its a Steam profile or not. */
        const profileDisplayInfo = {
            name: this.props.profile.name,
            avatar: null,
            icon: <PersonIcon />,
            profileLink: null
        }
        const userData = this.props.profile.data.userData;
        if (userData !== null && userData !== undefined) {
            profileDisplayInfo.name = userData.personaname;
            profileDisplayInfo.avatar = userData.avatarfull;
            profileDisplayInfo.icon = null;
            profileDisplayInfo.profileLink = userData.profileurl;
        }

        const tagRatings = this.props.profile.data.tags || {};
        const tagsInOrderOfRating = Object.keys(tagRatings).sort((n1, n2) => {
            if (tagRatings[n1] < tagRatings[n2]) {
                return 1;
            }
            if (tagRatings[n1] > tagRatings[n2]) {
                return -1;
            }
            return 0;
        });

        return (
            <div>

                {/* Profile display info and actions */}
                <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <a href={profileDisplayInfo.profileLink} target='_blank'>
                            <Avatar src={profileDisplayInfo.avatar} icon={profileDisplayInfo.icon} />
                        </a>
                        <span style={{ paddingLeft: 10 }}>
                            {profileDisplayInfo.name}
                        </span>
                    </div>
                    <div>
                        <IconButton
                            onClick={_ => this.setState({ profileDownloadOpen: true })}
                            tooltip='Download profile'
                        >
                            <FileDownloadIcon />
                        </IconButton>
                        <IconButton
                            onClick={e => { this.setState({ editorOpen: true }); this.updateSuggestedTags(); }}
                            tooltip='View tags'
                        >
                            <ListIcon />
                        </IconButton>
                        <IconButton
                            onClick={e => this.delete()}
                            tooltip='Remove'
                        >
                            <ClearIcon />
                        </IconButton>
                    </div>
                </div>

                <Dialog
                    open={this.state.profileDownloadOpen}
                    onRequestClose={_ => this.setState({ profileDownloadOpen: false })}
                    title='Download profile info'
                    autoScrollBodyContent
                    actions={[
                        <RaisedButton primary onClick={_ => this.downloadProfile()}>Download</RaisedButton>,
                        <RaisedButton secondary onClick={_ => this.setState({ profileDownloadOpen: false })}>Cancel</RaisedButton>
                    ]}
                >
                    <p>
                        Please enter the following profile data to the survey when requested.
                        You may either copy and paste the text directly or you can press "Download"
                        to download it as a text file on your browser.
                    </p>
                    <p>The data will be used anonymously.</p>
                    <pre style={{ color: 'white' }}>{this.makeDownloadedProfileText()}</pre>
                </Dialog>

                {/* Dialog for configuring tag ratings */}
                <Dialog
                    open={this.state.editorOpen}
                    onRequestClose={e => this.setState({ editorOpen: false })}
                    autoScrollBodyContent
                    title={
                        /* Profile display info */
                        <div style={{ display: 'flex', alignContent: 'center' }}>
                            <a href={profileDisplayInfo.profileLink} target='_blank'>
                                <Avatar size={80} src={profileDisplayInfo.avatar} icon={profileDisplayInfo.icon} />
                            </a>
                            <h2 style={{ paddingLeft: 20 }}>{profileDisplayInfo.name}</h2>
                        </div>
                    }>

                    {/* Tag ratings and actions */}
                    {tagsInOrderOfRating.length <= 0
                        ? null
                        : <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div>
                                {tagsInOrderOfRating.slice(0, Math.floor(tagsInOrderOfRating.length / 2)).map((tagName, i) =>
                                    <div key={tagName} style={{ display: 'flex', alignItems: 'center' }}>
                                        <div style={{ width: 30 }}>{i + 1}</div>
                                        <Chip>{tagName}</Chip>
                                    </div>
                                )}
                            </div>
                            <div>
                                {tagsInOrderOfRating.slice(Math.ceil(tagsInOrderOfRating.length / 2)).map((tagName, i) =>
                                    <div key={tagName} style={{ display: 'flex', alignItems: 'center' }}>
                                        <div style={{ width: 30 }}>{i + Math.ceil(tagsInOrderOfRating.length / 2) + 1}</div>
                                        <Chip>{tagName}</Chip>
                                    </div>
                                )}
                            </div>
                        </div>
                    }

                </Dialog >
            </div >
        );
    }
}
