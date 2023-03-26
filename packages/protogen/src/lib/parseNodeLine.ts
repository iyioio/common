import { ProtoAttribute, ProtoNode } from "./protogen-types";

const brackets=/\[\s*\]/g

export const parseNodeLine=(line:string,typeStartIndex:number,hasParent:boolean,extendLine?:(name:string)=>string|null):ProtoNode[]=>{

    const ci=line.indexOf('#');
    let comment:string|undefined;
    if(ci!==-1){
        comment=line.substring(ci+1).trim();
        line=line.substring(0,ci);
    }
    let atts=line.split('@');
    if(extendLine){
        const preName=atts[0].split(':',1)[0];
        const ext=extendLine(preName);
        if(ext){
            atts=(line+' '+ext).split('@');
        }
    }
    const types=atts[0].split(':').map(t=>t.trim());
    const optional=types[0].endsWith('?');
    if(optional){
        types[0]=types[0].substring(0,types[0].length-1)
    }

    const attributes:{[name:string]:ProtoAttribute}={};

    const node:ProtoNode={
        name:types[0].replace(brackets,''),
        type:types[typeStartIndex]?.replace(brackets,'')??'',
        types:types.filter((_,i)=>i>=typeStartIndex).map(t=>({
            type:t.replace(brackets,''),
            isArray:brackets.test(t),
        })),
        isArray:brackets.test(types[typeStartIndex]??''),
        attributes,
        optional,
    }

    if(comment){
        node.comment=comment;
    }

    if(types.length>typeStartIndex+1){
        node.refType={
            type:types[typeStartIndex+1],
            isArray:brackets.test(types[typeStartIndex+1])
        }
    }

    for(let i=1;i<atts.length;i++){
        const al=atts[i].split(',').map(s=>s.trim());
        const defaultAtt=splitAtt(al[0])
        const att:ProtoAttribute={
            name:defaultAtt[0],
            value:defaultAtt[1],
            props:{}
        }
        attributes[att.name]=att;
        for(const a of al){
            const p=splitAtt(a);
            att.props[p[0]]=p[1];
        }


    }

    if(node.refType && !node.refType.isArray && hasParent){
        const type=node.refType;
        let name:string;
        const nameAtt=node.attributes['refName']?.value;
        if(nameAtt){
            name=nameAtt;
        }else if(node.name.endsWith('Id')){
            name=node.name.substring(0,node.name.length-2)
        }else if(node.name.endsWith('Ref')){
            name=node.name.substring(0,node.name.length-3)
        }else{
            name=node.name+'Ref';
        }
        const refNode:ProtoNode={
            name,
            optional:true,
            type:type.type,
            isArray:false,
            attributes:{},
            types:[{...type}]
        }
        return [node,refNode];
    }else{
        return [node];
    }

}

const splitAtt=(att:string):[string,string]=>{
    const i=att.indexOf(':');
    if(i===-1){
        return [att,'']
    }else{
        return [att.substring(0,i).trim(),att.substring(i+1).trim()]
    }
}
