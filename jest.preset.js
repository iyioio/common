const nxPreset = require('@nrwl/jest/preset').default;

module.exports = {
    ...nxPreset,
    moduleNameMapper:{
        '#node-web-compat':'./node-web-compat-node.js',
    },
};
