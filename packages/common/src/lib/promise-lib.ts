export const promiseFromErrorResultCallback=<TResult=any,TError=any>(init:(cb:(error:TError,result:TResult)=>void)=>void):Promise<TResult>=>{
    return new Promise<TResult>((resolve,reject)=>{
        init((error,result)=>{
            if(error){
                reject(error);
            }else{
                resolve(result);
            }
        });
    })
}
