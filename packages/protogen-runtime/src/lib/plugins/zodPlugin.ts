import { AliasLookup, asArray, getObjKeyCount, joinPaths } from "@iyio/common";
import { ProtoNode, ProtoOutput, ProtoPipelineConfigurablePlugin, getProtoAutoDeleteComment, getProtoPluginPackAndPath, protoChildrenToArray, protoFormatTsComment, protoGenerateTsIndex, protoGetChildrenByName, protoGetFullNodeComment, protoGetFullNodeTsComment, protoTsBuiltTypes, protoTsNumTypes, protoTsTypeMap } from "@iyio/protogen";
import { z } from "zod";
import { SharedTsPluginConfigScheme, getTsSchemeName } from "../sharedTsConfig";



const ZodPluginConfig=z.object(
{

    /**
     * @default .zodPackage
     */
    zodPath:z.string().optional(),

    /**
     * @default "types-index.ts"
     */
    zodIndexFilename:z.string().optional(),


    /**
     * @default "types"
     */
    zodPackage:z.string().optional(),

    /**
     * A comma separated list of properties that should be converted as long strings.
     */
    longStringProps:z.string().optional(),

}).merge(SharedTsPluginConfigScheme);

export const zodPlugin:ProtoPipelineConfigurablePlugin<typeof ZodPluginConfig>=
{
    configScheme:ZodPluginConfig,

    generate:async ({
        log,
        nodes,
        outputs,
        importMap,
        tab,
        packagePaths,
        namespace,
        libStyle,
    },{
        zodPackage='types',
        zodIndexFilename='types-index.ts',
        zodPath,
        longStringProps,
        ...tsConfig
    })=>{

        const {path,packageName}=getProtoPluginPackAndPath(
            namespace,
            zodPackage,
            zodPath,
            libStyle,
            {packagePaths,indexFilename:zodIndexFilename}
        );

        const autoLong=longStringProps?longStringProps.split(',').map(s=>s.trim()):[];

        log(`zodPlugin. node count = ${nodes.length}`)

        const getFullName=(name:string)=>getTsSchemeName(name,tsConfig);


        const useCustomTypes:CustomBuiltInsType[]=[];

        for(const node of nodes){

            const schemeOut:string[]=[];
            const schemeImports:Record<string,string>={};

            const typeOut:string[]=[];
            const typeImports:Record<string,string>={};

            let anyAdded=false;
            for(const nodeType of node.types){

                let added=true;
                let nodeName=node.name;

                switch(nodeType.type){

                    case 'union':
                        addUnion(node,schemeOut,typeOut,tab,getFullName);
                        break;

                    case 'enum':
                        addEnum(node,schemeOut,typeOut,tab,getFullName);
                        break;

                    case 'array':
                        nodeName=addArray(node,typeOut,tab);
                        break;

                    case 'map':
                        nodeName=addMap(node,typeOut,tab);
                        break;

                    case 'function':
                        nodeName=node.name+'FunctionArgs';
                        addInterface(
                            {
                                ...node.children?.['args']??{
                                    name:'args',
                                    type:'',
                                    address:'',
                                    types:[]
                                },
                                name:nodeName
                            },
                            schemeOut,
                            typeOut,
                            tab,
                            autoLong,
                            getFullName,
                            useCustomTypes,
                            schemeImports,
                            typeImports);
                        break;

                    case 'serverFn':
                        nodeName='invoke'+node.name+'FunctionArgs';
                        addInterface(
                            {...node,name:nodeName},
                            schemeOut,
                            typeOut,
                            tab,
                            autoLong,
                            getFullName,
                            useCustomTypes,
                            schemeImports,
                            typeImports,
                            prop=>prop.name==='input'
                        );
                        break;

                    case 'entity':
                    case 'struct':
                    case 'interface':
                    case 'class':
                    case 'event':
                    case 'type':
                        addInterface(
                            node,
                            schemeOut,
                            typeOut,
                            tab,
                            autoLong,
                            getFullName,
                            useCustomTypes,
                            schemeImports,
                            typeImports
                        );
                        break;

                    default:
                        added=false;
                        break;
                }

                if(added){
                    anyAdded=true;
                    if(importMap[nodeName]===packageName){
                        throw new Error(`Export conflict. ${nodeName} already exported from ${packageName}`);
                    }
                    importMap[nodeName]=packageName;
                    const fullName=getFullName(nodeName);
                    if(fullName!==nodeName){
                        importMap[fullName]=packageName;
                    }
                }
            }

            if(anyAdded){
                const names=addAlias(node,schemeOut,tab);
                if(names){
                    for(const name of names){
                        importMap[name]=packageName;
                    }
                }

                addOutputs(node,path,'',[],outputs,typeOut,typeImports);
                addOutputs(node,path,'Scheme',[`import { z } from 'zod';`],outputs,schemeOut,schemeImports);
            }


        }

        outputs.push({
            path:joinPaths(path,zodIndexFilename),
            content:'',
            isPackageIndex:true,
            generator:{
                root:path,
                generator:protoGenerateTsIndex
            }
        })
    }
}

const addOutputs=(
    node:ProtoNode,
    path:string,
    pathSuffix:string,
    append:string[],
    outputs:ProtoOutput[],
    out:string[],
    imports:Record<string,string>
)=>{
    if(!out){
        return;
    }
    const im:Record<string,string[]>={};
    for(const name in imports){
        const path=imports[name];
        if(!path){
            continue;
        }
        const ary=im[path]??(im[path]=[]);
        ary.push(name);
    }

    for(const path in im){
        out.unshift(`import { ${im[path]?.join(', ')} } from '${path}';`)
    }

    out.unshift(
        getProtoAutoDeleteComment([node.name]),
        `// this file was autogenerated by @iyio/protogen - https://github.com/iyioio/common/packages/protogen`,
        ...append,
    );

    outputs.push({
        path:joinPaths(path,node.name+pathSuffix+'.ts'),
        content:out.join('\n'),
    })
}

const addEnum=(node:ProtoNode,schemeOut:string[],typeOut:string[],tab:string,getFullName:(name:string)=>string)=>{

    const fullName=getFullName(node.name);

    const comment=protoGetFullNodeTsComment(node,'');

    typeOut.push('');
    if(comment){
        typeOut.push(comment);
    }
    typeOut.push(`export enum ${node.name}{`);

    if(node.children){
        for(const name in node.children){
            const child=node.children[name];
            if(!child.isContent && !child.special){
                typeOut.push(`${tab}${child.name}${child.type?'='+child.type:''},`);
            }
        }
    }

    typeOut.push('}')

    const schemeComment=protoGetFullNodeComment(node,'');
    let schemeDesc='';
    if(schemeComment){
        schemeDesc=`.describe(${JSON.stringify(schemeComment)})`;
    }
    schemeOut.push('');
    schemeOut.push(`export const ${fullName}=z.number().int()${schemeDesc}`);
}

const addUnion=(node:ProtoNode,schemeOut:string[],typeOut:string[],tab:string,getFullName:(name:string)=>string)=>{

    const fullName=getFullName(node.name);


    const comment=protoGetFullNodeTsComment(node,'');

    schemeOut.push('');
    schemeOut.push(`export const ${fullName}=z.enum([`);

    typeOut.push('');
    if(comment){
        typeOut.push(comment);
    }
    typeOut.push(`export type ${node.name}=(`)

    let added=false;


    if(node.children){
        for(const name in node.children){
            const child=node.children[name];
            if(!child.isContent && !child.special){
                typeOut.push(`${tab}${JSON.stringify(child.name)}|`);
                schemeOut.push(`${tab}${JSON.stringify(child.name)},`);
                added=true;
            }
        }
    }

    if(!added){
        schemeOut.push(`''`);
    }else{
        const last=typeOut[typeOut.length-1];
        if(last){
            typeOut[typeOut.length-1]=last.substring(0,last.length-1);
        }
    }

    const schemeComment=protoGetFullNodeComment(node,'');
    if(schemeComment){
        schemeOut.push(`]).describe(${JSON.stringify(schemeComment)});`);
    }else{
        schemeOut.push(`]);`);
    }
    typeOut.push(');');
}

const addAlias=(node:ProtoNode,out:string[],tab:string)=>{

    let hasAlias=false;
    const toAlias:AliasLookup<string>={};
    const fromAlias:AliasLookup<string>={};
    const aliasList:string[]=[];

    if(node.children){
        for(const name in node.children){
            const child=node.children[name];
            if(child.isContent || child.special){
                continue;
            }

            const aliases=protoGetChildrenByName(child,'alias',false);
            if(aliases.length){
                hasAlias=true;
                for(const a of aliases){

                    const alias=a.value??'';
                    if(aliasList.includes(alias)){
                        throw new Error(`Alias (${alias}) already included for type (${node.name})`);
                    }
                    aliasList.push(alias);
                    let record=toAlias[child.name];
                    if(!record){
                        record={default:alias,all:[]}
                        toAlias[child.name]=record;
                    }
                    record.all.push(alias);

                    record=fromAlias[alias];
                    if(!record){
                        record={default:child.name,all:[]}
                        fromAlias[alias]=record;
                    }
                    record.all.push(child.name);
                }
            }
        }
    }

    if(hasAlias){
        out.push(`export const ${node.name}ToAlias=${JSON.stringify(toAlias,null,tab)}`);
        out.push(`export const ${node.name}FromAlias=${JSON.stringify(fromAlias,null,tab)}`);
        return [`${node.name}ToAlias`,`${node.name}FromAlias`]
    }

    return null;

}

const addArray=(node:ProtoNode,out:string[],tab:string)=>{


    const comment=protoGetFullNodeTsComment(node,'');

    out.push('');
    if(comment){
        out.push(comment);
    }
    out.push(`export const ${node.name}Ary=[`);

    if(node.children){
        for(const name in node.children){
            const child=node.children[name];
            if(child.isContent || child.special){
                continue;
            }
            out.push(`${tab}${JSON.stringify(child.name)},`);
        }
    }

    out.push(`];`);
    return node.name+'Ary';
}

const addMap=(node:ProtoNode,out:string[],tab:string)=>{


    const comment=protoGetFullNodeTsComment(node,'');

    out.push('');
    if(comment){
        out.push(comment);
    }
    out.push(`export const ${node.name}Map={`);

    if(node.children){
        for(const name in node.children){
            const child=node.children[name];
            if(child.isContent || child.special){
                continue;
            }
            out.push(`${tab}${JSON.stringify(child.name)}:${JSON.stringify(child.value||child.name)},`);
        }
    }

    out.push(`};`);
    return node.name+'Map';
}

const addInterface=(
    node:ProtoNode,
    schemeOut:string[],
    typeOut:string[],
    tab:string,
    autoLong:string[],
    getFullName:(name:string)=>string,
    useCustomTypes:CustomBuiltInsType[],
    schemeImports:Record<string,string>,
    typeImports:Record<string,string>,
    propFilter?:(prop:ProtoNode)=>boolean,
)=>{
    const fullName=getFullName(node.name);

    const children=protoChildrenToArray(node.children)
    const hasCustoms=children.some(c=>!isBuiltInType(c.type))?true:false;

    schemeOut.push('');
    if(hasCustoms){
        schemeOut.push(`const __base__${fullName}=z.object({`);
    }else{
        schemeOut.push(`export const ${fullName}=z.object({`);
    }
    typeOut.push('');
    if(node.comment){
        typeOut.push(protoFormatTsComment(node.comment,''));
    }
    typeOut.push(`export interface ${node.name}`);
    typeOut.push('{')
    const lazyProps:string[]=[];
    const typeRefs:string[]=[];

    if(node.children){
        for(const prop of children){
            if(prop.special || prop.isContent || (propFilter && !propFilter(prop))){
                continue;
            }

            const propType=protoTsTypeMap[prop.type]??prop.type??'string';
            const isBuiltIn=isBuiltInType(propType);
            const isStringRecord=prop.types[0]?.mapType==='string';
            const isArray=prop.types[0]?.isArray;

            if(!isBuiltIn){
                if(propType!==node.name){
                    typeImports[propType]=`./${propType}`;
                    schemeImports[propType+'Scheme']=`./${propType}Scheme`;
                }
                const tsLine=`${
                    prop.comment?protoFormatTsComment(prop.comment,tab)+'\n':''
                }${
                    tab
                }${
                    prop.name
                }${
                    prop.optional?'?':''
                }:${
                    isStringRecord?`Record<${prop.types[0]?.mapType},${propType}>`:propType
                }${
                    isArray?'[]':''
                };`
                typeRefs.push(tsLine);
                lazyProps.push(`${
                        tab
                    }${
                        prop.name
                    }:z.lazy(()=>${
                        isStringRecord?
                            `z.record(${getFullName(propType)})`:
                            getFullName(propType)
                    })${
                        isArray?'.array()':''
                    }${getFormatCalls(prop,propType,autoLong)}${
                        prop.optional?'.optional()':''
                    }${
                        getDescribeCall(prop)
                    },`
                );
                continue;
            }

            const customType=getRealCustomType(propType as any);
            const customTypeTs=getRealCustomTypeTs(propType as any);
            if(customType && !useCustomTypes.includes(propType as any)){
                useCustomTypes.push(propType as any)
            }

            schemeOut.push(`${
                    tab
                }${
                    prop.name
                }:${
                    customType||(isStringRecord?
                        `z.record(z.${propType}()${getFormatCalls(prop,propType,autoLong)})`:
                        `z.${propType}()${getFormatCalls(prop,propType,autoLong)}`
                    )
                }${
                    isArray?'.array()':''
                }${
                    prop.optional?'.optional()':''
                }${
                    getDescribeCall(prop)
                },`
            );

            typeOut.push(`${
                    prop.comment?protoFormatTsComment(prop.comment,tab)+'\n':''
                }${
                    tab
                }${
                    prop.name
                }${
                    prop.optional?'?':''
                }:${
                    customTypeTs||(isStringRecord?
                        `Record<string,${propType}>`:
                        propType
                    )
                }${
                    isArray?'[]':''
                };`
            );
        }
    }

    schemeOut.push(`})${getDescribeCall(node)};`);

    typeOut.push(...typeRefs);
    typeOut.push('}')

    if(hasCustoms){
        schemeOut.push(`const __lazy__${fullName}=z.object({`);
        for(const prop of lazyProps){
            schemeOut.push(prop);
        }
        schemeOut.push(`});`)
        schemeOut.push(`export const ${fullName}:(typeof __base__${fullName})=__base__${fullName}.merge(__lazy__${fullName}) as any;`);
    }
}

const customBuiltIns=['map','stringMap','numberMap','booleanMap','dateMap','bigIntMap'] as const;
type CustomBuiltInsType=typeof customBuiltIns[number];
const getRealCustomType=(type:CustomBuiltInsType)=>{
    switch(type){
        case 'map': return 'z.record(z.any())';
        case 'stringMap': return 'z.record(z.string())';
        case 'numberMap': return 'z.record(z.number())';
        case 'booleanMap': return 'z.record(z.boolean())';
        case 'dateMap': return 'z.record(z.date())';
        case 'bigIntMap': return 'z.record(z.bigint())';
        default: return null;
    }
}
const getRealCustomTypeTs=(type:CustomBuiltInsType)=>{
    switch(type){
        case 'map': return 'Record<string,any>';
        case 'stringMap': return 'Record<string,string>';
        case 'numberMap': return 'Record<string,number>';
        case 'booleanMap': return 'Record<string,boolean>';
        case 'dateMap': return 'Record<string,Date>';
        case 'bigIntMap': return 'Record<string,bigint>';
        default: return null;
    }
}
const isBuiltInType=(type:string)=>{
    return protoTsBuiltTypes.includes(type as any) || customBuiltIns.includes(type as any);
}

interface AddCallOptions
{
    defaultValue?:string;
    hasMessage?:boolean;
    rawValue?:boolean;
    option?:(att:ProtoNode)=>string|null;
}
const getFormatCalls=(prop:ProtoNode,propType:string,autoLong:string[]):string=>{
    let call='';

    const add=(type:string|string[],name:string,att:ProtoNode|undefined,getValue?:((att:ProtoNode)=>string|number|null|undefined)|null,{
        defaultValue,
        hasMessage=true,
        rawValue,
        option
    }:AddCallOptions={})=>{
        if(!att){
            return;
        }
        type=asArray(type);
        if(!type.includes(propType)){
            return;
        }
        let value=getValue?.(att)??defaultValue;
        if(typeof value === 'string'){
            value=value.trim()
        }
        if(!rawValue && (typeof value ==='string')){
            value=JSON.stringify(value)
        }
        const message=option?option(att):att.children?.['message']?.value?.trim();
        call+=`.${name}(${value??''}${(message && hasMessage)?(value?',':'')+(option?message:JSON.stringify(message)):''})`

    }

    const attChildren=prop.children??{};

    if(attChildren['zod']?.value){
        call+='.'+attChildren['zod'].value;
    }

    let noAutoLength=attChildren['email']?true:false;

    if(propType==='string' && !attChildren['email'] && /(^e|E)mail($|[A-Z\d_])/.test(prop.name)){
        call+='.email()';
        noAutoLength=true;
    }

    if( !noAutoLength &&
        propType==='string' &&
        !attChildren['max'] &&
        !autoLong.includes(prop.name) &&
        !parseBool(attChildren['long']?.value,false)
    ){
        call+='.max(255)';
    }

    if(prop.type==='int' && !attChildren['int']){
        call+='.int()';
    }

    add(['string',...protoTsNumTypes],'min',attChildren['min'],att=>parseNum(att.value))
    add(['string',...protoTsNumTypes],'max',attChildren['max'],att=>parseNum(att.value))
    add(['string'],'length',attChildren['length'],att=>parseNum(att.value))
    add(['string'],'endsWith',attChildren['endsWith'],att=>att.value)
    add(['string'],'startsWith',attChildren['startsWith'],att=>att.value)
    add(['string'],'email',attChildren['email']);
    add(['string'],'url',attChildren['url']);
    add(['string'],'emoji',attChildren['emoji']);
    add(['string'],'uuid',attChildren['uuid']);
    add(['string'],'cuid',attChildren['cuid']);
    add(['string'],'cuid2',attChildren['cuid2']);
    add(['string'],'ulid',attChildren['ulid']);
    add(['string'],'nonempty',attChildren['notEmpty']);
    add(['string'],'trim',attChildren['trim'],null,{hasMessage:false});
    add(['string'],'toLowerCase',attChildren['lower'],null,{hasMessage:false});
    add(['string'],'toUpperCase',attChildren['upper'],null,{hasMessage:false});

    add('string','ip',attChildren['ip'],att=>parseObj({
        version:att.value||'v4',
        message:att.children?.['message']?.value,
    }),{hasMessage:false,rawValue:true})

    add('string','datetime',attChildren['date'],att=>parseObj({
        precision:parseNum(att.value),
        offset:Boolean(att.value),
        message:att.children?.['message']?.value,
    }),{hasMessage:false,rawValue:true})

    add('string','regex',attChildren['regex'],att=>paseRegex(att),{rawValue:true})

    add('string','includes',attChildren['includes'],att=>att.value,{
        option:att=>parseObj({
            position:parseNum(att.value),
            message:att.children?.['message']?.value,
        })
    })


    add(protoTsNumTypes,'gte',attChildren['gte'],att=>parseNum(att.value))
    add(protoTsNumTypes,'gt',attChildren['gt'],att=>parseNum(att.value))
    add(protoTsNumTypes,'lte',attChildren['lte'],att=>parseNum(att.value))
    add(protoTsNumTypes,'lt',attChildren['lt'],att=>parseNum(att.value))
    add(protoTsNumTypes,'multipleOf',attChildren['multipleOf'],att=>parseNum(att.value))
    add(protoTsNumTypes,'step',attChildren['step'],att=>parseNum(att.value))
    add(protoTsNumTypes,'int',attChildren['int'])
    add(protoTsNumTypes,'positive',attChildren['positive'])
    add(protoTsNumTypes,'negative',attChildren['negative'])
    add(protoTsNumTypes,'nonpositive',attChildren['notPositive'])
    add(protoTsNumTypes,'nonnegative',attChildren['notNegative'])
    add(protoTsNumTypes,'finite',attChildren['finite'])
    add(protoTsNumTypes,'safe',attChildren['safe'])

    add('date','min',attChildren['min'],att=>`new Date(${JSON.stringify(att.value)})`,{rawValue:true})
    add('date','max',attChildren['max'],att=>`new Date(${JSON.stringify(att.value)})`,{rawValue:true})

    return call;

}

const getDescribeCall=(prop:ProtoNode)=>{
    if(!prop.comment?.trim()){
        return '';
    }
    return `.describe(${JSON.stringify(prop.comment.trim().replace(/(\w)\n(\w)/g,'$1 $2'))})`;
}


const parseNum=(str:string|null|undefined)=>{
    if(!str){
        return undefined;
    }
    const n=Number(str);
    return isFinite(n)?n:undefined;
}

const parseObj=(obj:any)=>{
    for(const e in obj){
        const value=typeof obj[e]==='string'?obj[e].trim():obj[e];
        if(value===''){
            delete obj[e];
        }else{
            obj[e]=value;
        }
    }
    return getObjKeyCount(obj)?JSON.stringify(obj):null;
}

const paseRegex=(att:ProtoNode)=>{
    if(!att.value){
        return null;
    }
    try{
        let value=att.value??'';
        let flags:string|undefined=undefined;
        if(value.startsWith('/')){
            const i=value.lastIndexOf('/');
            flags=value.substring(i+1);
            value=value.substring(1,i);
        }
        new RegExp(value,flags);
        return '/'+value+'/'+(flags??'');
    }catch{
        return null;
    }
}

const parseBool=(value:string|undefined,defaultValue:boolean):boolean=>{
    if(!value){
        return defaultValue;
    }
    value=value.trim();
    if(!value){
        return defaultValue;
    }
    return Boolean(value);
}
