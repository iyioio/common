export const readBlobAsync=(blob:Blob,initReader:(reader:FileReader,blob:Blob)=>void):Promise<ArrayBuffer|string|undefined>=>{
    return new Promise<ArrayBuffer|string|undefined>((resolve,reject)=>{
        const reader=new FileReader();
        reader.onloadend=()=>{
            resolve(reader.result??undefined)
        }
        reader.onerror=e=>{
            reject(e)
        }
        reader.onabort=e=>{
            reject(e);
        }
        initReader(reader,blob);
    });
}

export const readBlobAsArrayBufferAsync=(blob:Blob):Promise<ArrayBuffer|undefined>=>{
    return readBlobAsync(blob,(r,b)=>r.readAsArrayBuffer(b)) as any;
}

export const readBlobAsUint8ArrayAsync=async (blob:Blob):Promise<Uint8Array|undefined>=>{
    const r=await readBlobAsArrayBufferAsync(blob);
    if(!r){
        return undefined;
    }
    return new Uint8Array(r);
}
