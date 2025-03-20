/* eslint-disable */
export default {
    displayName: 'json5',
    preset: '../../jest.preset.js',
    testEnvironment: 'node',
    transform: {
        '^.+.[tj]s$': [
            'ts-jest',
            { tsconfig: '<rootDir>/tsconfig.spec.json' },
        ],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/packages/json5',
};
