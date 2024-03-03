import { BaseConvoChromeCtrl } from './BaseConvoChromeCtrl';
import { TaskCtrl } from './TaskCtrl';
import { CcMsg } from './convo-chrome-types';

export class ServiceCtrl extends BaseConvoChromeCtrl
{

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onMessage(msg:CcMsg,sender?:chrome.runtime.MessageSender):void{
        if(msg.type==='startTask'){
            if(!msg.taskId || (typeof msg.data !== 'string')){
                throw new Error('startTask message requires taskId and data as a string')
            }
            this.addTask(msg.taskId,msg.data);
        }
    }

    protected override async runTaskAsync(task:TaskCtrl):Promise<void>{

        await task.executeAsync({
            getScreenShotAsync:()=>chrome.tabs.captureVisibleTab({})
        })

    }
}
