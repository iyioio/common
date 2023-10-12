import { protoFileMapToOutput as __transformer__ } from "@iyio/protogen";

export interface NextJsAppTemplateOptions{
    mapOptions:Parameters<typeof __transformer__>[1];
    projectName:string;
    namespace:string;
    compLib:string;
    frontendModule:string;
    frontendLib:string;
    siteTitle:string;
    siteDescription:string;
    devPort:string;
}

export const nextJsAppTemplate=({
    mapOptions:__transformerParam__,
    projectName,
    namespace,
    compLib,
    frontendModule,
    frontendLib,
    siteTitle,
    siteDescription,
    devPort,
}:NextJsAppTemplateOptions)=>{
    const files={
".babelrc":
/*babelrc*/`{
    "presets": ["@nrwl/next/babel"],
    "plugins": []
}
`,
".eslintrc.json":
/*json*/`{
    "extends": [
        "plugin:@nrwl/nx/react-typescript",
        "next",
        "next/core-web-vitals",
        "../../.eslintrc.json"
    ],
    "ignorePatterns": ["!**/*", ".next/**/*"],
    "overrides": [
        {
            "files": ["*.ts", "*.tsx", "*.js", "*.jsx"],
            "rules": {
                "@next/next/no-html-link-for-pages": [
                    "error",
                    "packages/${projectName}/pages"
                ]
            }
        },
        {
            "files": ["*.ts", "*.tsx"],
            "rules": {}
        },
        {
            "files": ["*.js", "*.jsx"],
            "rules": {}
        }
    ],
    "rules": {
        "@next/next/no-html-link-for-pages": "off"
    },
    "env": {
        "jest": true
    }
}
`,
"components/Page.tsx":
/*tsx*/`export interface PageProps
{
    children?:any;
}

export function Page({
    children
}:PageProps){

    return (
        <div className="Page">
            {children}
        </div>
    )

}
`,
"index.d.ts":
/*ts*/`/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '*.svg' {
    const content: any;
    export const ReactComponent: any;
    export default content;
}
`,
"jest.config.ts":
/*ts*/`/* eslint-disable */
export default {
    displayName: '${projectName}',
    preset: '../../jest.preset.js',
    transform: {
        '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nrwl/react/plugins/jest',
        '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nrwl/next/babel'] }],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    coverageDirectory: '../../coverage/packages/${projectName}',
};
`,
"next-env.d.ts":
/*ts*/`/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
`,
"next.config.js":
/*js*/`//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withNx } = require('@nrwl/next/plugins/with-nx');

/**
 * @type {import('@nrwl/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
    nx: {
        // Set this to true if you would like to to use SVGR
        // See: https://github.com/gregberge/svgr
        svgr: false,
    },
    typescript:{
        ignoreBuildErrors:process.env['NX_IGNORE_NEXTJS_BUILD_ERROR']==='true'
    }
};

module.exports = withNx(nextConfig);
`,
"pages/_app.tsx":
/*tsx*/`import { DefaultGlobalStyle, MainLayout, PageWrapper } from '@${namespace}/${compLib}';
import { ${frontendModule}, defaultBaseLayoutStyleSheetProps, st } from '@${namespace}/${frontendLib}';
import { STATIC_ENV_VARS, __macro__ } from '@iyio/common';
import { NextJsApp } from '@iyio/nextjs-common';
import { AppProps } from 'next/app';
import Head from 'next/head';

export default function App(props:AppProps){
    return (
        <NextJsApp
            appProps={props as any}
            style={defaultBaseLayoutStyleSheetProps}
            GlobalStyle={DefaultGlobalStyle}
            scopeInit={${frontendModule}}
            staticEnvVars={process.env['NODE_ENV']==='production'?undefined:__macro__(STATIC_ENV_VARS)}
            layoutProps={{
                pageTransitions:true,
                LayoutWrapper:MainLayout,
                PageWrapper
            }}
        >
            <Head>
                <title>${siteTitle}</title>
                <meta name="theme-color" content={st.bgColor}/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no"/>
                <link rel="icon" type="image/png" href="/logo-icon.png"></link>
                <meta property="og:title" content="${siteTitle}" />
                <meta property="og:description" content="${siteDescription}" />
                <meta property="og:type" content="website" />
                <meta property="og:image" content={\`https://$\{process.env['NX_FRONTEND_DOMAIN']}/logo.png\`} />
                <meta property="og:url" content={\`https://$\{process.env['NX_FRONTEND_DOMAIN']}/\`} />
            </Head>

        </NextJsApp>
    )
}
`,
"pages/_document.tsx":
/*tsx*/`import { DefaultStyleHead } from '@${namespace}/${compLib}';
import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html>
            <Head>
                <DefaultStyleHead/>
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}
`,
"pages/index.tsx":
/*tsx*/`export default function Index()
{

    return (
        <h1>_🚧</h1>
    )

}
`,
"project.json":
/*json*/`{
    "name": "${projectName}",
    "$schema": "../../node_modules/nx/schemas/project-schema.json",
    "sourceRoot": "packages/${projectName}",
    "projectType": "application",
    "targets": {
        "pre-build": {
            "executor": "@nrwl/next:build",
            "outputs": [
                "{options.outputPath}"
            ],
            "defaultConfiguration": "production",
            "options": {
                "root": "packages/${projectName}",
                "outputPath": "dist/packages/${projectName}"
            },
            "configurations": {
                "development": {
                    "outputPath": "packages/${projectName}"
                },
                "production": {}
            }
        },
        "serve": {
            "executor": "@nrwl/next:server",
            "defaultConfiguration": "development",
            "options": {
                "buildTarget": "${projectName}:pre-build",
                "dev": true,
                "port": ${devPort}
            },
            "configurations": {
                "development": {
                    "buildTarget": "${projectName}:pre-build:development",
                    "dev": true
                },
                "production": {
                    "buildTarget": "${projectName}:pre-build:production",
                    "dev": false
                }
            }
        },
        "export": {
            "executor": "@nrwl/next:export",
            "options": {
                "buildTarget": "${projectName}:pre-build:production"
            }
        },
        "build": {
            "dependsOn": [
                {
                    "target": "export",
                    "projects": "self"
                }
            ],
            "executor": "nx:run-commands",
            "options": {
                "cwd": "packages/${projectName}",
                "command": "echo 'todo - ./build-serverless.sh'"
            }
        },
        "test": {
            "executor": "@nrwl/jest:jest",
            "outputs": [
                "{workspaceRoot}/coverage/{projectRoot}"
            ],
            "options": {
                "jestConfig": "packages/${projectName}/jest.config.ts",
                "passWithNoTests": true
            }
        },
        "lint": {
            "executor": "@nrwl/linter:eslint",
            "outputs": [
                "{options.outputFile}"
            ],
            "options": {
                "lintFilePatterns": [
                    "packages/${projectName}/**/*.{ts,tsx,js,jsx}"
                ]
            }
        }
    },
    "tags": []
}
`,
"public/.gitkeep":
/*gitkeep*/``,
"tsconfig.json":
/*json*/`{
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
        "jsx": "preserve",
        "allowJs": true,
        "esModuleInterop": true,
        "allowSyntheticDefaultImports": true,
        "strict": true,
        "forceConsistentCasingInFileNames": true,
        "noUncheckedIndexedAccess": true,
        "noEmit": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "incremental": true,
        "types": ["jest", "node"],
        "skipLibCheck": true
    },
    "include": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "next-env.d.ts"],
    "exclude": [
        "node_modules",
        "jest.config.ts",
        "src/**/*.spec.ts",
        "src/**/*.test.ts"
    ]
}
`,
"tsconfig.spec.json":
/*json*/`{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "outDir": "../../dist/out-tsc",
        "module": "commonjs",
        "types": ["jest", "node"],
        "jsx": "react"
    },
    "include": [
        "jest.config.ts",
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "src/**/*.test.tsx",
        "src/**/*.spec.tsx",
        "src/**/*.test.js",
        "src/**/*.spec.js",
        "src/**/*.test.jsx",
        "src/**/*.spec.jsx",
        "src/**/*.d.ts"
    ]
}
`,
    }
    return __transformer__(files,__transformerParam__);
}