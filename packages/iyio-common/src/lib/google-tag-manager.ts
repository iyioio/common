import { GoogleTagManagerConfig } from "./google-tag-manager-types";

let scriptInserted=false;

export const isGoogleTagManagerEnabled=()=>scriptInserted;

export const initGoogleTagManager=(config:GoogleTagManagerConfig|string):boolean=>{

    if(typeof config === 'string'){
        config={
            measurements:[{
                id:config
            }]
        }
    }

    const domain=config.domain??globalThis.location?.hostname?.toLowerCase();

    if(!domain || !global.document?.body){
        console.warn('initGoogleTagManager can only be used client side')
        return false;
    }

    if(!config.enableLocalhost && (
        globalThis.location?.hostname==='localhost' ||
        globalThis.location?.hostname?.startsWith('127.')
    )){
        return false;
    }

    if(scriptInserted){
        console.warn('initGoogleTagManager already called');
        return false;
    }

    const measurement=(
        config.measurements.find(m=>m.domain?.toLowerCase()===domain)??
        config.measurements.find(m=>m.domain===undefined)
    );

    if(!measurement){
        console.warn(`No GoogleTagManagerMeasurementConfig found for domain ${domain}`);
        return false;
    }

    scriptInserted=true;
    const linkScript=globalThis.document.createElement('script');
    linkScript.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurement.id)}`;
    const configScript=globalThis.document.createElement('script');
    configScript.innerHTML=`
        window.dataLayer=window.dataLayer||[];
        function gtag(){dataLayer.push(arguments);}
        gtag('js',new Date());
        gtag('config',${JSON.stringify(measurement.id)});
    `;
    globalThis.document.body.append(linkScript,configScript);
    return true;
}
