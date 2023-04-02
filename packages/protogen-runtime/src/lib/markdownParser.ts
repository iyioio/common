import { ProtoContext, protoMarkdownParseNodes } from "@iyio/protogen";

export const markdownParser=async ({
    sources,
    log,
    nodes
}:ProtoContext)=>{


    for(const source of sources){

        if(source.ext!=='md' && source.contentType!=='text/markdown'){
            continue;
        }

        log(`markdownParser parse source - ${source.input}`);

        const mNodes=protoMarkdownParseNodes(source.content).allNodes;

        log(`${mNodes.length} node(s) parsed`);

        for(const node of mNodes){
            nodes.push(node);
        }
    }
}
