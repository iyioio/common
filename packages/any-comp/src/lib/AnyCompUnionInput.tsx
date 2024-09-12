import { atDotCss } from "@iyio/at-dot-css";
import { useAlphaId } from "@iyio/react-common";
import { AnyCompInputShell } from "./AnyCompInputShell";
import { AnyCompViewCtrl } from "./AnyCompViewCtrl";
import { acTags, parseAcBoolLabel } from "./any-comp-lib";
import { useUpdateOnAnyCompPropChange } from "./any-comp-react-lib";
import { acStyle } from "./any-comp-style";
import { AcProp, AnyCompBoolLabels } from "./any-comp-types";

export interface AnyCompUnionInputProps
{
    ctrl:AnyCompViewCtrl;
    prop:AcProp;
}

export function AnyCompUnionInput({
    ctrl,
    prop,
}:AnyCompUnionInputProps){

    useUpdateOnAnyCompPropChange(ctrl,prop.name);
    const value=ctrl.props[prop.name];
    const strValue=value===undefined?'undefined':value===null?'null':(value?.toString()??'');


    const id=useAlphaId();

    let showCheck=false;
    let openText=false;
    let optional=prop.o??false;
    let addNull=false;
    let allowFalse=false;
    let allowTrue=false;

    const options:any[]=[];


    if(prop.type.unionValues){
        let boolLabels:AnyCompBoolLabels|undefined;
        for(let i=0;i<prop.type.unionValues.length;i++){
            const type=prop.type.unionValues[i];
            if(!type){continue}

            if( type.type==='boolean' ||
                type.literalValue===true ||
                type.literalValue===false
            ){
                if(!boolLabels){
                    boolLabels=parseAcBoolLabel(prop.tags?.[acTags.acBoolLabels]);
                }
                if(type.literalValue===true || type.literalValue===undefined){
                    options.unshift(<option key={i} value="true">{boolLabels.trueLabel}</option>);
                    allowTrue=true;
                }
                if(type.literalValue===false || type.literalValue===undefined){
                    options.splice(allowTrue?1:0,0,<option key={i} value="false">{boolLabels.falseLabel}</option>)
                    allowFalse=true;
                }
                showCheck=true;
            }else if(type.isLiteral){
                options.push(<option key={i} value={type.literalValue?.toString()??''}>{type.literalValue?.toString()??''}</option>)
            }else if(type.type==='null'){
                addNull=true;
            }else if(type.type==='undefined'){
                optional=true;
            }else{
                openText=true;
            }
        }
    }

    if(addNull){
        options.push(<option key="null" value="null">(null)</option>);
    }

    if(optional){
        options.push(<option key="undefined" value="undefined">(undefined)</option>);
    }


    return (
        <AnyCompInputShell>
            {showCheck &&
                <div className={style.checkContainer()} >
                    <input type="checkbox" checked={value?true:false} onChange={e=>{
                        if(e.target.checked){
                            if(allowTrue){
                                ctrl.setProp(prop.name,true);
                            }
                        }else{
                            if(optional){
                                ctrl.setProp(prop.name,undefined);
                            }else if(allowFalse){
                                ctrl.setProp(prop.name,false);
                            }
                        }
                    }}/>
                </div>
            }
            {openText?
                <>
                    <input className={style.input()} type="text" list={`AnyCompUnionInput-${id}`} value={strValue} />
                    <datalist id={`AnyCompUnionInput-${id}`}>
                        {options}
                    </datalist>
                </>
            :
                <select className={style.input()} value={strValue} onChange={e=>{
                    const value=e.target.value;
                    if(value==='null'){
                        ctrl.setProp(prop.name,null);
                    }else if(value==='undefined'){
                        ctrl.setProp(prop.name,undefined);
                    }else if(value==='true'){
                        ctrl.setProp(prop.name,true);
                    }else if(value==='false'){
                        ctrl.setProp(prop.name,false);
                    }else{
                        const uv=prop.type.unionValues?.find(u=>(u.literalValue?.toString()??'')===value);
                        if(uv){
                            ctrl.setProp(prop.name,uv.literalValue);
                        }else if(optional){
                            ctrl.setProp(prop.name,undefined);
                        }
                    }
                }}>
                    {options}
                </select>
            }
        </AnyCompInputShell>
    )

}

const style=atDotCss({name:'AnyCompUnionInput',css:`
    @.input{
        flex:1;
        background:transparent;
        border:none;
        padding:${acStyle.var('inputPadding')};
    }
    @.checkContainer{
        align-self:stretch;
        min-width:2rem;
        display:flex;
        justify-content:center;
        align-items:center;
        border-right:${acStyle.var('borderDefault')};
    }
`});
