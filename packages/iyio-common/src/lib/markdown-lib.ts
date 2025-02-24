import { escapeHtml } from "./html";
import { MarkdownLine, MarkdownNode, MarkdownOutputFormat, MarkdownOutputOptions } from "./markdown-types";

export const markdownLinesToString=(format:MarkdownOutputFormat|MarkdownOutputOptions,lines:MarkdownLine[]):string=>{
    const out:string[]=[];
    for(let i=0;i<lines.length;i++){
        const line=lines[i];
        if(!line){continue}
        markdownLineToStringBuffer(format,line,true,out);
    }
    return out.join('');
}
export const markdownLineToString=(format:MarkdownOutputFormat|MarkdownOutputOptions,line:MarkdownLine):string=>{
    const out:string[]=[];
    markdownLineToStringBuffer(format,line,false,out);
    return out.join('');
}
export const markdownLineToStringBuffer=(
    optionsOrFormat:MarkdownOutputFormat|MarkdownOutputOptions,
    line:MarkdownLine,
    includeNewline:boolean,
    out:string[]
):void=>{

    let format:MarkdownOutputFormat;
    let options:MarkdownOutputOptions;
    if(typeof optionsOrFormat==='string'){
        format=optionsOrFormat;
        options={format};
    }else{
        options=optionsOrFormat;
        format=options.format;
    }

    const isMd=format==='markdown';
    const isHtml=format==='html';
    const isPlain=format==='plain'

    let close:string[]|undefined;

    if(line.tags && isMd){
        for(let i=0;i<line.tags.length;i++){
            const tag=line.tags[i];
            if(!tag){continue}
            if(tag.value){
                out.push(`@${tag.name} ${tag.value}\n`);
            }else{
                out.push(`@${tag.name}\n`);
            }
        }
    }

    if( (line.type==='p' || line.type==='code-block') &&
        isHtml &&
        (options.singleLine?(options.getLineHtmlAtts?true:false):true)
    ){
        out.push(`<p${recordToAtts(
            null,
            options.getLineHtmlAtts?.(line,'p'))
        }>`);
        if(!close){
            close=[];
        }
        close.push('</p>');
    }

    if(line.blockQuoteLevel){
        if(isMd){
            out.push('>'.repeat(line.blockQuoteLevel)+' ');
        }
    }

    if(line.indent){
        if(isMd || isPlain){
            out.push(' '.repeat(line.indent));
        }
    }

    if(line.listOrder!==undefined){
        if(isMd || isPlain){
            out.push(`${line.listOrder}. `)
        }
    }

    if(line.ulType){
        if(isMd || isPlain){
            out.push(`${line.ulType}  `)
        }
    }

    if(isHtml && (line.ulType || line.listOrder!==undefined)){
        out.push(`<li${recordToAtts(
            null,
            options.getLineHtmlAtts?.(line,line.ulType?'ulType':'listOrder'))
        }>`);
        if(!close){
            close=[];
        }
        close.push('</li>');
    }

    if(line.headerLevel){
        if(isMd){
            out.push('#'.repeat(line.headerLevel)+' ');
        }else if(isHtml){
            const level=Math.max(1,Math.min(6,Math.round(line.headerLevel)));
            out.push(`<h${level}${recordToAtts(
                null,
                options.getLineHtmlAtts?.(line,'headerLevel'))
        }>`);
            if(!close){
                close=[];
            }
            close.push(`</h${level}>`);
        }
    }

    if(line.type==='hr'){
        if(isMd){
            out.push(line.text??'------')
        }else if(isHtml){
            out.push(`<hr${recordToAtts(
                null,
                options.getLineHtmlAtts?.(line,'hr'))
            }/>`)
        }else if(line.text){
            out.push(line.text);
        }
    }else if(line.type==='code-block'){
        if(isMd || isPlain){
            out.push('```'+(line.codeLanguage?` ${line.codeLanguage}}`:'')+'\n');
            out.push(line.text??'');
            out.push('\n```')
        }else if(isHtml){
            out.push(`<code${recordToAtts(
                null,
                options.getLineHtmlAtts?.(line,'code'))
            }>`);
            out.push(escapeHtml(line.text??''));
            if(!close){
                close=[];
            }
            close.push('</code>');
        }
    }else{

        if(line.nodes){
            for(let i=0;i<line.nodes.length;i++){
                const node=line.nodes[i];
                if(node){
                    out.push(markdownNodeToString(line,node,format,options));
                }

            }
        }else{
            let body=line.text??'';
            if(isHtml){
                body=escapeHtml(body);
            }
            out.push(body);
        }
    }


    if(close){
        for(let i=close.length-1;i>=0;i--){
            out.push(close[i] as string);
        }
    }

    if(includeNewline){
        out.push('\n\n');
    }
}

export const markdownNodeToString=(line:MarkdownLine,node:MarkdownNode,format:MarkdownOutputFormat,options:MarkdownOutputOptions):string=>{
    let content=node.text??'';

    switch(format){

        case 'markdown':
            if(node.imageUrl){
                content=`![${content}](${node.imageUrl})`;
            }

            if(node.code){
                content=`\`${content}\``;
            }

            if(node.link){
                content=`[${content}](${node.url??'#'})`;
            }else if(node.url || node.email){
                content=`<${content}>`;
            }

            if(node.bold && node.italic){
                content=`**_${content}_**`;
            }else if(node.bold){
                content=`**${content}**`;
            }else if(node.italic){
                content=`*${content}*`;
            }
            break;

        case 'html':
            content=escapeHtml(content);

            if(node.imageUrl){
                content=`<img${recordToAtts(
                    {
                        alt:content,
                        src:node.imageUrl,
                        title:node.imageTitle
                    },
                    options.getNodeHtmlAtts?.(line,node,'imageUrl'))
                }/>`
            }

            if(node.code){
                content=`<code${recordToAtts(
                    null,
                    options.getNodeHtmlAtts?.(line,node,'code'))
                }>${content}</code>`;
            }

            if(node.link || node.url || node.email){
                content=`<a${recordToAtts(
                    {
                        href:`${node.email?'mailto:':''}${node.url?node.url:'#'}`,
                        title:node.title,
                    },
                    options.getNodeHtmlAtts?.(line,node,'link'))
                }>${content}</a>`;
            }

            if(node.italic){
                content=`<i${recordToAtts(
                    null,
                    options.getNodeHtmlAtts?.(line,node,'italic'))
                }>${content}</i>`;
            }

            if(node.bold){
                content=`<strong${recordToAtts(
                    null,
                    options.getNodeHtmlAtts?.(line,node,'bold'))
                }>${content}</strong>`;
            }
            if(node.markup){
                const markup=node.markup;
                if(markup.open){
                    content=`<${markup.tag}`;
                    if(markup.attributes){
                        for(const e in markup.attributes){
                            const v=markup.attributes[e];
                            if(v){
                                content+=` ${e}="${escapeHtml(v)}"`
                            }else{
                                content+=` ${e}`;
                            }
                        }
                    }
                    if(markup.close){
                        content+='/>'
                    }else{
                        content+='>';
                    }
                }else if(markup.close){
                    content=`</${markup.tag}>`;
                }
            }
            break;

        case 'plain':
            if(node.imageUrl){
                content=`${content} - ${node.imageUrl}`;
            }

            if(node.link){
                content=`${content} - ${node.url??'#'}`;
            }

            break;
    }

    return content;
}

const recordToAtts=(defaults:Record<string,string|null|undefined>|null|undefined,record:Record<string,string|null|undefined>|null|undefined):string=>{
    const out:string[]=[];

    if(record){
        for(const e in record){
            const v=record[e];
            if(v===undefined || v===null){
                continue;
            }
            out.push(` ${escapeHtml(e)}="${escapeHtml(v)}"`);
        }
    }


    if(defaults){
        for(const e in defaults){
            const v=defaults[e];
            if(v===null || v===undefined){
                continue;
            }
            const rv=record?.[e]
            if(v===undefined || v===null || (rv!==null && rv!==undefined)){
                continue;
            }
            out.push(` ${escapeHtml(e)}="${escapeHtml(v)}"`);
        }
    }

    return out.join('');
}

