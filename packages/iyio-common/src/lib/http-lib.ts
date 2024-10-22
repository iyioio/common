export const encodeURIFormBody=(body:any):string=>{

    if(body===undefined){
        return '';
    }

    const formBody:string[]=[];

    if(typeof body !== 'object'){
        body={value:body}
    }

    for(const e in body){
        let v=body[e];
        if(typeof v !== 'string'){
            v=v?.toString()??''
        }
        formBody.push(`${
            encodeURIComponent(e)
        }=${
            encodeURIComponent(v)
        }`);
    }

    return formBody.join('&');
}

export const defaultHttpClientMaxRetries=5;
