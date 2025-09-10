import { getErrorMessage } from "./error-lib.js";

const exportReg=/(^|\n|\}|;)[ \t]*export[ \t]+((default|function|let|const)[ \t]+)?(\w+)/g;

export interface CreateIifeModuleOptions
{
    js:string;
    debug?:boolean;
    scopeVars?:Record<string,any>;
}

export interface IifeModuleResult
{
    success:boolean;
    errorMessage?:string;
    mod:Record<string,any>;
}

export const createIifeModule=(js:string|CreateIifeModuleOptions):IifeModuleResult=>{

    if(typeof js === 'string'){
        js={js}
    }

    const mod:Record<string,any>={};
    try{
        const named:string[]=[];
        const vars=js.scopeVars??{};
        const keys=Object.keys(vars);

        const jsFn=`(module${keys.length?',':''}${keys.join(',')})=>{${
            js.js.replace(exportReg,(_:string,start:string,typePlus:string,type:string,name:string)=>{
                if(type==='default'){
                    return start+'module.default='
                }
                named.push(name);
                return `${start}${typePlus}${name}`;
            })
        };\n${named.map(n=>`module.${n}=${n};\n`)}}`;

        if(js.debug){
            console.log('iife module\n',jsFn);
        }

        // disable esbuild eval warning
        const ev=(globalThis as any)['eval'];
        const modFn=ev(jsFn);
        modFn(mod,...keys.map(k=>vars[k]));

        return {
            success:true,
            mod,
        };
    }catch(ex){

        return {
            success:false,
            errorMessage:getErrorMessage(ex),
            mod,
        }
    }
}


