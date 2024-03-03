import { setChromeEnv } from '@iyio/chrome-common';
import { BaseAppContainerProps } from '@iyio/react-common';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { PopupView } from './PopupView';

export const initConvoChromePopup=(props?:BaseAppContainerProps)=>{
    console.log('hio 👋 👋 👋 Im a popup',props);

    setChromeEnv('popup');

    const root=document.querySelector('#__popup_root');
    if(!root){
        throw new Error('No element found with id __popup_root');
    }

    const reactRoot=createRoot(root);

    reactRoot.render(createElement(PopupView,props??null));
}
