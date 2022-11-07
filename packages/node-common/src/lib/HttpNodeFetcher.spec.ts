import { createScope, emptyFunction, httpClient } from "@iyio/common";
import { createServer } from 'node:http';
import { nodeCommonModule } from './_modules.node-common';

interface OkInterface
{
    ok:string;
}

const defaultOk:OkInterface={
    ok:'bob'
}

describe('http',()=>{

    let port=0;
    let url='';
    let close=emptyFunction;

    beforeAll(()=>new Promise<void>((resolve,reject)=>{
        try{
            const server=createServer((req,res)=>{
                res.setHeader('Content-Type','application/json');
                res.end(JSON.stringify(defaultOk));
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
                    url=`http://localhost:${port}`;
                    console.log(`Testing http port = ${port}`);
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
        close();
    });


    it('should send get request',async ()=>{

        const scope=createScope(scope=>{
            scope.use(nodeCommonModule);
        });

        const http=httpClient(scope);

        const ok=await http.getAsync<OkInterface>(url);

        expect(ok).toEqual(defaultOk);

    })
})
