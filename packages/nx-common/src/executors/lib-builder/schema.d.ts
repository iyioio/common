import type { ExecutorOptions } from '@nrwl/js/src/utils/schema';

export interface LibBuilderExecutorSchema extends ExecutorOptions {

    noSideEffects?:boolean;
    passthrough?:boolean;
    approximatelyDeps?:string|null;
    compatibleDeps?:string|null;
    moreThanEqDeps?:boolean;


    commonJsTsConfig?:string;

    disableEsm?:boolean;
    esmDir?:string;
    esmTsConfig?:string;


    autoCreateEsmConfig?:boolean;
    esmModuleType?:string;
}
