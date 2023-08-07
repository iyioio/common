import { css } from "@iyio/common";
import { RTxtRenderOptions, defaultRTxtClassNamePrefix } from "./rtxt-types";

let inserted=false;

export const insertRTxtViewerStyleSheet=({
    classPrefix:prefix=defaultRTxtClassNamePrefix,
    disableFontFamilyCss,
    fontFamilies,
}:RTxtRenderOptions={})=>{
    if(inserted){
        return;
    }

    inserted=true;

    const style=globalThis.document?.createElement('style');
    if(!style){
        return;
    }

    style.setAttribute('type','text/css');
    style.setAttribute('data-rtxt-style','1');

    style.innerHTML=css`
.${prefix}doc{
    outline:none;
}

.${prefix}doc h1,.${prefix}doc h2,.${prefix}doc h3,.${prefix}doc h4,.${prefix}doc h5,.${prefix}doc h5{
    display:inline-block;
}

.${prefix}size1{
    font-size:48px;
}

.${prefix}size2{
    font-size:36px;
}

.${prefix}size3{
    font-size:28px;
}

${!disableFontFamilyCss && fontFamilies?fontFamilies.map(f=>f.className && f.family?`
.${prefix}${f.className}{font-family:${f.family}}
`:'').join(''):''}

    `??''

    global.document?.head.appendChild(style);
}
