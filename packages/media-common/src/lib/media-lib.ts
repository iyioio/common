import { Size } from "@iyio/common";
import { GetImageDataStatsOptions, ImageStats, SnapShotResult, VideoSnapShotOptions as SnapshotOptions } from "./media-types";


const getCanvas=()=>{
    const canvasHost=document.createElement('div');
    canvasHost.style.position='absolute';
    canvasHost.style.left='-100px';
    canvasHost.style.top='-100px';
    canvasHost.style.width='0px';
    canvasHost.style.height='0px';
    canvasHost.style.overflow='hidden';
    const canvas=document.createElement('canvas');
    canvasHost.appendChild(canvas);
    document.body.append(canvasHost);
    return {
        canvas,
        dispose:()=>{
            canvasHost.remove()
        }
    };

}

export const getSnapshot=({
    source,
    type='image/jpeg',
    width,
    height,
    viewBoxWidth,
    viewBoxHeight,
    flipHorizontal,
    flipVertical,
    includeStats,
}:SnapshotOptions):SnapShotResult|null=>{

    let tw:number|undefined=width;
    let th:number|undefined=height;

    if(tw===undefined || th===undefined){
        const vid=(source as Partial<HTMLVideoElement>);
        const stream=vid?.srcObject as MediaStream|null;
        if(stream){
            const trackSettings=stream.getVideoTracks()?.[0]?.getSettings();
            if(trackSettings){
                if(tw===undefined){
                    tw=trackSettings.width;
                }
                if(th===undefined){
                    th=trackSettings.height;
                }
            }
        }

        if(tw===undefined && vid.videoWidth){
            tw=vid.videoWidth;
        }

        if(th===undefined && vid.videoHeight){
            th=vid.videoHeight;
        }

    }

    if(tw===undefined){
        tw=(source as Partial<HTMLElement>).clientWidth;
    }
    if(th===undefined){
        th=(source as Partial<HTMLElement>).clientHeight;
    }

    if(!tw || !th){
        return null;
    }

    const tr=tw/th;



    const vw=(viewBoxWidth??tw)||1;
    const vh=(viewBoxHeight??th)||1;
    const vr=vw/vh;

    let cw=0;// capture width
    let ch=0;// capture height;

    if(vr>tr){
        cw=tw;
        ch=tw/vr;
    }else{
        ch=th;
        cw=th*vr;
    }

    const {canvas,dispose}=getCanvas();
    try{
        canvas.width=cw;
        canvas.height=ch;
        const context=canvas.getContext('2d',{antialias:true}) as CanvasRenderingContext2D|null;
        if(!context){
            return null;
        }
        if (flipHorizontal || flipHorizontal) {
            context.translate(flipHorizontal?cw:0,flipVertical?ch:0);
            context.scale(flipHorizontal?-1:1,flipVertical?-1:1);
        }

        context.clearRect(0,0,cw,ch);
        context.drawImage(
            source,
            Math.floor(-(tw-cw)/2),
            Math.floor(-(th-ch)/2),
            tw,
            th,
        );
        const dataUri=canvas.toDataURL(type);
        return {
            dataUri,
            stats:includeStats?
                getImageDataStats(
                    context.getImageData(0,0,tw,th),
                    typeof includeStats === 'boolean'?{}:includeStats)
                :undefined
        };
    }finally{
        dispose();
    }
}

const rgbTotal=255*3;
export const getImageDataStats=(data:ImageData,{
    trueAverage
}:GetImageDataStatsOptions={}):ImageStats=>{
    let min=Number.MAX_SAFE_INTEGER;
    let max=0;
    let avg=0;

    const l=data.width*data.height*4;
    const bytes=data.data as any;
    for(let i=0;i<l;i+=4){
        const n=bytes[i]+bytes[i+1]+bytes[i+2];
        if(n>max){
            max=n;
        }
        if(n<min){
            min=n;
        }
        if(trueAverage){
            avg+=n/rgbTotal;
        }
    }

    return {
        minBrightness:min/rgbTotal,
        maxBrightness:max/rgbTotal,
        averageBrightness:trueAverage?avg/(data.width*data.height):(min+(max-min)/2)/rgbTotal,
    }
}

export const getContentTypeFileExt=(contentType:string)=>{
    switch(contentType.toLowerCase()){

        case 'image/jpeg':
            return 'jpg';

        default:
            return contentType.split('/')[1]??'jpg';

    }
}

export const getImageSizeAsync=async (src:string|Blob|MediaSource):Promise<Size>=>{
    const img=await loadImageAsync(src);
    return {
        width:img.width,
        height:img.height,
    }
}

export const loadImageAsync=(src:string|Blob|MediaSource):Promise<HTMLImageElement>=>{
    if(typeof src !== 'string'){
        src=URL.createObjectURL(src);
    }

    return new Promise<HTMLImageElement>((resolve,reject)=>{
        const img=new Image();
        img.crossOrigin='Anonymous'
        img.onload=()=>{
            resolve(img)
        }
        img.onerror=(e)=>{
            reject(e);
        }
        img.src=src as string;
    })
}

export const imageSourceToImageDataAsync=async (src:string|Blob|MediaSource,width?:number,height?:number):Promise<ImageData>=>{
    const img=await loadImageAsync(src);
    const canvas=document.createElement('canvas');
    canvas.width=width??img.width;
    canvas.height=height??img.height;
    const context=canvas.getContext('2d');
    if(!context){
        throw new Error('Unable to create canvas 2d context');
    }
    context.drawImage(img,0,0,width??img.width,height??img.height);
    return context.getImageData(0,0,width??img.width,height??img.height);
}


