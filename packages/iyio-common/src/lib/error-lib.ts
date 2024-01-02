export const getErrorMessage=(err:any,message?:string):string=>{
    if(!err && !message){
        return 'Error';
    }

    if(err===null || err===undefined){
        return message??'Error';
    }


    try{
        err=(typeof err === 'string')?err:(err.message?.toString?.()??err?.toString?.()??'[error]');
        return message?message+' - '+err:err;
    }catch{
        return message??'Error';
    }
}
