import { BehaviorSubject, Subscription } from "rxjs";
import { IDisposable, Size } from "./common-types";
import { ReadonlySubject } from "./rxjs-types";

export const fallbackWindowWidth=1280;
export const fallbackWindowHeight=720;

export const getWindowSize=():Size=>{
    if(!globalThis.window){
        return {width:fallbackWindowWidth,height:fallbackWindowHeight}
    }else{
        return {
            width:globalThis.window.innerWidth??fallbackWindowWidth,
            height:globalThis.window.innerHeight??fallbackWindowHeight,
        }
    }
}


export interface Breakpoints
{
    mobileSm:number;
    mobile:number;
    tabletSm:number;
    tablet:number;
    desktopSm:number;
    desktop:number;
}

export type BreakpointFlags={
    [prop in keyof Breakpoints]:boolean;
}

export type CssBreakpoints={
    [prop in keyof Breakpoints]:number|string;
}

export type Breakpoint=keyof Breakpoints;

export const defaultBreakpoints:Readonly<Breakpoints>=Object.freeze({
    mobileSm:300,
    mobile:576,
    tabletSm:768,
    tablet:992,
    desktopSm:1200,
    desktop:1400,
})

export enum BreakpointIndex{
    mobileSm=0,
    mobile=1,
    tabletSm=2,
    tablet=3,
    desktopSm=4,
    desktop=5,
}

export const allBreakpoints:Readonly<Breakpoint[]>=Object.freeze([
    'mobileSm',
    'mobile',
    'tabletSm',
    'tablet',
    'desktopSm',
    'desktop',
]);


export const currentBreakpoints=new BehaviorSubject<Readonly<Breakpoints>>(defaultBreakpoints);

const parsePx=(value:number|string):number=>{
    if(typeof value === 'string'){
        return Number(value.replace(/[a-zA-Z\s]/g,''));
    }else{
        return value;
    }
}

export const parseCssBreakpoints=(cssBreakpoints:CssBreakpoints):Breakpoints=>({
    mobileSm:parsePx(cssBreakpoints.mobileSm),
    mobile:parsePx(cssBreakpoints.mobile),
    tabletSm:parsePx(cssBreakpoints.tabletSm),
    tablet:parsePx(cssBreakpoints.tablet),
    desktopSm:parsePx(cssBreakpoints.desktopSm),
    desktop:parsePx(cssBreakpoints.desktop),
})

export interface BreakpointDetails
{
    width:number;
    index:BreakpointIndex;
    breakpoint:Breakpoint;
    breakpoints:Readonly<Breakpoints>;
    is:BreakpointFlags;
    not:BreakpointFlags;
    lessThan:BreakpointFlags;
    lessThanEq:BreakpointFlags;
    moreThan:BreakpointFlags;
    moreThanEq:BreakpointFlags;
}


export const getBreakpointIndex=(
    breakpoints:Readonly<Breakpoints>=currentBreakpoints.value,
    width=globalThis.window?.innerWidth??fallbackWindowWidth):BreakpointIndex=>{

    if(width<=breakpoints.mobileSm){
        return BreakpointIndex.mobileSm;
    }
    if(width<=breakpoints.mobile){
        return BreakpointIndex.mobile;
    }
    if(width<=breakpoints.tabletSm){
        return BreakpointIndex.tabletSm;
    }
    if(width<=breakpoints.tablet){
        return BreakpointIndex.tablet;
    }
    if(width<=breakpoints.desktopSm){
        return BreakpointIndex.desktopSm;
    }
    return BreakpointIndex.desktop;
}


export const getBreakpointDetails=(
    breakpoints:Readonly<Breakpoints>=currentBreakpoints.value,
    width=globalThis.window?.innerWidth??fallbackWindowWidth
):BreakpointDetails=>{

    const index=getBreakpointIndex(breakpoints,width);

    const is:BreakpointFlags={
        mobileSm:index===BreakpointIndex.mobileSm,
        mobile:index===BreakpointIndex.mobile,
        tabletSm:index===BreakpointIndex.tabletSm,
        tablet:index===BreakpointIndex.tablet,
        desktopSm:index===BreakpointIndex.desktopSm,
        desktop:index===BreakpointIndex.desktop,
    }

    return {
        width,
        index,
        breakpoints,
        breakpoint:allBreakpoints[index],
        is,
        not:{
            mobileSm:!is.mobileSm,
            mobile:!is.mobile,
            tabletSm:!is.tabletSm,
            tablet:!is.tablet,
            desktopSm:!is.desktopSm,
            desktop:!is.desktop,
        },
        lessThan:{
            mobileSm:false,
            mobile:index<BreakpointIndex.mobile,
            tabletSm:index<BreakpointIndex.tabletSm,
            tablet:index<BreakpointIndex.tablet,
            desktopSm:index<BreakpointIndex.desktopSm,
            desktop:index<BreakpointIndex.desktop,
        },
        lessThanEq:{
            mobileSm:index<=BreakpointIndex.mobileSm,
            mobile:index<=BreakpointIndex.mobile,
            tabletSm:index<=BreakpointIndex.tabletSm,
            tablet:index<=BreakpointIndex.tablet,
            desktopSm:index<=BreakpointIndex.desktopSm,
            desktop:index<=BreakpointIndex.desktop,
        },
        moreThan:{
            mobileSm:index>BreakpointIndex.mobileSm,
            mobile:index>BreakpointIndex.mobile,
            tabletSm:index>BreakpointIndex.tabletSm,
            tablet:index>BreakpointIndex.tablet,
            desktopSm:index>BreakpointIndex.desktopSm,
            desktop:false,
        },
        moreThanEq:{
            mobileSm:index>=BreakpointIndex.mobileSm,
            mobile:index>=BreakpointIndex.mobile,
            tabletSm:index>=BreakpointIndex.tabletSm,
            tablet:index>=BreakpointIndex.tablet,
            desktopSm:index>=BreakpointIndex.desktopSm,
            desktop:index>=BreakpointIndex.desktop,
        },
    }
}

export class BreakpointWatcher implements IDisposable
{
    private readonly _details:BehaviorSubject<Readonly<BreakpointDetails>>;
    public get detailsSubject():ReadonlySubject<Readonly<BreakpointDetails>>{return this._details}
    public get details(){return this._details.value}

    private readonly breakpoints:BehaviorSubject<Readonly<Breakpoints>>;

    private readonly sub:Subscription;

    public constructor(breakpoints:BehaviorSubject<Readonly<Breakpoints>>=currentBreakpoints)
    {
        this.breakpoints=breakpoints;
        this._details=new BehaviorSubject<Readonly<BreakpointDetails>>(getBreakpointDetails(breakpoints.value));
        if(globalThis.window){
            globalThis.window.addEventListener('resize',this.listener);
        }
        this.sub=breakpoints.subscribe(this.listener);
    }

    public dispose()
    {
        this.sub.unsubscribe();
        if(globalThis.window){
            globalThis.window.removeEventListener('resize',this.listener);
        }
    }

    private listener=()=>{
        this._details.next(getBreakpointDetails(this.breakpoints.value));
    }
}

let defaultBreakpointWatcher:BreakpointWatcher|null=null;

export const getDefaultBreakpointWatcher=()=>{
    if(!defaultBreakpointWatcher){
        defaultBreakpointWatcher=new BreakpointWatcher();
    }
    return defaultBreakpointWatcher;
}
