import { isServerSide } from "./common-lib";

export const downloadBlob=(name:string, blob:Blob)=>{
    if(isServerSide){
        return false;
    }
    // Convert your blob into a Blob URL (a special url that points to an object in the browser's memory)
    const blobUrl = URL.createObjectURL(blob);

    // Create a link element
    const link = document.createElement("a");

    // Set link's href to point to the Blob URL
    link.href = blobUrl;
    link.download = name;

    // Append link to the body
    document.body.appendChild(link);

    // Dispatch click event on the link
    // This is necessary as link.click() does not work on the latest firefox
    link.dispatchEvent(
        new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
        })
    );


    link.style.opacity='0';
    link.style.pointerEvents='none';
    // Remove link from body
    setTimeout(()=>{
        document.body.removeChild(link);
        setTimeout(()=>{
            URL.revokeObjectURL(blobUrl);
        },10000);
    },1000);

    return true;
}

export const downloadObject=(name:string,obj:any,format?:boolean|string|number)=>{
    const blob=new Blob([format?JSON.stringify(obj,null,format===true?4:format):JSON.stringify(obj)]);
    return downloadBlob(name,blob);
}

export const downloadText=(name:string,text:string,contentType:string)=>{
    return downloadBlob(name,new Blob([text],{type:contentType}));
}
