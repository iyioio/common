import { convoBodyFnName, convoCallFunctionModifier, convoJsonArrayFnName, convoJsonMapFnName, convoLocalFunctionModifier } from "./convo-lib";
import { ConvoFunction, ConvoMessage, ConvoNonFuncKeyword, ConvoParsingError, ConvoParsingResult, ConvoStatement, ConvoTag, ConvoValueConstant, convoNonFuncKeywords, convoValueConstants } from "./convo-types";

type StringType='"'|"'"|'>';

const fnMessageReg=/(>)\s*(\w+)?\s+(\w+)\s*([*?!]*)\s*(\()/gs;
const topLevelMessageReg=/(>)\s*(do|no\s+result|result)/gs;
const roleReg=/(>)\s*(\w+)\s*([*?!]*)/gs;

const statementReg=/([\s\n\r]*[,;]*[\s\n\r]*)((#|@|\)|\}\}|\}|\]|>|$)|((\w+|"[^"]*"|'[^']*')(\??):)?\s*(([\w.]+)\s*=)?\s*('|"|[\w.]+\s*(\()|[\w.]+|-?[\d.]+|\{|\[))/gs;
const spaceIndex=1;
const ccIndex=3;
const labelIndex=5;
const optIndex=6;
const setIndex=8;
const valueIndex=9;
const fnOpenIndex=10;

const returnTypeReg=/\s*->\s*(\w+)?\s*(\(?)/gs;

const numberReg=/^-?[.\d]/;

const singleStringReg=/(\{\{|')/gs;
const doubleStringReg=/(\{\{|")/gs;
const msgStringReg=/(\{\{|[\n\r]\s*>|$)/gs;

const tagReg=/(\w+)\s*=?(.*)/

const space=/\s/;

const paramTrimPlaceHolder='{{**PLACE_HOLDER**}}';


const trimLeft=(value:string,count:number):string=>{
    const lines=value.split('\n');
    console.log('hio 👋 👋 👋 LINES',value,lines);
    for(let l=0;l<lines.length;l++){
        const line=lines[l];
        if(!line){
            continue;
        }
        let i=0;
        while(i<count && i<line.length && (line[i]===' ' || line[i]==='\t')){
            i++;
        }
        if(i){
            lines[l]=line.substring(i);
        }
    }
    return lines.join(value.includes('\r')?'\r\n':'\n');

}

export const parseConvoCode=(code:string):ConvoParsingResult=>{

    code=code+'\n';

    const messages:ConvoMessage[]=[];

    let inMsg=false;
    let inFnMsg=false;
    let inFnBody=false;
    let msgName:string|null=null;
    let whiteSpaceOffset=0;
    let stringEndReg=singleStringReg;
    const stringStack:StringType[]=[];
    const stringStatementStack:ConvoStatement[]=[];
    let inString:StringType|null=null;
    let lastComment='';
    let tags:ConvoTag[]=[];
    let index=0;
    let currentMessage:ConvoMessage|null=null;
    let currentFn:ConvoFunction|null=null;
    let error:string|undefined=undefined;
    const stack:ConvoStatement[]=[];
    const len=code.length;

    const setStringEndReg=(type:StringType)=>{
        switch(type){

            case '\'':
                stringEndReg=singleStringReg;
                break;

            case '"':
                stringEndReg=doubleStringReg;
                break;

            case '>':
                stringEndReg=msgStringReg;
                break;
        }
    }

    const openString=(type:StringType,s?:ConvoStatement):ConvoStatement=>{
        console.log('hio 👋 👋 👋 OPEN STRING """"""""" ',type,`|${code.substring(index,index+20)}|`);
        inString=type;
        stringStack.push(type);
        if(!s){
            s=addStatement({s:index,e:index+type.length});
        }
        stringStatementStack.push(s);
        setStringEndReg(type);
        return s;
    }

    const closeString=()=>{
        const last=stringStatementStack[stringStatementStack.length-1];
        if(!last){
            error='No string on string stack';
            return false;
        }
        last.c=index;
        console.log('hio 👋 👋 👋 Close STRING """"""""" ',last?.fn?JSON.stringify(last,null,4):last?.value);
        if(stack.includes(last)){
            if(stack[stack.length-1]!==last){
                error='String not on top of stack';
                return false;
            }
            stack.pop();
        }
        stringStack.pop();
        stringStatementStack.pop();
        inString=null;
        const lastType=stringStack[stringStack.length-1];
        if(lastType){
            setStringEndReg(lastType);
        }
        return true;
    }

    const takeComment=()=>{
        index++;
        const newline=code.indexOf('\n',index);
        const comment=code.substring(index,newline).trim();
        console.log('hio 👋 👋 👋 comment',comment);
        if(lastComment.trim()){
            lastComment+='\n'+comment;
        }else{
            lastComment=comment
        }
        index=newline;
    }

    const takeTag=()=>{
        index++;
        const newline=code.indexOf('\n',index);
        console.log('hio 👋 👋 👋 TAG LINE',code.substring(index,newline));
        const tag=tagReg.exec(code.substring(index,newline).trim());
        if(tag){
            console.log('hio 👋 👋 👋 tag',tag);
            tags.push({name:tag[1]??'',value:tag[2]?.trim()});
        }
        index=newline;
    }

    const addStatement=(s:ConvoStatement)=>{
        const last=stack[stack.length-1];
        if(!last){
            return s;
        }
        if(!last.params){
            last.params=[];
        }
        last.params.push(s);
        return s;
    }

    const endMsg=()=>{
        if( currentMessage?.statement &&
            !currentMessage.statement.fn &&
            (typeof currentMessage.statement.value === 'string')
        ){
            currentMessage.content=currentMessage.statement.value.trim();
            delete currentMessage.statement;
        }
        if(whiteSpaceOffset){
            if(typeof currentMessage?.content === 'string'){
                currentMessage.content=trimLeft(currentMessage.content,whiteSpaceOffset);
            }
            if(currentMessage?.statement?.params){
                const lines=trimLeft(
                    currentMessage?.statement?.params
                        .map(p=>(typeof p.value==='string')?p.value:paramTrimPlaceHolder).join(''),
                    whiteSpaceOffset
                ).split(paramTrimPlaceHolder);

                for(let i=0;i<lines.length;i++){
                    const v=lines[i];
                    const param=currentMessage.statement.params[i===0?0:i*2];
                    if(param){
                        param.value=v;
                    }
                }
            }
            console.log('hio 👋 👋 👋 TRIM',currentMessage);
        }
        msgName=null;
        currentMessage=null;
        inMsg=false;
        stack.pop();
    }

    parsingLoop: while(index<len){



        if(inString){
            const strStatement=stringStatementStack[stringStatementStack.length-1];
            if(!strStatement){
                error='No string statement found';
                break parsingLoop;
            }
            let escaped:boolean;
            let embedFound:boolean;
            let endStringIndex:number;
            let nextIndex:number=index;
            const isMsgString=inString==='>';
            do{
                stringEndReg.lastIndex=nextIndex;
                const e=stringEndReg.exec(code)

                if(!e){
                    console.log('hio 👋 👋 👋 exit bad string',{inString,stringEndReg,index,nextIndex},code.substring(nextIndex));
                    error='End of string not found';
                    break parsingLoop;
                }


                embedFound=e[0]==='{{';
                endStringIndex=e.index;
                nextIndex=(isMsgString && !embedFound)?e.index+e[0].length-1:e.index+e[0].length;
                console.log('hio 👋 👋 👋 string next index content |||||',code.substring(nextIndex,nextIndex+10),e);

                if(embedFound || isMsgString){
                    escaped=false;
                }else{
                    let backslashCount=0;
                    for(let bi=endStringIndex-1;bi>=0;bi--){
                        console.log('hio 👋 👋 👋 escape char',code[bi]);
                        if(code[bi]!=='\\'){
                            break;
                        }
                        backslashCount++;
                    }
                    console.log('hio 👋 👋 👋 backslash count',backslashCount);
                    escaped=backslashCount%2===1;
                }
            }while(escaped)

            let content=code.substring(index,endStringIndex);
            if(inFnMsg){
                content=unescapeStr(content);
            }

            if(embedFound){
                if(!strStatement.params){
                    strStatement.params=[];
                }
                if(!strStatement.fn){
                    strStatement.fn='add';
                    stack.push(strStatement);
                }
                strStatement.params.push({value:content,s:index,e:nextIndex});
                inString=null;
                index=nextIndex;
            }else{

                if(strStatement.params){// has embeds
                    if(content){
                        strStatement.params.push({value:content,s:index,e:nextIndex});
                    }
                }else{
                    strStatement.value=content;
                }
                index=nextIndex;
                if(!closeString()){
                    break parsingLoop;
                }
                if(isMsgString){
                    endMsg();
                }
                console.log('hio 👋 👋 👋 after string >>>>',code.substring(index,index+10));
            }
        }else if(inMsg || inFnMsg){

            statementReg.lastIndex=index;
            let match=statementReg.exec(code);
            if(!match){
                error=inFnMsg?'Unexpected end of function':'Unexpected end of message';
                break parsingLoop;
            }

            const cc=match.length===2?match[1]:match[ccIndex];
            const indexOffset=match[0].length;
            const spaceLength=(match[spaceIndex]?.length??0);

            console.log('hio 👋 👋 👋 statement match',index,`||${cc}||`,`<<||${code.substring(index+spaceLength,index+indexOffset)}||>>`,match)//
            console.log(code.substring(index,index+match[0].length));

            if(match.index!==index){
                error='Token index match out of sync';
                break parsingLoop;
            }


            if(cc==='#'){
                index+=spaceLength;
                takeComment();
                continue;
            }else if(cc==='@'){
                console.log('hio 👋 👋 👋 FOUND TAG',cc);
                index+=spaceLength;
                takeTag();
                continue;
            }else if(cc===')' || cc==='}}' || cc==='}' || cc===']' || cc==='>' || cc===''){// close function
                if(cc==='}' && stack[stack.length-1]?.fn!==convoJsonMapFnName){
                    error="Unexpected closing of JSON object";
                    break parsingLoop;
                }
                if(cc===']' && stack[stack.length-1]?.fn!==convoJsonArrayFnName){
                    error="Unexpected closing of JSON array";
                    break parsingLoop;
                }
                if(cc==='>' && !currentFn?.topLevel){
                    error='Unexpected end of function using (>) character';
                    break parsingLoop;
                }
                lastComment='';
                if(tags.length){
                    tags=[];
                }
                const lastStackItem=stack[stack.length-1];
                if(!stack.length || !lastStackItem){
                    error='Unexpected end of function call';
                    break parsingLoop;
                }
                const endEmbed=cc==='}}';
                const startIndex=index;
                if(cc==='>'){
                    index+=(match[spaceIndex]?.length??0);
                }else{
                    index+=match[0].length;
                }
                if(!endEmbed){
                    lastStackItem.c=index;
                    stack.pop();
                }
                console.log('hio 👋 👋 👋 POP STACK',stack.map(s=>s.fn));
                if(endEmbed){
                    console.log('hio 👋 👋 👋 closing embed',code.substring(index,index+10));
                    const prevInStr=stringStack[stringStack.length-1];
                    if(!prevInStr){
                        error='Unexpected string embed closing found';
                        break parsingLoop;
                    }
                    inString=prevInStr;
                }else if(stack.length===0){

                    if(stringStack.length){
                        error='End of call stack reached within a string';
                        break parsingLoop;
                    }

                    if(!currentFn){
                        error='End of call stack reached without being in function';
                        break parsingLoop;
                    }

                    if(!inFnBody){
                        returnTypeReg.lastIndex=index;
                        const rMatch=returnTypeReg.exec(code);
                        console.log('hio 👋 👋 👋 BODY MATCH------',rMatch);
                        if(rMatch && rMatch.index===index){
                            console.log('hio 👋 👋 👋 ENTER BODY',);
                            index+=rMatch[0].length;

                            if(rMatch[1]){
                                currentFn.paramsName=rMatch[1];
                            }

                            if(rMatch[2]){
                                inFnBody=true;
                                currentFn.body=[];
                                const body:ConvoStatement={fn:convoBodyFnName,params:currentFn.body,s:startIndex,e:index}
                                stack.push(body);
                                continue;
                            }
                        }
                    }

                    inFnMsg=false;
                    inFnBody=false;
                    currentFn=null;
                    msgName=null;

                }
                continue;
            }

            let val=match[valueIndex]||undefined;
            const label=match[labelIndex]?.replace(/["']/g,'')||undefined;
            const opt=match[optIndex]?true:undefined;
            const set=match[setIndex]||undefined;
            if(val==='{'){
                console.log('hio 👋 👋 👋 jsonMap',);
                statementReg.lastIndex=0;
                match=statementReg.exec(`${convoJsonMapFnName}(`);
                if(!match){
                    error='JSON map open match expected';
                    break parsingLoop;
                }
                val=match[valueIndex]||undefined
            }else if(val==='['){
                console.log('hio 👋 👋 👋 jsonArray',);
                statementReg.lastIndex=0;
                match=statementReg.exec(`${convoJsonArrayFnName}(`);
                if(!match){
                    error='JSON map open match expected';
                    break parsingLoop;
                }
                val=match[valueIndex]||undefined
            }



            const statement:ConvoStatement={s:index+spaceLength,e:index+indexOffset}
            if(label){
                statement.label=label
            }
            if(opt){
                statement.opt=opt
            }
            if(set){
                if(set.includes('.')){
                    const path=set.split('.');
                    statement.set=path[0];
                    path.shift();
                    statement.setPath=path;
                }else{
                    statement.set=set;
                }
            }
            if(lastComment){
                statement.comment=lastComment;
                lastComment='';
            }
            if(tags.length){
                statement.tags=tags;
                if(tags.some(t=>t.name==='shared')){
                    statement.shared=true;
                }
                tags=[];
            }
            addStatement(statement);

            if(match[fnOpenIndex]){//push function on stack
                if(!val || val.length<2){
                    error='function call name expected';
                    break parsingLoop;
                }

                statement.fn=val.substring(0,val.length-1).trim()
                if(statement.fn.includes('.')){
                    const path=statement.fn.split('.');
                    statement.fn=path[path.length-1];
                    path.pop();
                    statement.fnPath=path;
                }

                stack.push(statement);
                console.log('hio 👋 👋 👋 PUSH STACK',stack.map(s=>s.fn));
            }else if(val==='"' || val==="'"){
                openString(val,statement);
                console.log('hio 👋 👋 👋',`|${code.substring(index+indexOffset,index+indexOffset+20)}|`);
            }else if(val && numberReg.test(val)){// number
                statement.value=Number(val);
            }else if(convoValueConstants.includes(val as ConvoValueConstant)){
                switch(val as ConvoValueConstant){

                    case 'true':
                        statement.value=true;
                        break;

                    case 'false':
                        statement.value=false;
                        break;

                    case 'null':
                        statement.value=null;
                        break;

                    case 'undefined':
                        statement.value=undefined;
                        break;

                    default:
                        error=`Unknown value constant - ${val}`;
                        break parsingLoop;
                }
            }else if(convoNonFuncKeywords.includes(val as ConvoNonFuncKeyword)){
                statement.keyword=val;
            }else if(val!==undefined){
                if(val.includes('.')){
                    const path=val.split('.');
                    statement.ref=path[0];
                    path.shift();
                    statement.refPath=path;
                }else{
                    statement.ref=val;
                }
            }else{
                error='value expected';
                break parsingLoop;
            }

            index+=indexOffset;
        }else{
            const char=code[index];
            if(!char){
                error='character expected'
                break parsingLoop;
            }

            if(char==='>'){

                whiteSpaceOffset=0;
                while(code[index-whiteSpaceOffset-1]===' ' || code[index-whiteSpaceOffset-1]==='\t'){
                    whiteSpaceOffset++;
                }

                console.log('hio 👋 👋 👋 WHITESPACEOFFSET',whiteSpaceOffset,code.substring(index,index+15));

                const startIndex=index;
                fnMessageReg.lastIndex=index;
                let match=fnMessageReg.exec(code);
                if(match && match.index==index){
                    msgName=match[3]??'';
                    if(!msgName){
                        error='function name expected';
                        break parsingLoop;
                    }
                    const modifiers=match[2]?[match[2]]:[];
                    currentFn={
                        name:msgName,
                        params:[],
                        description:lastComment||undefined,
                        modifiers,
                        local:modifiers.includes(convoLocalFunctionModifier),
                        call:modifiers.includes(convoCallFunctionModifier),
                        topLevel:false,
                    }
                    currentMessage={
                        role:currentFn.call?'function-call':'function',
                        fn:currentFn
                    }
                    messages.push(currentMessage);
                    lastComment='';
                    if(tags.length){
                        currentMessage.tags=tags;
                        tags=[];
                    }
                    index+=match[0].length;
                    stack.push({fn:'map',params:currentFn.params,s:startIndex,e:index});
                    inFnMsg=true;
                    inFnBody=false;
                    console.log('hio 👋 👋 👋 match function',msgName);
                    continue;
                }

                topLevelMessageReg.lastIndex=index;
                match=topLevelMessageReg.exec(code);
                if(match && match.index===index){
                    msgName=match[2]??'topLevelStatements';
                    currentFn={
                        name:msgName,
                        body:[],
                        params:[],
                        description:lastComment||undefined,
                        modifiers:[],
                        local:false,
                        call:false,
                        topLevel:true,
                    }
                    currentMessage={
                        role:'do',
                        fn:currentFn,
                    }
                    messages.push(currentMessage);
                    lastComment='';
                    if(tags.length){
                        currentMessage.tags=tags;
                        tags=[];
                    }
                    index+=match[0].length;
                    const body:ConvoStatement={fn:convoBodyFnName,params:currentFn.body,s:startIndex,e:index}
                    stack.push(body);
                    inFnMsg=true;
                    inFnBody=true;
                    console.log('hio 👋 👋 👋 match function',msgName);
                    continue;
                }

                roleReg.lastIndex=index;
                match=roleReg.exec(code);
                if(match && match.index==index){
                    msgName=match[2]??'';
                    if(!msgName){
                        error='message role expected';
                        break parsingLoop;
                    }
                    currentMessage={
                        role:msgName,
                    }
                    messages.push(currentMessage);
                    lastComment='';
                    if(tags.length){
                        currentMessage.tags=tags;
                        tags=[];
                    }
                    inMsg=true;
                    const body:ConvoStatement={fn:convoBodyFnName,s:index,e:index+match[0].length}
                    stack.push(body);
                    currentMessage.statement=openString('>');
                    index+=match[0].length;
                    console.log('hio 👋 👋 👋 match role',msgName);
                    continue;
                }

                error='Message or function expected';
                break parsingLoop;

            }else if(char==='#'){
                takeComment();
            }else if(char==='@'){
                takeTag();
            }else if(space.test(char) || char===';' || char===','){
                index++;
            }else{
                console.log('hio 👋 👋 👋 UN char',{inString});
                error=`Unexpected character ||${char}||`;
                break parsingLoop;
            }
        }
    }



    return {messages,endIndex:index,error:error?getConvoParsingError(code,index,error):undefined};

}

const getConvoParsingError=(code:string,index:number,message:string):ConvoParsingError=>{

    let lineNumber=1;
    for(let i=0;i<=index;i++){
        if(code[i]==='\n'){
            lineNumber++;
        }
    }

    const s=Math.max(0,code.lastIndexOf('\n',index));
    let e=code.indexOf('\n',index);
    if(e===-1){
        e=code.length;
    }

    const neg=Math.min(index,10);

    return {
        message,
        index,
        lineNumber,
        line:code.substring(s,e).trim(),
        near:(
            code
            .substring(e-10,e+20)
            .replace(/[\n]/g,'↩︎').replace(/[\s]/g,'•')
            +'\n'+' '.repeat(neg)+'^'
        ),
    }
}

const unescapeStr=(str:string):string=>str.replace(/\\(.)/g,(_,char)=>{

    switch(char){
        case 'n':
            return '\n';
        case 'r':
            return '\n';
        case 't':
            return '\t';
    }

    return char;
});
