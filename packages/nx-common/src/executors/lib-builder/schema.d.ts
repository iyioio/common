import type { ExecutorOptions } from '@nrwl/js/src/utils/schema';

export interface LibBuilderExecutorSchema extends ExecutorOptions {

    noSideEffects?:boolean;
    passthrough?:boolean;

    commonJsTsConfig?:string;

    disableEsm?:boolean;
    esmDir?:string;
    esmTsConfig?:string;


    autoCreateEsmConfig?:boolean;
    esmModuleType?:string;
}
