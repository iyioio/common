import { AcProp, AcPropContainer, AcType, AcTypeContainer, AcTypeDef, AcUnionValue, acContainerKey } from "@iyio/any-comp";
import { getDirectoryName, joinPaths } from "@iyio/common";
import { pathExistsAsync } from "@iyio/node-common";
import { FalseLiteral, Node, NullLiteral, NumericLiteral, ObjectBindingPattern, Project, StringLiteral, SyntaxKind, TrueLiteral, Type } from "ts-morph";
import { JSDoc, JSDocComment, NodeArray } from "typescript";


/**
 * Maps tsconfig files to Projects
 */
const projects:Record<string,Project>={};

/**
 * Maps file paths to Projects
 */
const projectsByFilePath:Record<string,Project>={};

export const getAcPropsAsync=async (
    funcName:string,
    path:string,
    propReg:Record<string,AcPropContainer>,
    typeReg:Record<string,AcTypeContainer>,
    dir:string
):Promise<AcProp[]>=>{

    const project=await getProjectAsync(path);

    if(!project){
        return [];
    }

    const file=project.getSourceFile(path);

    if(!file){
        return [];
    }

    const fn=file.getFunction(funcName);
    if(!fn){
        return [];
    }

    const propDefaults:Record<string,{
        value:any;
        text:string;
    }>={}

    const binding=fn.getParameters()[0]?.getNameNode()
    if(binding instanceof ObjectBindingPattern){
        const elements=binding.getElements();
        for(const elem of elements){
            const init=elem.getInitializer();
            if(!init){
                continue;
            }
            const text=init.getText();
            propDefaults[elem.getName()]={
                text,
                value:nodeToPrimitiveValue(init)
            }

        }
    }

    const paramType=fn.getParameters()[0];
    if(!paramType){
        return []
    }

//triggerNodeBreakpoint();
//paramType.getType().getIntersectionTypes()
//paramType.getType().getBaseTypes()[0]?.getAliasSymbol()?.getName()
// getAliasSymbol is used by type
// use getSymbol it isInterface()
//paramType.getType().getBaseTypes()[0]?.getAliasSymbol()?.getDeclaredType().getIntersectionTypes().map(t=>t.is() && t.getSymbol()?.getName())

// get file prop is defined in
//paramType.getType().getProperties().map(p=>p.getDeclarations()[0]?.getSourceFile().getBaseName())

// works for object as const
//paramType.getType().getProperties().map(p=>p.getDeclarations()[0]?.getParent()?.getParent()?.getParent()?.getSymbol()?.getName());

// const x=paramType.getType().getProperties().map(p=>({
//     name:p.getName(),
//     defined:p.getDeclarations()[0]?.getAncestors().map(a=>({
//         type:SyntaxKind[a.getKind()],
//         name:a.getSymbol()?.getName()
//     })),
//     src:p.getDeclarations()[0]?.getSourceFile().getFilePath()
// }));



    return paramType.getType().getProperties().map<AcProp>(p=>{
        const propName=p.getName();
        const type=p.getTypeAtLocation(fn);
        const optional=p.isOptional();
        const acType=getPropType(type,optional,typeReg);
        const comment=getFullComment(p.compilerSymbol.declarations?.[0] as any);
        const tags=p.getJsDocTags()
        const propTags:Record<string,string>={};

        for(const tag of tags){
            propTags[tag.getName()]=tag.getText().map(t=>t.text).join('\n');
        }


        let prop:AcProp={
            name:propName,
            optional,
            type:acType,
            sig:formatSig(type.getText()),
            comment,
            defaultValue:propDefaults[propName]?.value,
            defaultValueText:propDefaults[propName]?.text,
            tags:propTags,
            bind:propTags['acBind']
        }



        const key=p.getDeclarations()[0]?.getAncestors().map(a=>{
            let name=a.getSymbol()?.getName();
            if(!name){
                return '';
            }
            if(a.getKind()===SyntaxKind.SourceFile){
                if(name.startsWith('"') || name.startsWith("'")){
                    name=name.substring(1);
                }
                if(name.endsWith('"') || name.endsWith("'")){
                    name=name.substring(0,name.length-1);
                }
                if(name.toLowerCase().startsWith(dir)){
                    name=name.substring(dir.length);
                }
                return name;
            }else{
                return name;
            }
        }).join('*');

        if(key){
            const container=propReg[key]??(propReg[key]={
                key,
                props:[],
                index:0,
            });

            const i=container.props.findIndex(p=>p.name===prop.name);
            if(i===-1){
                prop[acContainerKey]=container;
                container.props.push(prop);
            }else{
                const existing=container.props[i];
                if(existing){
                    for(const e in prop){
                        (existing as any)[e]=(prop as any)[e];
                    }
                    prop=existing;
                }else{
                    prop[acContainerKey]=container;
                    container.props.push(prop);
                }
            }


        }

        return prop;
    })??[];
}


const getProjectAsync=async (path:string):Promise<Project|undefined>=>
{
    const existing=projectsByFilePath[path];
    if(existing){
        return existing;
    }

    const tsPath=await findTsConfigPathAsync(path);
    if(!tsPath){
        return undefined;
    }

    const project=projects[tsPath]??(projects[tsPath]=new Project({
        tsConfigFilePath:tsPath,
    }));

    projectsByFilePath[path]=project;

    return project;
}

const tsConfigNames=['tsconfig.lib-esm.json','tsconfig'];

const findTsConfigPathAsync=async (path:string):Promise<string|undefined>=>{
    const dir=getDirectoryName(path);
    if(dir==='/' || !dir || path===dir){
        return undefined;
    }
    for(const ts of tsConfigNames){
        if(await pathExistsAsync(joinPaths(dir,ts))){
            return joinPaths(dir,ts)
        }
    }

    return await findTsConfigPathAsync(dir);
}

const getPropType=(type:Type,optional:boolean,typeReg:Record<string,AcTypeContainer>):AcTypeDef=>{
    const t=_getPropType(type,optional);

    const key=getTypeKey(t);

    const container=typeReg[key]??(typeReg[key]={
        key,
        index:0,
        type:t
    });

    return container.type;
}

const _getPropType=(type:Type,optional:boolean):AcTypeDef=>{

    let unionTypes:Type[]|undefined;

    if(optional && type.isUnion()){
        unionTypes=type.getUnionTypes();
        const i=unionTypes.findIndex(u=>u.isUndefined());
        if(i!==-1){
            if(unionTypes.length===2){
                type=unionTypes[i===0?1:0] as Type;
                unionTypes=undefined;
            }else{
                unionTypes=[...unionTypes];
                unionTypes.splice(i,1);
            }
        }
    }

    if(type.isUnion()){
        if(!unionTypes){
            unionTypes=type.getUnionTypes();
        }
        return {
            type:'union',
            unionValues:unionTypes.map<AcUnionValue>(t=>{
                const def:AcUnionValue={
                    type:typeToAcType(t),
                    label:formatSig(t.getText()),
                }
                if(t.isLiteral()){
                    def.isLiteral=true;
                    def.literalValue=t.getLiteralValue();
                }
                return def;
            })
        }
    }else{
        const def:AcTypeDef={
            type:typeToAcType(type)
        }
        if(type.isLiteral()){
            def.isLiteral=true;
            def.literalValue=type.getLiteralValue();
        }
        return def;
    }
}

const getJDocs=(node:Node|null|undefined):JSDoc[]=>
{
    const d=(node as any)?.jsDoc;
    if(!d){
        return [];
    }
    return Array.isArray(d)?d:[d];
}

const getFullComment=(node:Node|null|undefined):string|undefined=>
{
    const docs=getJDocs(node);
    const out:string[]=[];
    for(const d of docs){
        const cLines=getComments(d.comment);
        if(cLines){
            out.push(...cLines);
        }

        if(d.tags){
            for(const t of d.tags){
                const lines=getComments(t.comment);
                out.push(`@${t.tagName.escapedText}${lines?' '+lines.join('\n'):''}`)
            }
        }
    }
    return out.length?out.join('\n'):undefined;
}

const getComments=(comments:string|NodeArray<JSDocComment>|null|undefined):string[]|undefined=>{
    if(!comments){
        return undefined;
    }
    if(typeof comments === 'string'){
        return [comments]
    }else{
        const out:string[]=[];
        for(const c of comments){
            if(c.text){
                out.push(c.text)
            }
        }
        return out.length?out:undefined;
    }
}

const nodeToPrimitiveValue=(node:Node|null|undefined)=>{
    if(!node){
        return undefined;
    }
    if(node instanceof StringLiteral){
        return node.getLiteralValue();
    }else if(node instanceof NumericLiteral){
        return node.getLiteralValue();
    }else if(node instanceof FalseLiteral){
        return false;
    }else if(node instanceof TrueLiteral){
        return true;
    }else if(node instanceof NullLiteral){
        return null;
    }else{
        return undefined;
    }
}



const typeToAcType=(type:Type|null|undefined):AcType=>{
    if(!type){
        return 'undefined';
    }
    if(type.isString()){
        return 'string';
    }else if(type.isNumber()){
        return 'number'
    }else if(type.isBoolean()){
        return 'boolean';
    }else if(type.isNull()){
        return 'null';
    }else if(type.isBigInt()){
        return 'bigint';
    }else if(type.getCallSignatures().length>0){
        return 'function';
    }else if(type.isUndefined()){
        return 'undefined';
    }else if(type.isLiteral()){
        if(type.isStringLiteral()){
            return 'string';
        }else if(type.isNumberLiteral()){
            return 'number';
        }else if(type.isBooleanLiteral()){
            return 'boolean';
        }else if(type.isBigIntLiteral()){
            return 'bigint';
        }
    }

    return 'object';
}


const getTypeKey=(type:AcTypeDef):string=>{
    if(type.type==='union' && type.unionValues){
        let n='[';
        for(const t of type.unionValues){
            if(t.isLiteral){
                n+=t.type+'='+t.literalValue
            }else{
                n+=t.type;
            }
            n+='|'
        }
        return n.substring(0,n.length-1)+']';
    }else if(type.isLiteral){
        return type.type+'='+type.literalValue
    }else{
        return type.type
    }
}

const formatSig=(sig:string):string=>{
    return sig.replace(/\s*import\([^)]*\)\s*\.?\s*/g,'')
}
