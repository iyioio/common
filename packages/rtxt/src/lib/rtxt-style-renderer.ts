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

    globalThis.document?.querySelectorAll('[data-rtxt-style]').forEach(s=>s.remove());

    style.setAttribute('type','text/css');
    style.setAttribute('data-rtxt-style','1');

    style.innerHTML=css`

.${prefix}doc{
    position:relative;
    outline-offset:0.6rem;
    border-radius:1px;
    outline:none;
}
@keyframes ${prefix}doc-outline-keyframes{
    0%{outline:1px solid #ffffff00}
    50%{outline:1px solid #ffffff55}
    100%{outline:1px solid #ffffff00}
}
.${prefix}edit-mode{
    animation:${prefix}doc-outline-keyframes 0.6s forwards;
}

.${prefix}doc > *{
    min-height:1rem;
}

.${prefix}doc.${prefix}doc-empty > *:first-child{
    min-height:1em;
}
.${prefix}doc > *:first-child{
    min-width:50px;
}

.${prefix}doc h1,.${prefix}doc h2,.${prefix}doc h3,.${prefix}doc h4,.${prefix}doc h5,.${prefix}doc h5{
    display:inline-block;
}

.${prefix}s1{
    font-size:2em;
}

.${prefix}s2{
    font-size:3em;
}

.${prefix}s3{
    font-size:5em;
}

.${prefix}s4{
    font-size:7em;
}

.${prefix}sn1{
    font-size:0.8em;
}

.${prefix}sn2{
    font-size:0.6em;
}

.${prefix}sn3{
    font-size:0.4em;
}

.${prefix}sn4{
    font-size:0.25em;
}

.${prefix}placeholder{
    position:absolute;
    left:0;
    top:0;
    pointer-events:none;
    opacity:0.5;
    padding:0 4px;
    white-space:pre;
}

${!disableFontFamilyCss && fontFamilies?fontFamilies.map(f=>f.className && f.family?`
.${prefix}${f.className}{font-family:'${f.family}'}
`:'').join(''):''}

    `??''

    global.document?.head.appendChild(style);
}
