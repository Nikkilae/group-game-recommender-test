import React from 'react';
import Slider from 'material-ui/Slider';

/**
 * A wrapper for material-ui/Slider with a callback
 * property that is similar to Slider's onDragStop with the exception
 * that it also passes the new value in the callback.
 */
export default class LazySlider extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            value: 0
        };
    }

    static get defaultProps() {
        return {
            sliderProps: {},
            onCommit: null
        };
    }

    handleOnDragStop(event) {
        const callback = this.props.onCommit;
        if (callback !== undefined && callback !== null) {
            callback(event, this.state.value);
        }
    }

    render() {
        return <Slider
            {...this.props.sliderProps}
            onChange={(event, value) => this.setState({ value })}
            onDragStop={event => this.handleOnDragStop(event)}
        />
    }

}
