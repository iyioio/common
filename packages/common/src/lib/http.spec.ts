import { createServer } from 'node:http';
import { emptyFunction } from "./common-lib";

describe('http',()=>{

    let port=0;
    let close=emptyFunction;

    beforeAll(()=>new Promise<void>((resolve,reject)=>{
        try{
            const server=createServer((req,res)=>{
                res.end('{"ok":"bob}');
            })
            server.listen(0,undefined,()=>{
                const addr=server.address();
                if(typeof addr === 'string'){
                    const parts=addr.split(':');
                    port=Number(parts[parts.length-1]);
                    if(!isFinite(port)){
                        reject('Unable to get listening port')
                    }
                    resolve();
                }else if(addr){
                    port=addr.port;
                    resolve();
                }else{
                    reject('Unable to get listening address')
                }
            })
            close=()=>{
                server.close();
            }
        }catch(ex){
            reject(ex);
        }
    }));

    afterAll(()=>{
        //close server

        close();
    });
})
