/* eslint-disable */
export default {
    displayName: '___$name___',
    preset: '../../jest.preset.js',
    testEnvironment: 'node',
    transform: {
        '^.+\.[tj]s$': [
            'ts-jest',
            { tsconfig: '<rootDir>/tsconfig.spec.json' },
        ],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/packages/___$name___',
};
