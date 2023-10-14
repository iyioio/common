import { AcComp, AcProp, AcType, AcTypeDef } from '@iyio/any-comp';
import { DisposeContainer, delayAsync, sortStringsCallback } from '@iyio/common';
import { access, mkdir, readFile, readdir, stat, watch, writeFile } from 'fs/promises';
import { basename, join } from 'path';
import { FunctionDeclaration, FunctionLikeDeclaration, Identifier, InterfaceDeclaration, PropertySignature, ScriptKind, ScriptTarget, SyntaxKind, TypeNode, TypeReferenceNode, createSourceFile } from 'typescript';

const compBodyPlaceholder='______COMP_BODY________';

export interface AnyCompWatcherOptions
{
    watchDirs:string[];
    ignore?:(string|RegExp)[];
    match?:(string|RegExp)[];
    log?:(...args:any)=>void;
    outDir:string;
}

export class AnyCompWatcher
{

    private readonly watchDirs:string[];

    private readonly ignore:(string|RegExp)[];

    private readonly match:(string|RegExp)[];

    private readonly log?:(...args:any)=>void;

    private readonly outDir:string;

    public constructor({
        watchDirs,
        ignore=['node_modules',/^\..*/],
        match=[/\.(tsx)$/i],
        log,
        outDir,
    }:AnyCompWatcherOptions)
    {

        if(!outDir.trim()){
            throw new Error('outDir required');
        }

        this.watchDirs=watchDirs;
        this.ignore=ignore.map(i=>(typeof i === 'string')?i.toLowerCase():i);
        this.match=match.map(i=>(typeof i === 'string')?i.toLowerCase():i);
        this.log=log;
        this.outDir=outDir;
    }

    public async watchAsync()
    {
        this.updateReg();
        await Promise.all(this.watchDirs.map(d=>this.watchDirAsync(d)));
    }

    private readonly disposables=new DisposeContainer();
    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.disposables.dispose();
        for(const e in this.outputs){
            this.outputs[e]?.dispose();
        }
    }

    private async watchDirAsync(dir:string){

        if(this.isDisposed){
            return;
        }

        this.log?.(`watch comps - ${dir}`);

        const ac=new AbortController();
        const watcher=watch(dir,{signal:ac.signal});
        this.disposables.addCb(()=>ac.abort());

        await this.scanAsync(dir);
        if(this.isDisposed){
            return;
        }

        try{
            for await (const evt of watcher){
                await this.scanAsync(join(dir,evt.filename));
            }
        }catch(ex){
            if(!this.isDisposed){
                console.error(`watchDirAsync error. dir=${dir}`,ex);
            }
        }

    }

    private shouldIgnore(path:string)
    {
        const name=basename(path).toLowerCase();
        for(const i of this.ignore){
            if(!i){
                continue;
            }
            if(typeof i === 'string'){
                if(i===name){
                    return true;
                }
            }else if(i?.test(name)){
                return true;
            }
        }

        return false;
    }

    private isMatch(path:string)
    {
        const name=basename(path).toLowerCase();
        for(const i of this.match){
            if(!i){
                continue;
            }
            if(typeof i === 'string'){
                if(i===name){
                    return true;
                }
            }else if(i?.test(name)){
                return true;
            }
        }

        return false;
    }

    private async scanAsync(path:string):Promise<void>
    {

        if(this.shouldIgnore(path)){
            return;
        }

        try{
            await access(path);
        }catch{
            this.clearPathAsync(path);
            return;
        }
        try{
            const info=await stat(path);
            if(this.isDisposed){return}

            if(info.isFile() || info.isSymbolicLink()){

                if(this.isMatch(path)){
                    this.handleFileAsync(path);
                }

            }else if(info.isDirectory()){
                const files=await readdir(path);
                if(this.isDisposed){return}
                for(const file of files){
                    await this.scanAsync(join(path,file));
                    if(this.isDisposed){return}
                }

            }

        }catch(ex){
            console.error(`scan (${path}) failed`,ex);
        }
    }

    private outputs:Record<string,AcOutput>={}

    private nextOutputId=1;

    private async clearPathAsync(path:string){
        for(const e in this.outputs){
            if(e.startsWith(path)){
                this.outputs[e]?.dispose();
                delete this.outputs[e];
            }
        }
    }

    private async handleFileAsync(path:string){

        this.outputs[path]?.dispose();

        let isDis=false;
        const output:AcOutput={
            id:this.nextOutputId++,
            path,
            comps:[],
            dispose:()=>{
                isDis=true;
            }
        }

        const content=(await readFile(path)).toString();
        if(isDis){
            return;
        }

        const kind=ScriptKind.TSX;
        const sourceFile=createSourceFile(
            path,
            content,
            ScriptTarget.ES2020,
            false,
            kind
        );


        for(const s of sourceFile.statements){
            if(s.kind===SyntaxKind.FunctionDeclaration){
                const fn=s as FunctionDeclaration;
                const name=fn.name?.escapedText;

                if(fn.parameters.length!==1 || !name || !fn.modifiers?.some(m=>m.kind===SyntaxKind.ExportKeyword)){
                    continue;
                }

                const param=fn.parameters[0];
                if(!param?.type){
                    continue;
                }

                const propType=((param.type as TypeReferenceNode)?.typeName as Identifier)?.escapedText;
                if(!propType){
                    continue;
                }

                const propInterface=sourceFile.statements.find(s=>
                    s.kind===SyntaxKind.InterfaceDeclaration &&
                    (s as InterfaceDeclaration)?.name?.escapedText===propType
                ) as InterfaceDeclaration|undefined;

                if(!propInterface){
                    continue;
                }

                const props:AcProp[]=[];

                for(const _prop of propInterface.members){

                    const prop=_prop as PropertySignature;
                    const propName=(prop.name as Identifier)?.escapedText;

                    if(!propName){
                        continue;
                    }

                    const optional=prop.questionToken?true:false;
                    const types:AcTypeDef[]=[];
                    getPropType(prop.type,types,true);
                    if(!types.length){
                        continue;
                    }

                    const propObj:AcProp={
                        name:propName,
                        optional,
                        types,
                        defaultType:types[0]??{type:'object'},
                        sig:content.substring(prop.pos,prop.end).trim(),
                    };

                    if(propObj.sig.endsWith(';')){
                        propObj.sig=propObj.sig.substring(0,propObj.sig.length-1);
                    }

                    const sigI=propObj.sig.indexOf(':');
                    if(sigI!==-1){
                        propObj.sig=propObj.sig.substring(sigI+1);
                    }


                    props.push(propObj);
                }

                output.comps.push({
                    id:`${path}::${name}`,
                    name,
                    path,
                    propType,
                    props,
                    comp:compBodyPlaceholder,
                    isDefaultExport:fn.modifiers.some(m=>m.kind===SyntaxKind.DefaultKeyword)
                })

            }
        }

        output.comps.sort((a,b)=>a.id.localeCompare(b.id))


        this.outputs[path]=output;
        this.updateReg();
    }

    private updateRequested=false;
    private isUpdatingReg=false;
    private async updateReg()
    {
        if(this.isDisposed){
            return;
        }
        if(this.isUpdatingReg){
            this.updateRequested=true;
            return;
        }
        this.isUpdatingReg=true;
        try{

            await delayAsync(1000);
            if(this.isDisposed){
                return;
            }

            const lines=this.getRegFile();

            await mkdir(this.outDir,{recursive:true});
            await writeFile(join(this.outDir,'all-comps.tsx'),lines.join('\n'));

        }finally{
            this.isUpdatingReg=false;
            if(this.updateRequested){
                this.updateRequested=false;
                this.updateReg();
            }
        }
    }

    public getRegFile():string[]{
        const lines:string[]=[];

        lines.push('/* eslint-disable @nrwl/nx/enforce-module-boundaries */');
        lines.push('import { Suspense, lazy } from "react";');
        const insertOffset=lines.length;
        lines.push('export const anyCompReg={');
        lines.push('    comps:[');

        let index=0;

        const keys=Object.keys(this.outputs);
        keys.sort(sortStringsCallback);

        for(const e of keys){

            const output=this.outputs[e];
            if(!output){
                continue;
            }

            for(const comp of output.comps){
                // lines.splice(index+insertOffset,0,`import ${comp.isDefaultExport?`Comp${index}`:`{ ${comp.name} as Comp${index} }`} from '${comp.path.replace(/\.\w+$/,'')}';`);
                // lines.push(`        ${JSON.stringify(comp).replace(`"${compBodyPlaceholder}"`,`(props:any)=><Comp${index} {...props}/>`)},`)

                lines.splice(index+insertOffset,0,`const Comp${index}=lazy(()=>import('${comp.path.replace(/\.\w+$/,'')}').then(c=>({default:c.${comp.isDefaultExport?'default':comp.name} as any})));`);
                lines.push(`        ${JSON.stringify(comp).replace(`"${compBodyPlaceholder}"`,`(props:Record<string,any>,placeholder:any=<h1>Loading ${comp.name}</h1>)=><Suspense fallback={placeholder}><Comp${index} {...props}/></Suspense>`)},`)
                index++;
            }

        }

        lines.push('    ]');
        lines.push('}');


        return lines;
    }
}

const getPropType=(node:TypeNode|null|undefined,types:AcTypeDef[],unique:boolean)=>{
    let type:AcType|undefined=undefined;
    let subTypes:AcTypeDef[]|undefined=undefined;
    switch(node?.kind){

        case SyntaxKind.StringKeyword:
            type='string';
            break;

        case SyntaxKind.NumberKeyword:
            type='number';
            break;

        case SyntaxKind.BigIntKeyword:
            type='bigint';
            break;

        case SyntaxKind.BooleanKeyword:
            type='boolean';
            break;

        case SyntaxKind.SymbolKeyword:
            type='symbol';
            break;

        case SyntaxKind.UndefinedKeyword:
            type='undefined';
            break;

        case SyntaxKind.MethodDeclaration:
        case SyntaxKind.MethodSignature:
        case SyntaxKind.FunctionKeyword:
        case SyntaxKind.FunctionType:
        case SyntaxKind.FunctionExpression:
        case SyntaxKind.FunctionDeclaration:{
            type='function';
            const params=(node as any as FunctionLikeDeclaration)?.parameters;
            if(params){
                subTypes=[];
                for(const t of params){
                    getPropType(t.type,subTypes,false);
                }
            }
            break;
        }

        default:
            type='object';
            break;
    }

    if(type && (!unique || !types.some(t=>t.type===type))){
        types.push({
            type,
            subTypes,
        });
    }
}

interface AcOutput
{
    id:number;
    path:string;
    comps:AcComp[];
    dispose:()=>void;
}
