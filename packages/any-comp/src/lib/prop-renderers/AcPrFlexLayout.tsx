import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutInnerFlexProps, baseLayoutInnerFlexProps } from "@iyio/common";
import { SlimButton, Text, View } from "@iyio/react-common";
import { Fragment } from "react";
import { AnyCompBtn } from "../AnyCompBtn.js";
import { AnyCompViewCtrl } from "../AnyCompViewCtrl.js";
import { useUpdateOnAnyCompPropChange } from "../any-comp-react-lib.js";
import { acStyle } from "../any-comp-style.js";
import { AcProp } from "../any-comp-types.js";
import { getBaseLayoutInfo } from "./prop-render-lib.js";

const jProps:(keyof BaseLayoutInnerFlexProps)[]=[
    'justifyStart','justifyCenter','justifyEnd','justifyEvenly','justifyAround','justifyBetween'
]

const aProps:(keyof BaseLayoutInnerFlexProps)[]=[
    'alignStart','alignCenter','alignEnd','alignStretch'
]

export interface AcPrFlexLayoutProps
{
    ctrl:AnyCompViewCtrl;
    props:AcProp[];
}

export function AcPrFlexLayout({
    ctrl,
    props,
}:AcPrFlexLayoutProps){

    const {
        cProps,
        isCol,
        isRow,
        isRowRev,
        isColRev,
        centerBoth,
        wrap,
        colLike,
        rowLike,
    }=getBaseLayoutInfo(ctrl,props);

    useUpdateOnAnyCompPropChange(ctrl,baseLayoutInnerFlexProps);


    const lines=(
        <Fragment>
            <div className={style.line()}/>
            <div className={style.line()}/>
            <div className={style.line()}/>
        </Fragment>
    )

    return (
        <div className={style.root()}>

            <Text opacity050 text="content layout" />

            <View row g1 flexWrap>
                <AnyCompBtn active={isRow} icon="arrow-right" onClick={()=>{
                    ctrl.setProp('displayFlex',undefined);
                    ctrl.setProp('centerBoth',undefined);
                    ctrl.setProp('rowReverse',undefined);
                    ctrl.setProp('colReverse',undefined);
                    ctrl.setProp('col',undefined);
                    ctrl.setProp('row',cProps['row']?undefined:true);
                }}/>
                <AnyCompBtn active={isCol} icon="arrow-down" onClick={()=>{
                    ctrl.setProp('displayFlex',undefined);
                    ctrl.setProp('centerBoth',undefined);
                    ctrl.setProp('row',undefined);
                    ctrl.setProp('rowReverse',undefined);
                    ctrl.setProp('colReverse',undefined);
                    ctrl.setProp('col',cProps['col']?undefined:true);
                }}/>
                <AnyCompBtn active={isRowRev} icon="arrow-left" onClick={()=>{
                    ctrl.setProp('displayFlex',undefined);
                    ctrl.setProp('centerBoth',undefined);
                    ctrl.setProp('row',undefined);
                    ctrl.setProp('colReverse',undefined);
                    ctrl.setProp('col',undefined);
                    ctrl.setProp('rowReverse',cProps['rowReverse']?undefined:true);
                }}/>
                <AnyCompBtn active={isColRev} icon="arrow-up" onClick={()=>{
                    ctrl.setProp('displayFlex',undefined);
                    ctrl.setProp('centerBoth',undefined);
                    ctrl.setProp('row',undefined);
                    ctrl.setProp('rowReverse',undefined);
                    ctrl.setProp('col',undefined);
                    ctrl.setProp('colReverse',cProps['colReverse']?undefined:true);
                }}/>
                <AnyCompBtn active={wrap} icon="wrap" onClick={()=>{
                    ctrl.setProp('flexWrap',wrap?undefined:true);
                }}/>
                <AnyCompBtn active={centerBoth} icon="centerBoth" onClick={()=>{
                    ctrl.setProp('displayFlex',undefined);
                    ctrl.setProp('rowReverse',undefined);
                    ctrl.setProp('colReverse',undefined);
                    ctrl.setProp('col',undefined);
                    ctrl.setProp('row',undefined);
                    for(const p of jProps){
                        ctrl.setProp(p,undefined);
                    }
                    for(const p of aProps){
                        ctrl.setProp(p,undefined);
                    }
                    ctrl.setProp('centerBoth',cProps['centerBoth']?undefined:true);
                }}/>
            </View>

            {(colLike || rowLike) && <div className={style.layoutGrid({rowLike})}>
                {(rowLike?aProps:jProps).map(_1=>(
                    <Fragment key={_1}>
                        {(rowLike?jProps:aProps).map(_2=>{

                            const a=rowLike?_1:_2;
                            const j=rowLike?_2:_1;
                            const active=cProps[j] && cProps[a];

                            return (
                                <SlimButton
                                    title={`${j} ${a}`}
                                    col={isCol}
                                    row={isRow}
                                    colReverse={isColRev}
                                    rowReverse={isRowRev}
                                    flex1
                                    key={_2}
                                    className={style.btn()}
                                    {...{[j]:true,[a]:true}}
                                    onClick={()=>{
                                        for(const p of jProps){
                                            ctrl.setProp(p,undefined);
                                        }
                                        for(const p of aProps){
                                            ctrl.setProp(p,undefined);
                                        }
                                        ctrl.setProp(j,true);
                                        ctrl.setProp(a,true);
                                    }}
                                >
                                    {lines}
                                    {active && <View absFill className={style.btnActive()}/>}
                                </SlimButton>
                            )
                        })}
                    </Fragment>
                ))}
            </div>}

        </div>
    )

}

const style=atDotCss({namespace:'AnyComp',name:'AcPrFlexLayout',css:`
    @.root{
        display:flex;
        flex-direction:column;
        gap:1rem;
        margin-bottom:1rem;
    }
    @.layoutGrid{
        display:grid;
        grid-template-columns:1fr 1fr 1fr 1fr;
        border-right:${acStyle.var('borderDefault')};
        border-bottom:${acStyle.var('borderDefault')};
    }
    @.layoutGrid.rowLike{
        grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr;
    }
    @.btn{
        height:40px;
        border-left:${acStyle.var('borderDefault')};
        border-top:${acStyle.var('borderDefault')};
        gap:2px;
        position:relative;
    }
    @.btnActive{
        border:${acStyle.var('borderWidth')} solid ${acStyle.var('activeColor')};
    }
    @.line{
        border:${acStyle.var('borderDefault')};
        background-color:${acStyle.var('borderColor')};
        flex-basis:4px;
    }
    @.line:nth-child(1){
        min-width:10%;
    }
    @.line:nth-child(2){
        min-width:40%;
    }
    @.line:nth-child(3){
        min-width:20%;
    }
`});
