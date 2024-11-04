export const setClipboardTextAsync=async (text:string):Promise<boolean>=>{

    if( globalThis.navigator?.clipboard &&
        (typeof globalThis.navigator?.clipboard.writeText === 'function')
    ){
        try{
            await navigator.clipboard.write([new ClipboardItem({"text/plain":text})])
            return true;
        }catch{
            return setClipboardFallback(text);
        }
    }else{
        return setClipboardFallback(text);
    }
}
const setClipboardFallback=(text:string)=>{
    if(!globalThis.document){
        return false;
    }
    const txt=document.createElement('textarea');
    txt.style.width='0px';
    txt.style.height='0px';
    txt.style.border='none';
    txt.style.opacity='0';
    txt.style.position='absolute';
    document.body.append(txt);
    try{
        const isIOS=navigator.userAgent.match(/ipad|ipod|iphone/i);
        txt.value=text;
        if(isIOS){
            const range=document.createRange();
            range.selectNodeContents(txt);
            const selection=window.getSelection();
            if(selection){
                selection.removeAllRanges();
                selection.addRange(range);
                txt.setSelectionRange(0,text.length);
            }
        }else{
            txt.select();
        }
        document.execCommand('copy');
        return true;
    }catch(ex){
        return false;
    }finally{
        document.body.removeChild(txt);
    }

}
