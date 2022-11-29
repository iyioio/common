import { Breakpoints, css, currentBreakpoints } from '@iyio/common';
import Style from 'styled-jsx/style';
import { useSubject } from './rxjs-hooks';


export interface BaseLayoutStyleSheetProps
{
    space0?:string;
    space1?:string;
    space2?:string;
    space3?:string;
    space4?:string;
    space5?:string;
    space6?:string;
    breakpoints?:Breakpoints;
}

export function BaseLayoutStyleSheet({
    space0='0px',
    space1='4px',
    space2='8px',
    space3='12px',
    space4='16px',
    space5='24px',
    space6='32px',
    breakpoints,
}:BaseLayoutStyleSheetProps){

    const _bp=useSubject(currentBreakpoints);
    const bp=breakpoints??_bp;

    return (

        <Style id="AoRD5JpZOl3Lg2RcD98y" global jsx>{css`

.ioG0{gap:${space0} !important}
.ioG1{gap:${space1} !important}
.ioG2{gap:${space2} !important}
.ioG3{gap:${space3} !important}
.ioG4{gap:${space4} !important}
.ioG5{gap:${space5} !important}
.ioG6{gap:${space6} !important}

.ioP0{padding:${space0} !important}
.ioP1{padding:${space1} !important}
.ioP2{padding:${space2} !important}
.ioP3{padding:${space3} !important}
.ioP4{padding:${space4} !important}
.ioP5{padding:${space5} !important}
.ioP6{padding:${space6} !important}

.ioPl0{padding-left:${space0} !important}
.ioPl1{padding-left:${space1} !important}
.ioPl2{padding-left:${space2} !important}
.ioPl3{padding-left:${space3} !important}
.ioPl4{padding-left:${space4} !important}
.ioPl5{padding-left:${space5} !important}
.ioPl6{padding-left:${space6} !important}

.ioPr0{padding-right:${space0} !important}
.ioPr1{padding-right:${space1} !important}
.ioPr2{padding-right:${space2} !important}
.ioPr3{padding-right:${space3} !important}
.ioPr4{padding-right:${space4} !important}
.ioPr5{padding-right:${space5} !important}
.ioPr6{padding-right:${space6} !important}

.ioPt0{padding-top:${space0} !important}
.ioPt1{padding-top:${space1} !important}
.ioPt2{padding-top:${space2} !important}
.ioPt3{padding-top:${space3} !important}
.ioPt4{padding-top:${space4} !important}
.ioPt5{padding-top:${space5} !important}
.ioPt6{padding-top:${space6} !important}

.ioPb0{padding-bottom:${space0} !important}
.ioPb1{padding-bottom:${space1} !important}
.ioPb2{padding-bottom:${space2} !important}
.ioPb3{padding-bottom:${space3} !important}
.ioPb4{padding-bottom:${space4} !important}
.ioPb5{padding-bottom:${space5} !important}
.ioPb6{padding-bottom:${space6} !important}

.ioPh0{padding-left:${space0} !important;padding-right:${space0} !important}
.ioPh1{padding-left:${space1} !important;padding-right:${space1} !important}
.ioPh2{padding-left:${space2} !important;padding-right:${space2} !important}
.ioPh3{padding-left:${space3} !important;padding-right:${space3} !important}
.ioPh4{padding-left:${space4} !important;padding-right:${space4} !important}
.ioPh5{padding-left:${space5} !important;padding-right:${space5} !important}
.ioPh6{padding-left:${space6} !important;padding-right:${space6} !important}

.ioPv0{padding-top:${space0} !important;padding-bottom:${space0} !important}
.ioPv1{padding-top:${space1} !important;padding-bottom:${space1} !important}
.ioPv2{padding-top:${space2} !important;padding-bottom:${space2} !important}
.ioPv3{padding-top:${space3} !important;padding-bottom:${space3} !important}
.ioPv4{padding-top:${space4} !important;padding-bottom:${space4} !important}
.ioPv5{padding-top:${space5} !important;padding-bottom:${space5} !important}
.ioPv6{padding-top:${space6} !important;padding-bottom:${space6} !important}


.ioM0{margin:${space0} !important}
.ioM1{margin:${space1} !important}
.ioM2{margin:${space2} !important}
.ioM3{margin:${space3} !important}
.ioM4{margin:${space4} !important}
.ioM5{margin:${space5} !important}
.ioM6{margin:${space6} !important}

.ioMl0{margin-left:${space0} !important}
.ioMl1{margin-left:${space1} !important}
.ioMl2{margin-left:${space2} !important}
.ioMl3{margin-left:${space3} !important}
.ioMl4{margin-left:${space4} !important}
.ioMl5{margin-left:${space5} !important}
.ioMl6{margin-left:${space6} !important}

.ioMr0{margin-right:${space0} !important}
.ioMr1{margin-right:${space1} !important}
.ioMr2{margin-right:${space2} !important}
.ioMr3{margin-right:${space3} !important}
.ioMr4{margin-right:${space4} !important}
.ioMr5{margin-right:${space5} !important}
.ioMr6{margin-right:${space6} !important}

.ioMt0{margin-top:${space0} !important}
.ioMt1{margin-top:${space1} !important}
.ioMt2{margin-top:${space2} !important}
.ioMt3{margin-top:${space3} !important}
.ioMt4{margin-top:${space4} !important}
.ioMt5{margin-top:${space5} !important}
.ioMt6{margin-top:${space6} !important}

.ioMb0{margin-bottom:${space0} !important}
.ioMb1{margin-bottom:${space1} !important}
.ioMb2{margin-bottom:${space2} !important}
.ioMb3{margin-bottom:${space3} !important}
.ioMb4{margin-bottom:${space4} !important}
.ioMb5{margin-bottom:${space5} !important}
.ioMb6{margin-bottom:${space6} !important}

.ioMh0{margin-left:${space0} !important;margin-right:${space0} !important}
.ioMh1{margin-left:${space1} !important;margin-right:${space1} !important}
.ioMh2{margin-left:${space2} !important;margin-right:${space2} !important}
.ioMh3{margin-left:${space3} !important;margin-right:${space3} !important}
.ioMh4{margin-left:${space4} !important;margin-right:${space4} !important}
.ioMh5{margin-left:${space5} !important;margin-right:${space5} !important}
.ioMh6{margin-left:${space6} !important;margin-right:${space6} !important}

.ioMv0{margin-top:${space0} !important;margin-bottom:${space0} !important}
.ioMv1{margin-top:${space1} !important;margin-bottom:${space1} !important}
.ioMv2{margin-top:${space2} !important;margin-bottom:${space2} !important}
.ioMv3{margin-top:${space3} !important;margin-bottom:${space3} !important}
.ioMv4{margin-top:${space4} !important;margin-bottom:${space4} !important}
.ioMv5{margin-top:${space5} !important;margin-bottom:${space5} !important}
.ioMv6{margin-top:${space6} !important;margin-bottom:${space6} !important}

.ioDisplayFlex{display:flex}
.ioFlexWrap{display:flex;flex-wrap:wrap}
.ioCenterBoth{display:flex;justify-content:center;align-items:center}
.ioFlex1{flex:1}
.ioFlex2{flex:2}
.ioFlex3{flex:3}
.ioFlex4{flex:4}
.ioFlex5{flex:5}
.ioFlex6{flex:6}
.ioRow{display:flex;flex-direction:row}
.ioCol{display:flex;flex-direction:column}
.ioRowReverse{display:flex;flex-direction:row-reverse}
.ioColReverse{display:flex;flex-direction:column-reverse}
.ioJustifyCenter{display:flex;justify-content:center}
.ioJustifyStart{display:flex;justify-content:flex-start}
.ioJustifyEnd{display:flex;justify-content:flex-end}
.ioJustifyAround{display:flex;justify-content:space-around}
.ioJustifyBetween{display:flex;justify-content:space-between}
.ioAlignCenter{display:flex;align-items:center}
.ioAlignStart{display:flex;align-items:flex-start}
.ioAlignEnd{display:flex;align-items:flex-end}
.ioAlignStretch{display:flex;align-items:stretch}
.ioSelfAlignCenter{align-self:center}
.ioSelfAlignStart{align-self:flex-start}
.ioSelfAlignEnd{align-self:flex-end}
.ioSelfAlignStretch{align-self:stretch}

.ioGrid1{display:grid;grid-template-columns:1fr}
.ioGrid2{display:grid;grid-template-columns:1fr 1fr}
.ioGrid3{display:grid;grid-template-columns:1fr 1fr 1fr}
.ioGrid4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr}
.ioGrid5{display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr}
.ioGrid6{display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr}
.ioGridAuto1{display:grid;grid-template-columns:auto}
.ioGridAuto2{display:grid;grid-template-columns:auto auto}
.ioGridAuto3{display:grid;grid-template-columns:auto auto auto}
.ioGridAuto4{display:grid;grid-template-columns:auto auto auto auto}
.ioGridAuto5{display:grid;grid-template-columns:auto auto auto auto auto}
.ioGridAuto6{display:grid;grid-template-columns:auto auto auto auto auto auto}
.ioDisplayGrid{display:grid}
.ioDisplayInlineGrid{display:inline-grid}

.ioOffScreen{position:fixed;left:-101vw;top:-101vh;max-width:100vw;max-height:100vh;overflow:clip;pointer-events:none}
.ioPosAbs{position:absolute}
.ioPosRel{position:relative}
.ioPosFixed{position:fixed}
.ioAbsFill{position:absolute;left:0;top:0;right:0;bottom:0}
.ioAbsFillWh{position:absolute;left:0;top:0;width:100%;height:100%}
.ioWh100{width:100%;height:100%}
.ioBorderBox{box-sizing:border-box}
.ioPointerEventsNone{pointer-events:none}
.ioCursorPointer{cursor:pointer}
.ioDisplayNone{display:none !important}

@media (max-width:${bp.mobileSm}px){.ioBpMobileUp{display:none !important}}
@media (max-width:${bp.mobile}px){.ioBpTabletSmUp{display:none !important}}
@media (max-width:${bp.tabletSm}px){.ioBpTabletUp{display:none !important}}
@media (max-width:${bp.tablet}px){.ioBpDesktopSmUp{display:none !important}}
@media (max-width:${bp.desktopSm}px){.ioBpDesktopUp{display:none !important}}

@media (min-width:${bp.mobileSm+1}px){.ioBpMobileSmDown{display:none !important}}
@media (min-width:${bp.mobile+1}px){.ioBpMobileDown{display:none !important}}
@media (min-width:${bp.tabletSm+1}px){.ioBpTabletSmDown{display:none !important}}
@media (min-width:${bp.tablet+1}px){.ioBpTabletDown{display:none !important}}
@media (min-width:${bp.desktopSm+1}px){.ioBpDesktopSmDown{display:none !important}}

        `}</Style>
    )

}
