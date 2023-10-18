import { AcComp, AcProp, AcType, AcTypeDef } from '@iyio/any-comp';
import { DisposeContainer, delayAsync, sortStringsCallback, strFirstToUpper } from '@iyio/common';
import { triggerNodeBreakpoint } from '@iyio/node-common';
import { access, mkdir, readFile, readdir, stat, watch, writeFile } from 'fs/promises';
import { basename, join } from 'path';
import { FunctionLikeDeclaration, Identifier, InterfaceDeclaration, JSDoc, JSDocComment, Node, NodeArray, PropertySignature, ScriptKind, ScriptTarget, SyntaxKind, TypeNode, TypeReferenceNode, createSourceFile, isFunctionDeclaration, isIdentifier, isIntersectionTypeNode, isNumericLiteral, isObjectBindingPattern, isStringLiteralLike, isTypeReferenceNode, isUnionTypeNode } from 'typescript';

const compBodyPlaceholder='______COMP_BODY________';

export interface AnyCompWatcherOptions
{
    watchDirs:string[];
    ignore?:(string|RegExp)[];
    match?:(string|RegExp)[];
    log?:(...args:any)=>void;
    outDir:string;
    disableLazyLoading?:boolean;
    debug?:boolean|string;
    breakOnDebug?:boolean;
}

export class AnyCompWatcher
{

    private readonly watchDirs:string[];

    private readonly ignore:(string|RegExp)[];

    private readonly match:(string|RegExp)[];

    private readonly log?:(...args:any)=>void;

    private readonly outDir:string;

    private readonly disableLazyLoading:boolean;

    public debug:boolean|string;

    public breakOnDebug:boolean;

    public constructor({
        watchDirs,
        ignore=['node_modules',/^\..*/],
        match=[/\.(tsx)$/i],
        log,
        outDir,
        disableLazyLoading=false,
        debug=false,
        breakOnDebug=false,
    }:AnyCompWatcherOptions)
    {

        if(!outDir.trim()){
            throw new Error('outDir required');
        }

        this.debug=debug;
        this.breakOnDebug=breakOnDebug;
        this.watchDirs=watchDirs;
        this.ignore=ignore.map(i=>(typeof i === 'string')?i.toLowerCase():i);
        this.match=match.map(i=>(typeof i === 'string')?i.toLowerCase():i);
        this.disableLazyLoading=disableLazyLoading;
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
        const watcher=watch(dir,{signal:ac.signal,recursive:true});
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
            true,
            kind
        );


        for(const fn of sourceFile.statements){
            if(isFunctionDeclaration(fn)){
                const name=fn.name?.escapedText;
                const debugComp=this.debug===true || this.debug===name;

                const tags=getJDocTags(fn);

                if( !name ||
                    name.startsWith('use') ||
                    !fn.modifiers?.some(m=>m.kind===SyntaxKind.ExportKeyword) ||
                    (fn.parameters.length!==0 && fn.parameters.length!==1) ||
                    strToBool(tags['acIgnore'])
                ){
                    continue;
                }

                const param=fn.parameters[0];
                const propTypeNode=getTypeReference(param?.type)
                const propType=(propTypeNode?.typeName as Identifier)?.escapedText;
                const props:AcProp[]=[];

                if(fn.parameters.length===1 &&  param?.type && propType){

                    const propDefaults:Record<string,{
                        value:any;
                        text:string;
                    }>={}

                    const dName=fn.parameters[0]?.name;
                    if(dName && isObjectBindingPattern(dName)){
                        for(const e of dName.elements){
                            const name=e.name;
                            if(!e.initializer || !isIdentifier(name)){
                                continue;
                            }

                            propDefaults[name.escapedText as string]={
                                text:e.initializer.getText(),
                                value:nodeToPrimitiveValue(e.initializer)
                            }
                        }
                    }

                    const propInterface=sourceFile.statements.find(s=>
                        s.kind===SyntaxKind.InterfaceDeclaration &&
                        (s as InterfaceDeclaration)?.name?.escapedText===propType
                    ) as InterfaceDeclaration|undefined;

                    if(!propInterface){
                        continue;
                    }


                    for(const _prop of propInterface.members){

                        const prop=_prop as PropertySignature;
                        const propName=(prop.name as Identifier)?.escapedText;
                        const propTags=getJDocTags(prop);

                        if(!propName || strToBool(propTags['acIgnore'])){
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
                            comment:getFullComment(prop),
                            defaultValue:propDefaults[propName]?.value,
                            defaultValueText:propDefaults[propName]?.text,
                            tags:propTags,
                            bind:propTags['acBind']
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
                }

                const onChangeProp=props.find(p=>p.name==='onChange' && p.defaultType.type==='function');
                const valueProp=props.find(p=>p.name==='value' && p.defaultType.type!=='function');
                if(onChangeProp && valueProp && !onChangeProp.bind){
                    onChangeProp.bind='value';
                }

                for(const prop of props){

                    if(prop.defaultType.type==='function'){
                        continue;
                    }

                    const changeName=`on${strFirstToUpper(prop.name)}Change`;
                    const changeProp=props.find(p=>p.name===changeName && p.defaultType.type==='function');
                    if(changeProp && !changeProp.bind){
                        changeProp.bind=prop.name;
                    }

                }

                const comp:AcComp={
                    id:`${path}::${name}`,
                    name,
                    path,
                    propType:propType??'undefined',
                    props,
                    comp:compBodyPlaceholder,
                    isDefaultExport:fn.modifiers.some(m=>m.kind===SyntaxKind.DefaultKeyword),
                    comment:getFullComment(fn),
                    tags
                }

                this.log?.(`<${comp.name}/>`);

                if(debugComp){
                    console.info(`<${comp.name}/>`,comp);
                    if(this.breakOnDebug){
                        triggerNodeBreakpoint();
                    }
                }

                output.comps.push(comp)

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

        lines.push('/* This file was generated by @iyio/any-comp-cli */');
        lines.push('/* eslint-disable @nrwl/nx/enforce-module-boundaries */');
        if(!this.disableLazyLoading){
            lines.push('import { Suspense, lazy } from "react";');
        }
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
                if(this.disableLazyLoading){
                    lines.splice(index+insertOffset,0,`import ${comp.isDefaultExport?`Comp${index}`:`{ ${comp.name} as Comp${index} }`} from '${comp.path.replace(/\.\w+$/,'')}';`);
                    lines.push(`        ${JSON.stringify(comp).replace(`"${compBodyPlaceholder}"`,`(props:any)=><Comp${index} {...props}/>`)},`)
                }else{
                    lines.splice(index+insertOffset,0,`const Comp${index}=lazy(()=>import('${comp.path.replace(/\.\w+$/,'')}').then(c=>({default:c.${comp.isDefaultExport?'default':comp.name} as any})));`);
                    lines.push(`        ${JSON.stringify(comp).replace(`"${compBodyPlaceholder}"`,`(props:Record<string,any>,placeholder:any=<h1>Loading ${comp.name}</h1>)=><Suspense fallback={placeholder}><Comp${index} {...props}/></Suspense>`)},`)
                }
                index++;
            }

        }

        lines.push('    ]');
        lines.push('}');


        return lines;
    }
}

const getPropType=(node:TypeNode|null|undefined,types:AcTypeDef[],unique:boolean)=>{
    let subTypes:AcTypeDef[]|undefined=undefined;
    const type:AcType=node?.kind?syntaxKindToAcType(node?.kind):'undefined';
    if(type==='function'){
        const params=(node as any as FunctionLikeDeclaration)?.parameters;
        if(params){
            subTypes=[];
            for(const t of params){
                getPropType(t.type,subTypes,false);
            }
        }
    }

    if(type && (!unique || !types.some(t=>t.type===type))){
        types.push({
            type,
            subTypes,
        });
    }
}

const syntaxKindToAcType=(kind:SyntaxKind):AcType=>{
    switch(kind){

        case SyntaxKind.StringKeyword:
            return 'string';

        case SyntaxKind.NumberKeyword:
            return 'number';

        case SyntaxKind.BigIntKeyword:
            return 'bigint';

        case SyntaxKind.BooleanKeyword:
            return 'boolean';

        case SyntaxKind.SymbolKeyword:
            return 'symbol';

        case SyntaxKind.UndefinedKeyword:
            return 'undefined';

        case SyntaxKind.MethodDeclaration:
        case SyntaxKind.MethodSignature:
        case SyntaxKind.FunctionKeyword:
        case SyntaxKind.FunctionType:
        case SyntaxKind.FunctionExpression:
        case SyntaxKind.FunctionDeclaration:
            return 'function';

        default:
            return 'object';
    }
}

interface AcOutput
{
    id:number;
    path:string;
    comps:AcComp[];
    dispose:()=>void;
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

const getJDocTags=(node:Node|null|undefined,namesToLower=false):Record<string,string>=>{
    if(!node){
        return {}
    }
    const docs=getJDocs(node);
    const out:Record<string,string>={};

    for(const d of docs){
        const tags=d.tags;
        if(!tags){
            continue;
        }

        for(const t of tags){
            const name=t.tagName.escapedText as string
            out[namesToLower?name.toLowerCase():name]=getComments(t.comment)?.join('\n')??''
        }
    }

    return out;
}

const strToBool=(value:string|undefined|null):boolean=>{
    value=value?.trim();
    if(value===''){
        return true;
    }
    if(!value){
        return false;
    }
    return Boolean(value)===true;
}

const nodeToPrimitiveValue=(node:Node|null|undefined)=>{
    if(!node){
        return undefined;
    }
    if(isStringLiteralLike(node)){
        return node.text;
    }else if(isNumericLiteral(node)){
        return Number(node.text);
    }else if(node.kind===SyntaxKind.FalseKeyword){
        return false;
    }else if(node.kind===SyntaxKind.TrueKeyword){
        return true;
    }else if(node.kind===SyntaxKind.NullKeyword){
        return null;
    }else{
        return undefined;
    }
}

const getTypeReference=(node:Node|null|undefined,maxDepth=100):TypeReferenceNode|undefined=>{
    if(maxDepth<1 || !node){
        return undefined;
    }
    if(isTypeReferenceNode(node)){
        return node;
    }

    if(isIntersectionTypeNode(node)){
        for(const t of node.types){
            return getTypeReference(t,maxDepth-1);
        }
    }

    if(isUnionTypeNode(node)){
        for(const t of node.types){
            return getTypeReference(t,maxDepth-1);
        }
    }

    return undefined;
}
