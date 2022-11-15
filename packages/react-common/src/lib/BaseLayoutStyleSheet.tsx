
export interface BaseLayoutStyleSheetProps
{
    space0?:string;
    space1?:string;
    space2?:string;
    space3?:string;
    space4?:string;
    space5?:string;
    space6?:string;
}

export function BaseLayoutStyleSheet({
    space0='0px',
    space1='4px',
    space2='8px',
    space3='12px',
    space4='16px',
    space5='24px',
    space6='32px',
}:BaseLayoutStyleSheetProps){

    return (

        <style global jsx>{`

.iy-g0{gap:${space0} !important}
.iy-g1{gap:${space1} !important}
.iy-g2{gap:${space2} !important}
.iy-g3{gap:${space3} !important}
.iy-g4{gap:${space4} !important}
.iy-g5{gap:${space5} !important}
.iy-g6{gap:${space6} !important}

.iy-p0{padding:${space0} !important}
.iy-p1{padding:${space1} !important}
.iy-p2{padding:${space2} !important}
.iy-p3{padding:${space3} !important}
.iy-p4{padding:${space4} !important}
.iy-p5{padding:${space5} !important}
.iy-p6{padding:${space6} !important}

.iy-pl0{padding-left:${space0} !important}
.iy-pl1{padding-left:${space1} !important}
.iy-pl2{padding-left:${space2} !important}
.iy-pl3{padding-left:${space3} !important}
.iy-pl4{padding-left:${space4} !important}
.iy-pl5{padding-left:${space5} !important}
.iy-pl6{padding-left:${space6} !important}

.iy-pr0{padding-right:${space0} !important}
.iy-pr1{padding-right:${space1} !important}
.iy-pr2{padding-right:${space2} !important}
.iy-pr3{padding-right:${space3} !important}
.iy-pr4{padding-right:${space4} !important}
.iy-pr5{padding-right:${space5} !important}
.iy-pr6{padding-right:${space6} !important}

.iy-pt0{padding-top:${space0} !important}
.iy-pt1{padding-top:${space1} !important}
.iy-pt2{padding-top:${space2} !important}
.iy-pt3{padding-top:${space3} !important}
.iy-pt4{padding-top:${space4} !important}
.iy-pt5{padding-top:${space5} !important}
.iy-pt6{padding-top:${space6} !important}

.iy-pb0{padding-bottom:${space0} !important}
.iy-pb1{padding-bottom:${space1} !important}
.iy-pb2{padding-bottom:${space2} !important}
.iy-pb3{padding-bottom:${space3} !important}
.iy-pb4{padding-bottom:${space4} !important}
.iy-pb5{padding-bottom:${space5} !important}
.iy-pb6{padding-bottom:${space6} !important}

.iy-ph0{padding-left:${space0} !important;padding-right:${space0} !important}
.iy-ph1{padding-left:${space1} !important;padding-right:${space1} !important}
.iy-ph2{padding-left:${space2} !important;padding-right:${space2} !important}
.iy-ph3{padding-left:${space3} !important;padding-right:${space3} !important}
.iy-ph4{padding-left:${space4} !important;padding-right:${space4} !important}
.iy-ph5{padding-left:${space5} !important;padding-right:${space5} !important}
.iy-ph6{padding-left:${space6} !important;padding-right:${space6} !important}

.iy-pv0{padding-top:${space0} !important;padding-bottom:${space0} !important}
.iy-pv1{padding-top:${space1} !important;padding-bottom:${space1} !important}
.iy-pv2{padding-top:${space2} !important;padding-bottom:${space2} !important}
.iy-pv3{padding-top:${space3} !important;padding-bottom:${space3} !important}
.iy-pv4{padding-top:${space4} !important;padding-bottom:${space4} !important}
.iy-pv5{padding-top:${space5} !important;padding-bottom:${space5} !important}
.iy-pv6{padding-top:${space6} !important;padding-bottom:${space6} !important}


.iy-m0{margin:${space0} !important}
.iy-m1{margin:${space1} !important}
.iy-m2{margin:${space2} !important}
.iy-m3{margin:${space3} !important}
.iy-m4{margin:${space4} !important}
.iy-m5{margin:${space5} !important}
.iy-m6{margin:${space6} !important}

.iy-ml0{margin-left:${space0} !important}
.iy-ml1{margin-left:${space1} !important}
.iy-ml2{margin-left:${space2} !important}
.iy-ml3{margin-left:${space3} !important}
.iy-ml4{margin-left:${space4} !important}
.iy-ml5{margin-left:${space5} !important}
.iy-ml6{margin-left:${space6} !important}

.iy-mr0{margin-right:${space0} !important}
.iy-mr1{margin-right:${space1} !important}
.iy-mr2{margin-right:${space2} !important}
.iy-mr3{margin-right:${space3} !important}
.iy-mr4{margin-right:${space4} !important}
.iy-mr5{margin-right:${space5} !important}
.iy-mr6{margin-right:${space6} !important}

.iy-mt0{margin-top:${space0} !important}
.iy-mt1{margin-top:${space1} !important}
.iy-mt2{margin-top:${space2} !important}
.iy-mt3{margin-top:${space3} !important}
.iy-mt4{margin-top:${space4} !important}
.iy-mt5{margin-top:${space5} !important}
.iy-mt6{margin-top:${space6} !important}

.iy-mb0{margin-bottom:${space0} !important}
.iy-mb1{margin-bottom:${space1} !important}
.iy-mb2{margin-bottom:${space2} !important}
.iy-mb3{margin-bottom:${space3} !important}
.iy-mb4{margin-bottom:${space4} !important}
.iy-mb5{margin-bottom:${space5} !important}
.iy-mb6{margin-bottom:${space6} !important}

.iy-mh0{margin-left:${space0} !important;margin-right:${space0} !important}
.iy-mh1{margin-left:${space1} !important;margin-right:${space1} !important}
.iy-mh2{margin-left:${space2} !important;margin-right:${space2} !important}
.iy-mh3{margin-left:${space3} !important;margin-right:${space3} !important}
.iy-mh4{margin-left:${space4} !important;margin-right:${space4} !important}
.iy-mh5{margin-left:${space5} !important;margin-right:${space5} !important}
.iy-mh6{margin-left:${space6} !important;margin-right:${space6} !important}

.iy-mv0{margin-top:${space0} !important;margin-bottom:${space0} !important}
.iy-mv1{margin-top:${space1} !important;margin-bottom:${space1} !important}
.iy-mv2{margin-top:${space2} !important;margin-bottom:${space2} !important}
.iy-mv3{margin-top:${space3} !important;margin-bottom:${space3} !important}
.iy-mv4{margin-top:${space4} !important;margin-bottom:${space4} !important}
.iy-mv5{margin-top:${space5} !important;margin-bottom:${space5} !important}
.iy-mv6{margin-top:${space6} !important;margin-bottom:${space6} !important}

.iy-displayFlex{display:flex}
.iy-flexWrap{display:flex;flex-wrap:wrap}
.iy-centerBoth{display:flex;justify-content:center;align-items:center}
.iy-flex1{flex:1}
.iy-flex2{flex:2}
.iy-flex3{flex:3}
.iy-flex4{flex:4}
.iy-flex5{flex:5}
.iy-row{display:flex;flex-direction:row}
.iy-col{display:flex;flex-direction:column}
.iy-rowReverse{display:flex;flex-direction:row-reverse}
.iy-colReverse{display:flex;flex-direction:column-reverse}
.iy-justifyCenter{display:flex;justify-content:center}
.iy-justifyStart{display:flex;justify-content:flex-start}
.iy-justifyEnd{display:flex;justify-content:flex-end}
.iy-justifyAround{display:flex;justify-content:space-around}
.iy-justifyBetween{display:flex;justify-content:space-between}
.iy-alignCenter{display:flex;align-items:center}
.iy-alignStart{display:flex;align-items:flex-start}
.iy-alignEnd{display:flex;align-items:flex-end}
.iy-alignStretch{display:flex;align-items:stretch}
.iy-selfAlignCenter{align-self:center}
.iy-selfAlignStart{align-self:flex-start}
.iy-selfAlignEnd{align-self:flex-end}
.iy-selfAlignStretch{align-self:stretch}

        `}</style>
    )

}
