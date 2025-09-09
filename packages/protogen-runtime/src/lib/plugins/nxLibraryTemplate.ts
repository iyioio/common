import { joinPaths } from "@iyio/common";
import { ProtoOutput } from "@iyio/protogen";

export interface NxLibraryTemplateOptions
{
    path:string;
    packageName:string;
    jsxType?:string;
}

export const nxLibraryTemplate=({
    path,
    packageName,
    jsxType='react-jsx',
}:NxLibraryTemplateOptions):ProtoOutput[]=>{

    const parts=packageName.split('/');
    const name=parts[parts.length-1];

    const outputs:Record<string,string>={

        '.eslintrc.json':
`{
    "extends": ["../../.eslintrc.json"],
    "ignorePatterns": ["!**/*"],
    "overrides": [
        {
            "files": ["*.ts", "*.tsx", "*.js", "*.jsx"],
            "rules": {}
        },
        {
            "files": ["*.ts", "*.tsx"],
            "rules": {}
        },
        {
            "files": ["*.js", "*.jsx"],
            "rules": {}
        }
    ]
}
`,

        'jest.config.ts':
`/* eslint-disable */
export default {
    displayName: '${name}',
    preset: '../../jest.preset.js',
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]s$': [
            'ts-jest',
            { tsconfig: '<rootDir>/tsconfig.spec.json' },
        ],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/${path}',
};
`,

        'package.json':
`{
    "name": "${packageName}",
    "version": "0.0.1",
    "type": "commonjs",
    "sideEffects": false
}
`,

        'project.json':
`{
    "name": "${name}",
    "$schema": "../../node_modules/nx/schemas/project-schema.json",
    "sourceRoot": "${path}/src",
    "projectType": "library",
    "targets": {
        "build": {
            "executor": "@iyio/nx-common:lib-builder",
            "outputs": ["{options.outputPath}"],
            "options": {
                "outputPath": "dist/${path}",
                "main": "${path}/src/index.ts",
                "tsConfig": "${path}/tsconfig.lib.json",
                "assets": ["${path}/*.md"]
            }
        },
        "publish": {
            "executor": "nx:run-commands",
            "options": {
                "command": "node tools/scripts/publish.mjs ${name} {args.ver} {args.tag}"
            },
            "dependsOn": ["build"]
        },
        "lint": {
            "executor": "@nrwl/linter:eslint",
            "outputs": ["{options.outputFile}"],
            "options": {
                "lintFilePatterns": ["${path}/**/*.ts"]
            }
        },
        "test": {
            "executor": "@nrwl/jest:jest",
            "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
            "options": {
                "jestConfig": "${path}/jest.config.ts",
                "passWithNoTests": true
            },
            "configurations": {
                "ci": {
                    "ci": true,
                    "codeCoverage": true
                }
            }
        }
    },
    "tags": []
}
`,

        'tsconfig.json':
`{
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
        "module": "commonjs",
        "jsx": "${jsxType}",
        "forceConsistentCasingInFileNames": true,
        "strict": true,
        "noUncheckedIndexedAccess": true,
        "noImplicitOverride": true,
        "noPropertyAccessFromIndexSignature": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true
    },
    "files": [],
    "include": [],
    "references": [
        {
            "path": "./tsconfig.lib.json"
        },
        {
            "path": "./tsconfig.spec.json"
        }
    ]
}
`,

        'tsconfig.lib-esm.json':
`{
    "extends": "./tsconfig.lib.json",
    "compilerOptions": {
        "module": "ES2020"
    }
}
`,

        'tsconfig.spec.json':
`{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "outDir": "../../dist",
        "module": "commonjs",
        "types": ["jest", "node"]
    },
    "include": [
        "jest.config.ts",
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "src/**/*.d.ts"
    ]
}
`,

        'tsconfig.lib.json':
`{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "outDir": "../../dist",
        "declaration": true,
        "types": ["node"]
    },
    "include": ["src/**/*.ts"],
    "exclude": ["jest.config.ts", "src/**/*.spec.ts", "src/**/*.test.ts"]
}
`,
    }


    return Object.keys(outputs).map<ProtoOutput>(name=>({
        path:joinPaths(path,name),
        content:outputs[name]??'',
        overwrite:false,
    }));

}
