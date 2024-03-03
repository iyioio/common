import { delayAsync } from "./common-lib";

export interface MouseEventSimOptions
{
    elem:Element;
    eventName:string;
    clientX:number;
    clientY:number;
    button?:number;
}

export const simulateMouseEvent=({
    elem,
    eventName,
    clientX,
    clientY,
    button=0
}:MouseEventSimOptions)=>{
    elem.dispatchEvent(new MouseEvent(eventName,{
        view:window,
        bubbles:true,
        cancelable:true,
        clientX,
        clientY,
        button
    }));
};

export interface ClickSimOptions extends Omit<MouseEventSimOptions,'eventName'>
{
    delayMs?:number;
}

export const simulateMouseClickAsync=async ({
    delayMs=1,
    ...options
}:ClickSimOptions)=>{
    simulateMouseEvent({eventName:'mousedown',...options});
    if(delayMs>0){
        await delayAsync(delayMs);
    }
    simulateMouseEvent({eventName:'mouseup',...options});
    simulateMouseEvent({eventName:'click',...options});
}
