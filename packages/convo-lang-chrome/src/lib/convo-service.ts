import { setChromeEnv } from "@iyio/chrome-common";
import { ServiceCtrl } from "./ServiceCtrl";

export const initConvoChromeService=()=>{

    setChromeEnv('service');

    const service=new ServiceCtrl();

    chrome.action.onClicked.addListener(async tab=>{
        console.log('tab clicked',tab);

        await chrome.action.setPopup({
            popup:'popup.html'
        })

        if(tab.id!==undefined){

            service.addTab(tab.id);

            await chrome.scripting.executeScript({
                target:{tabId:tab.id},
                files:['src/entry-points/world-iso.js']
            })

            await chrome.scripting.executeScript({
                target:{tabId:tab.id},
                files:['src/entry-points/world-main.js'],
                world:'MAIN'
            })
        }
    });


}
