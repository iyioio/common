export interface PkgOptions{
    name:string;
    namespace:string;
}

export const pkg=({
    name,
    namespace,
}:PkgOptions)=>{
    const files={
".eslintrc.json":
/*json*/`{
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
"jest.config.ts":
/*ts*/`/* eslint-disable */
export default {
    displayName: '${name}',
    preset: '../../jest.preset.js',
    testEnvironment: 'node',
    transform: {
        '^.+\.[tj]s$': [
            'ts-jest',
            { tsconfig: '<rootDir>/tsconfig.spec.json' },
        ],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/packages/${name}',
};
`,
"package.json":
/*json*/`{
    "name": "@${namespace}/${name}",
    "version": "0.0.1",
    "type": "commonjs",
    "sideEffects": false
}
`,
"project.json":
/*json*/`{
    "name": "${name}",
    "$schema": "../../node_modules/nx/schemas/project-schema.json",
    "sourceRoot": "packages/${name}/src",
    "projectType": "library",
    "targets": {
        "build": {
            "executor": "@iyio/nx-common:lib-builder",
            "outputs": ["{options.outputPath}"],
            "options": {
                "outputPath": "dist/packages/${name}",
                "main": "packages/${name}/src/index.ts",
                "tsConfig": "packages/${name}/tsconfig.lib.json",
                "assets": ["packages/${name}/*.md"]
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
                "lintFilePatterns": ["packages/${name}/**/*.ts"]
            }
        },
        "test": {
            "executor": "@nrwl/jest:jest",
            "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
            "options": {
                "jestConfig": "packages/${name}/jest.config.ts",
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
"src/index.ts":
/*ts*/`export * from './lib/pkg';

`,
"src/lib/pkg.ts":
/*ts*/`export const ${name}='${namespace}/${name}'
`,
"tsconfig.json":
/*json*/`{
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
        "module": "commonjs",
        "jsx": "react-jsx",
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
"tsconfig.lib-esm.json":
/*json*/`{
    "extends": "./tsconfig.lib.json",
    "compilerOptions": {
        "module": "ES2020"
    }
}
`,
"tsconfig.lib.json":
/*json*/`{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "outDir": "../../dist/out-tsc",
        "declaration": true,
        "types": ["node"]
    },
    "include": ["src/**/*.ts", "src/**/*.tsx"],
    "exclude": ["jest.config.ts", "src/**/*.spec.ts", "src/**/*.test.ts"]
}
`,
"tsconfig.spec.json":
/*json*/`{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "outDir": "../../dist/out-tsc",
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
    }
    return files;
}
