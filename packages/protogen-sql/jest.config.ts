/* eslint-disable */
export default {
    displayName: 'protogen-sql',
    preset: '../../jest.preset.js',
    testEnvironment: 'node',
    transform: {
        '^.+\.[tj]s$': [
            'ts-jest',
            { tsconfig: '<rootDir>/tsconfig.spec.json' },
        ],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/packages/protogen-sql',
};
