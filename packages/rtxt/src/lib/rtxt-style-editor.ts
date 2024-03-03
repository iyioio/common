import { css } from "@iyio/common";
import { RTxtEditorStyle, defaultRTxtClassNamePrefix } from "./rtxt-types";

let inserted=false;

export const insertRTxtEditorStyleSheet=(prefix=defaultRTxtClassNamePrefix,{
    backgroundColor='#000000',
    borderColor='#ffffff55',
    selectedColor='#ffffff33',
    zIndex=99999
}:RTxtEditorStyle={})=>{
    if(inserted){
        return;
    }

    inserted=true;

    const style=globalThis.document?.createElement('style');
    if(!style){
        return;
    }

    globalThis.document?.querySelectorAll('[data-rtxt-editor-style]').forEach(s=>s.remove());

    style.setAttribute('type','text/css');
    style.setAttribute('data-rtxt-editor-style','1');

    style.innerText=css`

.${prefix}editor-menu-container{
    position:fixed;
    left:0;
    top:0;
    transition:opacity 0.2s ease-in-out;
    z-index:${zIndex};
    user-select:none;
    -webkit-user-select:none;
}

.${prefix}editor-menu-container-closed{
    pointer-events:none;
    opacity:0;
}

.${prefix}editor-menu{
    border-radius:4px;
    background:${backgroundColor};
    border:1px solid ${borderColor};
    display:flex;
    gap:4px;
}
.${prefix}editor-menu > *{
    height:2.2rem;
}
.${prefix}editor-menu > label{
    align-self:center;
    height:auto;
    margin:0 0 0 0.4rem;
    font-size:0.75rem;
}

.${prefix}button{
    background:none;
    border:none;
    font-weight:normal;
    aspect-ratio:1/1;
    display:flex;
    justify-content:center;
    align-items:center;
    cursor:pointer;
}
.${prefix}button.${prefix}selected{
    background-color:${selectedColor};
}
.${prefix}input{
    cursor:pointer;
}

.${prefix}button-bold{
    font-weight:bold;
}

.${prefix}button-italic{
    font-style:italic;
}

.${prefix}button-strike{
    text-decoration:line-through;
}

.${prefix}button-underline{
    text-decoration:underline;
}

.${prefix}button-clear{
    font-size:0.7rem;
}

.${prefix}color-picker {
    -webkit-appearance:none;
    -moz-appearance:none;
    appearance:none;
    width:2.5rem;
    height:1.6rem;
    align-self:center;
    background-color:transparent;
    border:1px solid ${borderColor};
    cursor:pointer;
    padding:0;
    margin:0 0.2rem;
    border-radius:4px;
}
.${prefix}color-picker::-webkit-color-swatch {
    padding:0;
    margin:0;
    border:none;
}
.${prefix}color-picker::-moz-color-swatch {
    padding:0;
    margin:0;
    border:none;
}
.${prefix}select{
    max-width:100px;
    max-width:4rem;
    margin:0 0.2rem 0 0;
    border:none;
    background-color:#ffffff33;
    border-radius:4px;
    height:1.6rem;
    align-self:center;
    padding:0 0.25rem;
}

.${prefix}disable-mouse{
    pointer-events:none !important;
}

    `??'';

    globalThis.document?.head.appendChild(style);
}
