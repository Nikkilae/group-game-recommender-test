import React from 'react';

import ThumbUpIcon from 'material-ui/svg-icons/action/thumb-up';
import ThumbDownIcon from 'material-ui/svg-icons/action/thumb-down';
import ThumbsUpDownIcon from 'material-ui/svg-icons/action/thumbs-up-down';

import { palette } from 'theme';

/**
 * Figure rating display info based on user score
 * @param {Number} userScore 
 * @param {*} iconProps 
 * @return {*}
 */
function ratingInfo(userScore, iconProps) {
    if (userScore >= 95) {
        return { text: 'Overwhelmingly positive', color: 'green', icon: <ThumbUpIcon {...iconProps} color='green' /> };
    }
    else if (userScore >= 80) {
        return { text: 'Very positive', color: 'green', icon: <ThumbUpIcon {...iconProps} color='green' /> };
    }
    else if (userScore >= 70) {
        return { text: 'Mostly positive', color: 'green', icon: <ThumbUpIcon {...iconProps} color='green' /> };
    }
    else if (userScore >= 40) {
        return { text: 'Mixed', color: 'orange', icon: <ThumbsUpDownIcon {...iconProps} color='orange' /> };
    }
    else if (userScore >= 20) {
        return { text: 'Mostly negative', color: 'red', icon: <ThumbDownIcon {...iconProps} color='red' /> };
    }
    else if (userScore >= 19) {
        return { text: 'Very negative', color: 'red', icon: <ThumbDownIcon {...iconProps} color='red' /> };
    }
    return { text: 'Overwhelmingly negative', color: 'red', icon: <ThumbDownIcon {...iconProps} color='red' /> };
}

/**
 * A component to display a single game recommendation.
 */
export default class Recommendation extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            hovering: false
        };
    }

    static get defaultProps() {
        return {
            appDetails: null
        }
    }

    render() {

        /** All the info that can and should be displayed */
        const displayInfo = {
            name: '',
            image: '',
            storeLink: '',
            tags: [],
            hasMoreTags: false,
            ratingInfo: { text: null, icon: null }
        };

        const appDetails = this.props.appDetails;

        // Replace default display info with actual info if such info exists
        if (appDetails !== null) {
            const allTags = Object.keys(appDetails.steamSpyDetails.tags);

            displayInfo.name = appDetails.storeDetails.Name;
            displayInfo.image = appDetails.storeDetails.HeaderImage;
            displayInfo.storeLink = 'http://store.steampowered.com/app/' + appDetails.storeDetails.SteamAppId;
            displayInfo.tags = appDetails.uiDetails.tagsPreferredByProfiles.slice().splice(0, 10);
            displayInfo.hasMoreTags = displayInfo.tags.length < allTags.length;
            displayInfo.ratingInfo = ratingInfo(appDetails.steamSpyDetails.userscore, { style: { height: '1em' } });
        }

        return (
            <div style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                width: 345
            }}>
                <div
                    style={{
                        position: 'absolute',
                        top: 0, bottom: 0, left: 0, right: 0
                    }}
                />
                <a href={displayInfo.storeLink} target='_blank'>
                    <div style={{
                        backgroundImage: 'url(' + displayInfo.image + ')',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'contain',
                        height: 162,
                        position: 'relative'
                    }}
                        onMouseEnter={() => this.setState({ hovering: true })}
                        onMouseLeave={() => this.setState({ hovering: false })}
                    >
                        <div style={{
                            position: 'absolute',
                            top: 0, bottom: 0, left: 0, right: 0,
                            backgroundColor: palette.white,
                            transition: 'opacity 0.25s',
                            opacity: this.state.hovering ? 0.25 : 0
                        }} />
                    </div>
                </a>
                <div style={{
                    height: '3.2em',
                    textAlign: 'left',
                    backgroundColor: palette.mediumBlue,
                    background: 'linear-gradient(' + palette.mediumBlue + ', rgba(0, 0, 0, 0))',
                    color: palette.lightGray,
                    padding: 5
                }}>
                    <div style={{ whiteSpace: 'wrap' }}>
                        <strong>Tags:</strong> <em>{displayInfo.tags.join(', ')}{displayInfo.hasMoreTags ? ', ...' : null}</em>
                    </div>
                </div>
            </div>
        );
    }
}
