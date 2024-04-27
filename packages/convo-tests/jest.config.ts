/* eslint-disable */
export default {
    displayName: 'convo-tests',
    preset: '../../jest.preset.js',
    testEnvironment: 'node',
    transform: {
        '^.+.[tj]s$': [
            'ts-jest',
            { tsconfig: '<rootDir>/tsconfig.spec.json' },
        ],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/packages/convo-tests',
};
