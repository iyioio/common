import { Size, addQueryToPath, safeParseNumberOrUndefined, uuid } from "@iyio/common";
import { GetImageDataStatsOptions, ImageStats, MediaRecordingResult, SnapShotResult, VideoSnapShotOptions as SnapshotOptions } from "./media-types";


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


export const fetchBlobAsync=async (url:string,bustCache=false):Promise<Blob>=>{
    if(bustCache){
        url=addQueryToPath(url,{_:uuid()})
    }
    const r=await fetch(url);
    return await r.blob();
}

export interface VideoInfo
{
    width:number;
    height:number;
    durationSeconds:number;
}

export const getVideoInfoAsync=(src:string|Blob):Promise<VideoInfo>=>{
    return new Promise<VideoInfo>((resolve,reject)=>{
        const video=globalThis.window?.document?.createElement('video');

        if(!video){
            resolve({width:0,height:0,durationSeconds:0})
            return
        }

        const blobUrl=typeof src === 'string'?undefined:URL.createObjectURL(src);

        const cleanUp=()=>{
            video.removeEventListener('loadedmetadata',onMeta)
            video.removeEventListener('error',onError)
            if(blobUrl){
                URL.revokeObjectURL(blobUrl);
            }
            video.src='';
        }

        const onMeta=()=>{
            resolve({width:video.videoWidth,height:video.videoHeight,durationSeconds:safeParseNumberOrUndefined(video.duration)??0})
            cleanUp();
        }

        const onError=(e:any)=>{
            cleanUp();
            reject(e);
        }

        video.addEventListener('loadedmetadata',onMeta)
        video.addEventListener('error',onError)
        video.src=blobUrl??(src as string);
    })
}

export const getVideoAsync=(src:string|Blob,forPreview?:boolean):Promise<{video:HTMLVideoElement,url:string,revokeRequired:boolean}>=>{
    return new Promise<{video:HTMLVideoElement,url:string,revokeRequired:boolean}>((resolve,reject)=>{
        const video=globalThis.window?.document?.createElement('video');

        if(!video){
            reject()
            return
        }

        const blobUrl=typeof src === 'string'?undefined:URL.createObjectURL(src);

        const onMeta=()=>{
            resolve({video,url:video.src,revokeRequired:blobUrl?true:false});
        }

        const onError=(e:any)=>{
            reject(e);
        }

        video.addEventListener('error',onError)
        if(forPreview){
            video.currentTime=0.1;
            video.addEventListener('canplay',onMeta);
            video.addEventListener('loadeddata',onMeta);
        }else{
            video.addEventListener('loadedmetadata',onMeta);
        }

        video.src=blobUrl??(src as string);
    })
}

export const mediaRecordingResultToBlob=(recordingResult:MediaRecordingResult):Blob|undefined=>{
    const first=recordingResult.data[0];
    if(recordingResult.data.length===0){
        return undefined;
    }else if(recordingResult.data.length===1 && first && first.type===recordingResult.mimeType){
        return first;
    }else{
        return new Blob(recordingResult.data,{type:recordingResult.mimeType});
    }
}
