import type { ExecutorOptions } from '@nrwl/js/src/utils/schema';

export interface LibBuilderExecutorSchema extends ExecutorOptions {

    buildInParallel?:boolean;
    noSideEffects?:boolean;

    commonJsTsConfig?:string;

    disableEsm?:boolean;
    esmDir?:string;
    esmTsConfig?:string;


    autoCreateEsmConfig?:boolean;
    esmModuleType?:string;
}
