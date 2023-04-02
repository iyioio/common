import { CsvRow, parseCsvRows } from "@iyio/common";
import { parseNodeLine, ProtoContext, ProtoNode } from "@iyio/protogen";

const nameKey='Name';
const shapeKey='Shape Library';
const textKey='Text Area 1';
const entityShape='Entity Relationship';
const typeKey='Text Area 1';
const propPrefix='Text Area ';

export const lucidCsvParser=async ({
    sources,
    log,
    nodes
}:ProtoContext)=>{


    for(const source of sources){

        if(source.ext!=='csv' && source.contentType!=='text/css'){
            continue;
        }

        const csv=parseCsvRows(source.content);

        log(`lucidCsvParser parse source - ${source.input}`);

        for(const row of csv){

            if(row[shapeKey]!==entityShape){
                continue;
            }

            const typeLine=row[typeKey];
            if(!typeLine || typeLine.startsWith('#')){
                continue;
            }
            const typeNode=parseNodeLine(typeLine,0,false,n=>getTaggedExtensions(n,csv))[0];
            nodes.push(typeNode);
            log('typeNode',typeNode);
            if(!typeNode.children){
                typeNode.children={};
            }

            addDetachedComments(typeNode.name,null,null,typeNode,csv);


            for(const e in row){
                if(!e.startsWith(propPrefix) || e===typeKey){
                    continue;
                }
                const propLine=row[e];
                if(!propLine || propLine.startsWith('#')){
                    continue;
                }
                for(const propNode of parseNodeLine(row[e],1,true,n=>getTaggedExtensions(typeNode.name+'.'+n,csv))){

                    const textAreaIndex=/\d+/.exec(e);
                    if(!textAreaIndex){
                        throw new Error('Unable to determine text area index');
                    }

                    addDetachedComments(typeNode.name+'.'+propNode.name,Number(textAreaIndex[0]),row,propNode,csv);
                    log('propNode',propNode);
                    typeNode.children[propNode.name]=propNode;
                }
            }


        }

    }
}

const addDetachedComments=(name:string,index:number|null,row:CsvRow|null,node:ProtoNode,csv:CsvRow[]):boolean=>{

    let added=false;

    const taggedComments=getTaggedComments(name,csv);
    if(taggedComments?.length){
        node.comment=(node.comment?node.comment+'\n\n':'')+taggedComments;
        added=true;
    }

    if(index!==null && row!==null){
        const prev=row[propPrefix+(index-1)];
        if(prev[0]==='#' && prev[1]!=='#'){
            node.comment=(node.comment?node.comment+'\n\n':'')+prev.substring(1).trim();
            added=true;
        }
    }

    return added;
}

const getTaggedComments=(name:string,csv:CsvRow[]):string|null=>{

    name=name.replace(/\?/g,'');

    const tagged:string[]=[];

    const atName='@'+name;

    const atReg=new RegExp('@'+name.split('.').join('\\.')+'(\\W|$)')

    for(const row of csv){

        if(row[nameKey]!=='Text' || row[shapeKey]!=='Standard'){
            continue;
        }

        if(row[textKey].includes(atName) && atReg.test(row[textKey])){
            tagged.push(row[textKey].split(atName).join(name));
        }
    }

    return tagged.length?tagged.join('\n'):null;

}

const getTaggedExtensions=(name:string,csv:CsvRow[]):string|null=>{

    name=name.replace(/\?/g,'');

    const tagged:string[]=[];

    const atName='@'+name+':';

    for(const row of csv){

        if(row[nameKey]!=='Text' || row[shapeKey]!=='Standard'){
            continue;
        }

        if(row[textKey].startsWith(atName)){
            const value=row[textKey].substring(atName.length).split('\n').join(' ');
            //console.log('extend',{name,value,atName,row:row[textKey]})
            if(!/\s/.test(value[0])){
                continue;
            }
            tagged.push(value.trim());
        }
    }

    return tagged.length?tagged.join('\n'):null;

}
