
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import { fade } from 'material-ui/utils/colorManipulator';

const palette = {
    lightBlue: '#346c91',
    mediumBlue: '#18425f',
    darkBlue: '#1b2838',
    darkGray: '#262626',
    lightGray: '#afadad',
    white: '#f9fafb',
    black: '#161616'
};

const muiTheme = getMuiTheme(darkBaseTheme, {
    fontFamily: 'Arial, sans-serif',
    palette: {
        primary1Color: palette.lightBlue,
        primary2Color: palette.lightBlue,
        primary3Color: palette.lightBlue,
        accent1Color: palette.mediumBlue,
        accent2Color: palette.mediumBlue,
        accent3Color: palette.mediumBlue,
        textColor: palette.white,
        secondaryTextColor: palette.white,
        alternateTextColor: palette.white,
        canvasColor: palette.darkBlue,
        borderColor: palette.lightGray,
        pickerHeaderColor: palette.lightGray,
        disabledColor: fade(palette.white, 0.5),
        shadowColor: palette.black
    }
});

export { palette, muiTheme };
