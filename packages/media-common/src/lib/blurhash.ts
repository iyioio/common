import { decode, encode } from "blurhash";
import { imageSourceToImageDataAsync } from "./media-lib";

export const defaultHashBlurWidth=32;
export const defaultHashBlurHeight=32;

export interface BlurHashToCanvasOptions
{
    width?:number;
    height?:number;
    punch?:number;
}

export const blurHashToCanvas=(hash:string,{
    width=defaultHashBlurWidth,
    height=defaultHashBlurHeight,
    punch=1
}:BlurHashToCanvasOptions={}):HTMLCanvasElement|undefined=>{
    const pixels=decode(hash,width,height,punch);

    const canvas=document.createElement('canvas');
    canvas.width=width;
    canvas.height=height;
    const ctx=canvas.getContext('2d');
    if(!ctx){
        return undefined;
    }
    const imageData=ctx.createImageData(width,height);
    imageData.data.set(pixels);
    ctx.putImageData(imageData,0,0);
    return canvas;
}

export interface BlurHashToDataUriOptions extends BlurHashToCanvasOptions
{
    imageType?:string;
    quality?:number;
}

export const blurHashToDataUri=(hash:string,options?:BlurHashToDataUriOptions):string|undefined=>{
    const canvas=blurHashToCanvas(hash,options);
    if(!canvas){
        return undefined;
    }
    return canvas.toDataURL(options?.imageType,options?.quality);
}

export interface ImageToBlurHashOptions
{
    width?:number;
    height?:number;
    componentX?:number;
    componentY?:number;
}

export const imageToBlurHashAsync=async (src:string|Blob|MediaSource,options?:ImageToBlurHashOptions):Promise<string|undefined>=>{
    try{
        const imageData=await imageSourceToImageDataAsync(
            src,options?.width??defaultHashBlurWidth,options?.height??defaultHashBlurHeight);
        return encode(imageData.data,imageData.width,imageData.height,options?.componentX??4,options?.componentY??4);
    }catch(ex){
        console.error('Unable to convert image source to blur hash',ex);
        return undefined;
    }
}
