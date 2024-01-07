export const wordToSingular=(word:string)=>{
    if(word.endsWith('ies')){
        return word.slice(0,-3)+'y';
    }else if(word.endsWith('es') && (
        word.endsWith('sses') ||
        word.endsWith('shes') ||
        word.endsWith('ches') ||
        word.endsWith('xes') ||
        word.endsWith('zes')
    )){
        return word.slice(0,-2);
    }else if(word.endsWith('s') && !word.endsWith('ss')){
        return word.slice(0,-1);
    }
    return word
}


export const wordToPlural=(word:string):string=>{
    if(word.endsWith('y')){
        return word.slice(0,-1)+'ies';
    }else if(
        word.endsWith('s') ||
        word.endsWith('sh') ||
        word.endsWith('ch') ||
        word.endsWith('x') ||
        word.endsWith('z')
    ){
        return word+'es';
    } else {
        return word+'s';
    }
}
