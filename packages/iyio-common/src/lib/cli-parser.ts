import { HashMap } from "./common-types";

export interface ParseCliArgsOptions
{
    /**
     * args to parse
     */
    args:string[];

    /**
     * The index in the args array to start parsing
     */
    startIndex?:number;

    /**
     * Can be used to map short params to longer params. For example -d can be mapped to
     * --working-directory when is added the the returned object using the key workingDirectory
     */
    argMapping?:HashMap<string>;

    /**
     * Can be used to pass the remaining args after the specified arg to a rest param
     * @default "--"
     */
    restSeparator?:string;

    /**
     * Key name that the rest params will be assigned to.
     * @default "rest"
     */
    restKey?:string;

    /**
     * The key used to assign values that are not assigned with a param
     * @default "_"
     */
    defaultKey?:string;

    /**
     * arg processing is stopped if a matching arg is found
     * @default "#"
     */
    stopArg?:string;


}

export const parseCliArgs=({
    args,
    startIndex=0,
    argMapping,
    restSeparator='--',
    restKey='rest',
    defaultKey='_',
    stopArg='#'
}:ParseCliArgsOptions):HashMap<string[]>=>{

    const obj:HashMap<string[]>={};

    let key=defaultKey;

    for(let i=startIndex;i<args.length;i++){

        const arg=args[i] as string;
        if(arg===stopArg){
            break;
        }else if(arg===restSeparator){
            const rest:string[]=[];
            for(let r=i+1;r<args.length;r++){
                rest.push(args[r] as string)
            }
            obj[restKey]=rest;
            break;
        }else if(arg.startsWith('-')){
            let value:string|null;
            const e=args.indexOf('=');
            if(e===-1){
                value=null;
                key=arg;
            }else{
                value=arg.substring(e+1);
                key=arg.substring(0,e);
            }
            key=convertCliArgToKeyName(argMapping?.[key]??key);

            let ary=obj[key];
            if(!ary){
                obj[key]=ary=[];
            }
            if(value!==null){
                ary.push(value)
            }
        }else{
            let ary=obj[key];
            if(!ary){
                obj[key]=ary=[];
            }
            ary.push(arg);
            key=defaultKey;
        }
    }


    for(const e in obj){
        const ary=obj[e] as string[];
        if(ary.length===0){
            ary.push('true');
        }
    }


    return obj;

}

export interface ParseCliArgsOptionsT<T> extends ParseCliArgsOptions
{
    converter:CliArgsConverter<T>;
    aliasMap?:CliArgsAliasMap<T>;
}

export interface ParsedTCliArgs<T>
{
    parsed:Partial<T>;
    argMap:HashMap<string[]>;
}

export const parseCliArgsT=<T>({
    converter,
    aliasMap,
    ...props
}:ParseCliArgsOptionsT<T>):ParsedTCliArgs<T>=>{

    if(aliasMap){
        const map=aliasMapToArgMapping<T>(aliasMap);
        if(!props.argMapping){
            props.argMapping={}
        }

        for(const e in map){
            props.argMapping[e]=map[e] as string;
        }
    }

    const argMap=parseCliArgs(props);

    return {
        parsed:convertParsedCliArgs<T>(argMap,converter),
        argMap,
    }
}

export const convertCliArgToKeyName=(paramName:string):string=>{
    return paramName.replace(/^-+/,'').replace(/-(.)/g,(_,ch)=>ch.toUpperCase());
}

export const convertKeyNameToCliArg=(paramName:string):string=>{
    return '--'+paramName.replace(/[A-Z]+/g,c=>'-'+c.toLowerCase())
}


export type CliArgsAliasMap<T>={
    [prop in keyof T]?:string;
}

export const aliasMapToArgMapping=<T>(aliasMap:CliArgsAliasMap<T>):HashMap<string>=>{
    const map:HashMap<string>={}

    for(const e in aliasMap){
        const key=aliasMap[e];
        if(key){
            map[key]=convertKeyNameToCliArg(e);
        }
    }

    return map;
}

export type CliArgsConverter<T>={
    [prop in keyof T]-?:(args:string[])=>T[prop];
}

export const convertParsedCliArgs=<T>(argMap:HashMap<string[]>,converter:CliArgsConverter<T>):Partial<T>=>{
    const converted:HashMap<any>={};

    for(const key in argMap){
        const r=(converter as any)[key]?.(argMap[key]);
        if(r!==undefined){
            converted[key]=r;
        }
    }

    return converted as any;
}

export const escapeCommandLineString=(str:string)=>{
    return "'"+str.replace(singleQuoteReg,"'\\''")+"'";
}
const singleQuoteReg=/'/g
