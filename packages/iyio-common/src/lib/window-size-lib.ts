import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { Subscription } from "rxjs/internal/Subscription";
import { IDisposable, Size } from "./common-types.js";
import { ReadonlySubject } from "./rxjs-types.js";

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

export const allBreakpoints=[
    'mobileSm',
    'mobile',
    'tabletSm',
    'tablet',
    'desktopSm',
    'desktop',
] as const;
export type Breakpoint=typeof allBreakpoints[number];

export type Breakpoints = {
    [prop in Breakpoint]:number;
}

export type BreakpointFlags={
    [prop in Breakpoint]:boolean;
}

export type CssBreakpoints={
    [prop in Breakpoint]:number|string;
}



export const defaultBreakpoints:Readonly<Breakpoints>=Object.freeze({
    mobileSm:300,
    mobile:576,
    tabletSm:768,
    tablet:992,
    desktopSm:1200,
    desktop:1400,
})
export const currentBreakpoints=new BehaviorSubject<Readonly<Breakpoints>>(defaultBreakpoints);

export const getSizeQueryForBreakpoint=(bp:DirectionalBreakpoint,breakpoints=currentBreakpoints.value)=>{
    switch(bp){
        case 'mobileUp': return `min-width:${breakpoints.mobileSm+1}px`;
        case 'tabletSmUp': return `min-width:${breakpoints.mobile+1}px`;
        case 'tabletUp': return `min-width:${breakpoints.tabletSm+1}px`;
        case 'desktopSmUp': return `min-width:${breakpoints.tablet+1}px`;
        case 'desktopUp': return `min-width:${breakpoints.desktopSm+1}px`;
        case 'mobileSmDown': return `max-width:${breakpoints.mobileSm}px`;
        case 'mobileDown': return `max-width:${breakpoints.mobile}px`;
        case 'tabletSmDown': return `max-width:${breakpoints.tabletSm}px`;
        case 'tabletDown': return `max-width:${breakpoints.tablet}px`;
        case 'desktopSmDown': return `max-width:${breakpoints.desktopSm}px`;
        case 'desktopDown': return `max-width:${breakpoints.desktop}px`;
        default: return `min-width:0px`;
    }
}

export enum BreakpointIndex{
    mobileSm=0,
    mobile=1,
    tabletSm=2,
    tablet=3,
    desktopSm=4,
    desktop=5,
}

export const allDirectionalBreakpoints=[
    'mobileSmUp',
    'mobileUp',
    'tabletSmUp',
    'tabletUp',
    'desktopSmUp',
    'desktopUp',
    'mobileSmDown',
    'mobileDown',
    'tabletSmDown',
    'tabletDown',
    'desktopSmDown',
    'desktopDown',
] as const;
Object.freeze(allDirectionalBreakpoints);
export type DirectionalBreakpoint=typeof allDirectionalBreakpoints[number];

export const allBreakpointAliases=[
    'sm',
    'md',
    'lg',
    'stack',
    'wide',
] as const;
Object.freeze(allBreakpointAliases);
export type BreakpointAliases=typeof allBreakpointAliases[number];
export type BreakpointAliasesMap = {
    [prop in BreakpointAliases]:Breakpoint;
}
export const defaultBreakpointAliases:Readonly<BreakpointAliasesMap>=Object.freeze({
    // mobileSm:300,
    // mobile:576,
    // tabletSm:768,
    // tablet:992,
    // desktopSm:1200,
    // desktop:1400,

    sm:'mobile',
    md:'tabletSm',
    lg:'desktopSm',
    stack:'tabletSm',
    wide:'tablet',
})

export const allDirectionalBreakpointAliases=[
    'smUp',
    'mdUp',
    'lgUp',
    'smDown',
    'mdDown',
    'lgDown',
    'stack',
    'wide',
] as const;
Object.freeze(allDirectionalBreakpointAliases);
export type DirectionalBreakpointAlias=typeof allDirectionalBreakpointAliases[number];
export type DirectionalBreakpointAliasesMap = {
    [prop in DirectionalBreakpointAlias]:DirectionalBreakpoint;
}

export const getDirectionalBreakpointAliasesMap=(map:Readonly<BreakpointAliasesMap>):DirectionalBreakpointAliasesMap=>{
    return {
        smUp:`${map.sm}Up` as DirectionalBreakpoint,
        mdUp:`${map.md}Up` as DirectionalBreakpoint,
        lgUp:`${map.lg}Up` as DirectionalBreakpoint,
        smDown:`${map.sm}Down` as DirectionalBreakpoint,
        mdDown:`${map.md}Down` as DirectionalBreakpoint,
        lgDown:`${map.lg}Down` as DirectionalBreakpoint,
        stack:`${map.stack}Down` as DirectionalBreakpoint,
        wide:`${map.wide}Up` as DirectionalBreakpoint,
    }
}

export const currentBreakpointAliases:ReadonlySubject<Readonly<BreakpointAliasesMap>>=
    new BehaviorSubject<Readonly<BreakpointAliasesMap>>(defaultBreakpointAliases);
export const currentDirectionalBreakpointAliases:ReadonlySubject<Readonly<DirectionalBreakpointAliasesMap>>=
    new BehaviorSubject<Readonly<DirectionalBreakpointAliasesMap>>(getDirectionalBreakpointAliasesMap(defaultBreakpointAliases));
export const setCurrentBreakpointAliases=(map:Readonly<BreakpointAliasesMap>)=>{
    const value={...map};
    const dValue=getDirectionalBreakpointAliasesMap(value);
    (currentBreakpointAliases as BehaviorSubject<Readonly<BreakpointAliasesMap>>).next(value);
    (currentDirectionalBreakpointAliases as BehaviorSubject<Readonly<DirectionalBreakpointAliasesMap>>).next(dValue);
}

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
