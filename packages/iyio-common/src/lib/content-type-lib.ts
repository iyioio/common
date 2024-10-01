export const isContentTypeMatch=(pattern:string|string[],contentType:string):boolean=>{
    if(!pattern || !contentType){
        return false;
    }

    if(Array.isArray(pattern)){
        return aryAnyContentTypeMatches(pattern,contentType);
    }

    if(pattern==='*' || pattern==='*/*'){
        return true;
    }

    pattern=pattern.toLowerCase();
    contentType=contentType.toLowerCase();

    if(pattern.includes('/')){
        if(pattern.startsWith('*/')){
            return contentType.endsWith(pattern.substring(1));
        }else if(pattern.endsWith('/*')){
            return contentType.startsWith(pattern.substring(0,pattern.length-1));
        }else{
            return pattern===contentType;
        }
    }else{
        return `/${contentType}/`.includes(`/${pattern}/`);
    }

}

export const aryAnyContentTypeMatches=(patterns:string[],contentType:string):boolean=>{
    for(const p of patterns){
        if(isContentTypeMatch(p,contentType)){
            return true;
        }
    }
    return false;
}
