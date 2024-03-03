export const chromeEnvs={
    main:'main',
    iso:'iso',
    service:'service',
    offscreen:'offscreen',
    popup:'popup',
} as const;

export type ChromeEnv=keyof typeof chromeEnvs;

let currentEnv:ChromeEnv|null=null;

export const getChromeEnv=():ChromeEnv=>{
    if(!currentEnv){
        throw new Error('ChromeEnv not set. Call setChromeEnv to set the current env');
    }
    return currentEnv;
}

export const setChromeEnv=(env:ChromeEnv):void=>{
    if(currentEnv){
        throw new Error('ChromeEnv already set');
    }
    currentEnv=env;
}
