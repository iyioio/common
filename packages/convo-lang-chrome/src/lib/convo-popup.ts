import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { PopupView } from './PopupView';

export const initConvoChromePopup=()=>{
    console.log('hio 👋 👋 👋 Im a popup',);

    const root=document.querySelector('#__popup_root');
    if(!root){
        throw new Error('No element found with id __popup_root');
    }

    const reactRoot=createRoot(root);

    reactRoot.render(createElement(PopupView));
}
