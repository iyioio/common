import { ProtoContext, protoMarkdownParseNodes } from "@iyio/protogen";

export const markdownParser=async ({
    sources,
    log,
    nodes
}:ProtoContext)=>{

    const supported=sources.filter(s=>s.ext==='md' ||s.contentType==='text/markdown');

    log(`${supported.length} supported source(s)`);


    for(const source of supported){

        log(`parse - ${source.input}`);

        const mNodes=protoMarkdownParseNodes(source.content,{applyInheritance:true}).rootNodes;

        log(`${mNodes.length} node(s) parsed`);

        for(const node of mNodes){
            nodes.push(node);
        }
    }
}
