/* eslint-disable */
export default {
    displayName: 'supabase-common',
    preset: '../../jest.preset.js',
    testEnvironment: 'node',
    transform: {
        '^.+.[tj]s$': [
            'ts-jest',
            { tsconfig: '<rootDir>/tsconfig.spec.json' },
        ],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/packages/supabase-common',
};
