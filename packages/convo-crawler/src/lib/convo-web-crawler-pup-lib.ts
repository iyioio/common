import { Point, Size, delayAsync } from "@iyio/common";
import { ElementHandle, Frame, Page } from "puppeteer";
import { ConvoPageCaptureActionItem } from "./convo-web-crawler-types";

const isFrameVisibleAsync=async (frame:Frame):Promise<boolean>=>{
    return Promise.race([
        _isFrameVisibleAsync(frame),
        delayAsync(1000).then(()=>false)
    ])
}
const _isFrameVisibleAsync=async (frame:Frame):Promise<boolean>=>{
    try{
        const iFrame=await frame.frameElement();
        if(!iFrame){
            return true;
        }
        const box=await iFrame.boundingBox();
        if(!box){
            return false;
        }
        return box.width*box.height>=20*20;
    }catch{
        return false;
    }
}

const filterVisibleFramesAsync=async (frames:Frame[]):Promise<Frame[]>=>{
    const visible:Frame[]=[];
    for(const f of frames){
        if(await isFrameVisibleAsync(f)){
            visible.push(f);
        }
    }
    return visible;
}

export const getFramesActionItems=async (frames:Frame[],inViewport=true):Promise<ConvoPageCaptureActionItem[]>=>{
    frames=await filterVisibleFramesAsync(frames);
    const items:ConvoPageCaptureActionItem[]=[];
    for(const frame of frames){
        const offset=await getFrameOffsetAsync(frame);
        items.push(...await getActionItems(frame,inViewport,offset));
    }
    return items;
}

export const getActionItems=async (page:Page|Frame,inViewport=true,offset:Point={x:0,y:0}):Promise<ConvoPageCaptureActionItem[]>=>{

    return await Promise.race([page.evaluate((inViewport,offset)=>{

        const elementIsVisibleInViewport = (box:DOMRect, partiallyVisible = false) => {
            const { top, left, bottom, right } = box;
            const { innerHeight, innerWidth } = window;
            return partiallyVisible
                ? ((top > 0 && top < innerHeight) ||
                    (bottom > 0 && bottom < innerHeight)) &&
                    ((left > 0 && left < innerWidth) || (right > 0 && right < innerWidth))
                : top >= 0 && left >= 0 && bottom <= innerHeight && right <= innerWidth;
        };

        const getElemType=(elem:Element)=>{
            if(elem.getAttribute('contenteditable') && elem.getAttribute('contenteditable')!=='false'){
                return 'RichTextEditor';
            }
            if(elem.tagName==='DIV'){
                return 'BUTTON'
            }else{
                return elem.tagName;
            }
        }

        const list=document.querySelectorAll(
            'button:not([disabled]), '+
            '[href], '+
            'input:not([disabled]), '+
            'select:not([disabled]), '+
            'textarea:not([disabled]), '+
            '[contenteditable]:not([contenteditable="false"]):not([disabled]), '+
            `[tabindex]:not([disabled]), `+
            'details:not([disabled]), '+
            'summary:not(:disabled)'
        )

        const items:ConvoPageCaptureActionItem[]=[];

        let _id=1;
        for(let i=0;i<list.length;i++){
            const elem=list[i];
            if(!elem){continue}

            const bounds=elem.getBoundingClientRect();

            if( (inViewport?!elementIsVisibleInViewport(bounds,true):false) ||
                !bounds.width ||
                !bounds.height ||
                !elem.checkVisibility({
                    contentVisibilityAuto:true,
                    contentVisibilityCss:true,
                    opacityProperty:true,
                    visibilityProperty:true
                } as any)
            ){
                continue;
            }

            const id=_id.toString(16).toUpperCase()

            const text=(
                elem.getAttribute('aria-label')||
                elem.getAttribute('placeholder')||
                elem.getAttribute('data-tooltip')||
                elem.getAttribute('title')||
                (elem as any).innerText||
                '(no-text)'
            )

            let href=elem.getAttribute('href')?.trim()??undefined;
            if(href){
                href=new URL(href,document.baseURI).href;
            }

            items.push({
                id,
                type:getElemType(elem),
                x:bounds.left+offset.x,
                y:bounds.top+offset.y,
                w:bounds.width,
                h:bounds.height,
                text,
                href,
            })

            _id++;

        }

        return items;
    },inViewport,offset),delayAsync(1000).then(()=>[])]);

}

export interface ElementUnderOptions extends Point
{
    scrollable?:boolean;
    ignore?:string[];
    under?:ElementHandle[];
}
export const getElementsUnderAsync=async (options:ElementUnderOptions,frame:Frame):Promise<ElementHandle[]>=>{

    try{
        options={...options}


        const under=options.under??[];
        delete options.under;

        const frameOffset=await getFrameOffsetAsync(frame);

        options.x-=frameOffset.x;
        options.y-=frameOffset.y;

        const r=await frame.evaluateHandle((options:ElementUnderOptions)=>{

            const isHit=(bounds:DOMRect)=>{
                return bounds.left<=options.x && bounds.right>=options.x && bounds.top<=options.y && bounds.bottom>=options.y;
            }

            const iFrames:HTMLIFrameElement[]=[];

            const all=document.querySelectorAll('*');

            for(let i=0;i<all.length;i++){
                const elem=all.item(i);
                if(!elem){
                    continue;
                }

                if(elem instanceof HTMLIFrameElement){
                    iFrames.push(elem);
                    continue;
                }

                if(options.ignore?.includes(elem.tagName.toLowerCase())){
                    continue;
                }

                if(options.scrollable){
                    if(elem.scrollHeight-10<=elem.clientHeight){
                        continue;
                    }
                    const style=window.getComputedStyle(elem);
                    if(style.overflowY==='hidden' || style.overflowY==='clip'){
                        continue;
                    }
                }

                const bounds=elem.getBoundingClientRect();

                if(isHit(bounds)){
                    return elem;
                }
            }

            for(const elem of iFrames){
                const bounds=elem.getBoundingClientRect();

                if(isHit(bounds)){
                    return elem;
                }
            }

            return null;

        },options);

        const elem=r.asElement();
        if(elem){
            const isIFrame=await elem.evaluate(e=>e instanceof HTMLIFrameElement);
            const contentFrame=isIFrame?await elem.contentFrame():null;
            if(isIFrame && contentFrame){
                return await getElementsUnderAsync({
                    ...options,
                    under,
                },contentFrame)
            }else{
                under.push(elem as any);
            }
        }

        return under;
    }catch(ex){
        console.error('getElementsUnderAsync failed',ex);
        return [];
    }


}


export const getFrameOffsetAsync=async (frame:Frame):Promise<Point>=>{
    return Promise.race([
        _getFrameOffsetAsync(frame),
        delayAsync(1000).then(()=>({x:0,y:0}))
    ])
}
const _getFrameOffsetAsync=async (frame:Frame):Promise<Point>=>{

    const pt:Point={x:0,y:0}

    try{

        let offsetFrame=frame;
        let parent=offsetFrame.parentFrame();
        while(parent){
            const iframe=await offsetFrame.frameElement();
            if(!iframe){
                break;
            }

            const offset=await iframe.boundingBox();
            if(!offset){
                break;
            }

            pt.x+=offset.x;
            pt.y+=offset.y;


            offsetFrame=parent;
            parent=offsetFrame.parentFrame();

        }
    }catch(ex){
        console.log('Get frame offset failed',ex);
    }

    return pt;
}

export const getFrameVisibleSize=async (frame:Frame):Promise<Size>=>{

    try{
        const frameOffset=await getFrameOffsetAsync(frame);

        return await frame.evaluate((frameOffset)=>{
            let w=0,h=0;

            const all=document.querySelectorAll('*');

            for(let i=0;i<all.length;i++){
                const elem=all.item(i);
                if( !elem ||
                    !elem.checkVisibility({
                        contentVisibilityAuto:true,
                        contentVisibilityCss:true,
                        opacityProperty:true,
                        visibilityProperty:true
                    } as any)
                ){
                    continue;
                }

                const bounds=elem.getBoundingClientRect();
                if(bounds.right>w){
                    w=bounds.right;
                }
                if(bounds.bottom>h){
                    h=bounds.bottom;
                }


            }

            return {
                width:w+frameOffset.x,
                height:h+frameOffset.y,
            }
        },frameOffset)
    }catch(ex){
        console.error('getFrameVisibleSize failed',ex);
        return {width:0,height:0}
    }

}


export const getFramesVisibleSize=async (frames:Frame[]):Promise<Size>=>{
    frames=await filterVisibleFramesAsync(frames);
    const p:Size={width:0,height:0};
    for(const frame of frames){
       const c=await getFrameVisibleSize(frame);
        if(c.width>p.width){
            p.width=c.width;
        }
        if(c.height>p.height){
            p.height=c.height;
        }
        return p;
    }

    return p;

}

export const scrollDownAsync=async (page:Page,distance:number):Promise<boolean>=>{

    const max=10;
    for(let i=1;i<=max;i++){
        try{
            return await _scrollDownAsync(page,distance);
        }catch(ex){
            if(i===max){
                console.error('scrollDownAsync failed',ex);
                return false;
            }
            await delayAsync(1000);
        }
    }
    return false;
}

const _scrollDownAsync=async (page:Page,distance:number):Promise<boolean>=>{

    const viewPort=page.viewport();
    if(!viewPort){
        return false;
    }

    const under:ElementHandle[]=[];

    const frames=[page.mainFrame()]
    for(const f of frames){
        await getElementsUnderAsync({
            x:viewPort.width/2,
            y:viewPort.height/2,
            scrollable:true,
            under
        },f)
    }

    const scrollElem=under[0];
    if(!scrollElem){
        return false;
    }

    return await scrollElem.evaluate((e,distance)=>{
        const top=e.scrollTop;
        e.scrollTo({top:top+distance,behavior:'instant'})
        return top!==e.scrollTop;
    },distance)

    // await page.mouse.move(Math.round(viewPort.width/2),Math.round(viewPort.height/2));

    // await page.mouse.wheel({deltaY:distance});

    // return true;
}

export const hideFramesFixedAsync=async (frames:Frame[])=>{
    frames=await filterVisibleFramesAsync(frames);
    for(const f of frames){
        await hideFrameFixedAsync(f);
    }
}
export const hideFrameFixedAsync=async (frame:Frame)=>{
    try{

        await Promise.race([frame.evaluate(()=>{
            const all=document.querySelectorAll('*');
            for(let i=0;i<all.length;i++){
                const elem=all.item(i)
                if(!(elem instanceof HTMLElement) || elem.getAttribute('data-convo-web-fixed-hidden')){
                    continue
                }

                const style=window.getComputedStyle(elem);
                if(style.position==='fixed'){
                    elem.setAttribute('data-convo-web-fixed-hidden','1');
                    elem.setAttribute('data-convo-web-fixed-hidden-style',elem.style.opacity+'|'+elem.style.transition);
                    elem.style.transition='none';
                    elem.style.opacity='0';
                }

            }
        }),delayAsync(1000)])

    }catch(ex){
        console.error('hideFixedAsync failed',ex)
    }
}

export const showFramesFixedAsync=async (frames:Frame[])=>{
    frames=await filterVisibleFramesAsync(frames);
    for(const f of frames){
        await showFrameFixedAsync(f);
    }
}
export const showFrameFixedAsync=async (frame:Frame)=>{
    try{

        await Promise.race([frame.evaluate(()=>{
            const all=document.querySelectorAll('*');
            for(let i=0;i<all.length;i++){
                const elem=all.item(i)
                if(!elem.getAttribute('data-convo-web-fixed-hidden') || !(elem instanceof HTMLElement)){
                    continue
                }

                const parts=(elem.getAttribute('data-convo-web-fixed-hidden-style')??'').split('|');
                elem.removeAttribute('data-convo-web-fixed-hidden-style');
                elem.removeAttribute('data-convo-web-fixed-hidden');
                elem.style.opacity=parts[0]??'';
                elem.style.transition=parts[1]??'';

            }
        }),delayAsync(1000)])

    }catch(ex){
        console.error('hideFixedAsync failed',ex)
    }
}
