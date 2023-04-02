export type DesignTokenVariation="light"|"dark";
export const allDesignTokenVariations:ReadonlyArray<DesignTokenVariation>=Object.freeze(["light","dark"]);
export const defaultDesignTokenVariation:DesignTokenVariation="dark";

export interface DesignTokens
{
    readonly variation:DesignTokenVariation;
    readonly borderRadius:string;
    readonly bgColor:string;
    readonly foreground:string;
    readonly fontFamily:string;
    readonly fontColor:string;
    readonly fontSize:string;
    readonly inputBgColor:string;
    readonly mutedColor:string;
    readonly panelColor:string;
    readonly containerPadding:string;

    readonly infoColor:string;
    readonly successColor:string;
    readonly warnColor:string;
    readonly dangerColor:string;

    readonly entityBgColor:string;
    readonly entityNameColor:string;
    readonly entityTypeColor:string;
    readonly memberNameWeight:string;
    readonly memberNameColor:string;
    readonly memberCtrlWeight:string;
    readonly memberCtrlColor:string;
    readonly memberTypeWeight:string;
    readonly memberTypeColor:string;
    readonly caretColor:string;

    readonly anchorSize:number;
    readonly anchorColor:string;
    readonly lineColor:string;

    readonly codeLineHeight:number;
    readonly codeFontSize:number;
    readonly codeVPadding:number;
    readonly codeHPadding:number;
}


const darkTokens:DesignTokens=Object.freeze(
{
    variation:"dark",
    borderRadius:"4px",
    bgColor:"#151515",
    fontFamily:'Courier New',
    fontSize:'14px',
    fontColor:"#ffffff",
    foreground:"#ffffff",
    inputBgColor:"#282B30",
    mutedColor:"#6F767E",
    panelColor:"#1B1D1F",
    containerPadding:'14px',

    infoColor:'#5D93CA',
    successColor:'#6FC5B1',
    warnColor:'#DCDCAF',
    dangerColor:'#CB5A58',

    entityBgColor:'#1c1c1c94',
    entityNameColor:'#BC8ABD',
    entityTypeColor:'#6FC5B1',
    memberNameWeight:'bold',
    memberNameColor:'#A8DAFB',
    memberCtrlWeight:'normal',
    memberCtrlColor:'#ffffff88',
    memberTypeWeight:'normal',
    memberTypeColor:'#6FC5B1',
    caretColor:'#ffffff',

    anchorSize:10,
    anchorColor:'#444444',
    lineColor:'#88B6BA',

    codeLineHeight:18,
    codeFontSize:15,
    codeVPadding:8,
    codeHPadding:16,

})



const lightTokens:DesignTokens=Object.freeze(
{
    ...darkTokens,
    variation:"light",
    borderRadius:"12px",
    bgColor:"#f4f4f4",
    fontFamily:'Courier New',
    fontColor:"#111315",
    inputBgColor:"#F4F4F4",
    mutedColor:"#9A9FA5",
    panelColor:"#fcfcfc",
})

export const designTokenValues=Object.freeze(
{
    light:lightTokens,
    dark:darkTokens,
})

