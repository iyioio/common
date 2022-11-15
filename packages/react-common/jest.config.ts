/* eslint-disable */
export default {
    displayName: 'react-common',
    preset: "../../jest.preset.js",
    transform: {
        "^.+\\.[tj]sx?$": "babel-jest",
    },
    moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
    coverageDirectory: '../../coverage/packages/react-common',
};
