import { BaseConvoChromeCtrl } from './BaseConvoChromeCtrl';
import { CcMsg } from './convo-chrome-types';

export class PopupCtrl extends BaseConvoChromeCtrl
{

    protected onMessage(msg:CcMsg,sender?:chrome.runtime.MessageSender):void{
        //
    }

}
