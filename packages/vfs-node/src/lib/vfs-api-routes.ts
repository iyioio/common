import { BadRequestError, NotFoundError, asArray, escapeRegex, getContentType, getDirectoryName, getFileName, parseObjectQueryJsonValue, safeParseNumberOrUndefined } from "@iyio/common";
import { HttpRoute, createHttpHandlerResult } from "@iyio/node-common";
import { VfsCtrl, VfsDirReadOptions, VfsMntCtrl, VfsMntPt, VfsShellCommand, vfs } from "@iyio/vfs";

export interface VfsHttpRouteOptions
{
    prefix?:string;
    fs?:VfsCtrl|(()=>VfsCtrl);
    mntCtrl?:VfsMntCtrl|(()=>VfsMntCtrl);
    mnt?:VfsMntPt|VfsMntPt[];
    allowDeleteRootDir?:boolean;

}

export const createVfsApiRoutes=({
    prefix='',
    fs,
    mntCtrl,
    mnt,
    allowDeleteRootDir: allowDeleteRoot,
}:VfsHttpRouteOptions):HttpRoute[]=>{

    if(!prefix.startsWith('/')){
        prefix='/'+prefix;
    }

    if(prefix.endsWith('/')){
        prefix=prefix.substring(0,prefix.length-1);
    }

    const regPrefix='^'+escapeRegex(prefix);

    let _fs:VfsCtrl|null=null;
    const getFs=():VfsCtrl=>{
        if(_fs){
            return _fs;
        }
        if(fs){
            if(typeof fs === 'function'){
                _fs=fs();
            }else{
                _fs=fs;
            }
        }else{
            _fs=vfs();
        }

        if(mntCtrl){
            const m=(typeof mntCtrl ==='function')?mntCtrl():mntCtrl;
            _fs.registerMntCtrl(m);
        }

        if(mnt){
            const ary=asArray(mnt);
            for(const m of ary){
                _fs.addMntPt(m);
            }
        }

        return _fs;
    }

    return [
        {
            method:'GET',
            match:new RegExp(`${regPrefix}/item(/.*|$)`),
            handler:async ({
                query,
            })=>{
                const path=getPath(query);

                return await getFs().getItemAsync(path,{
                    includeSize:query['includeSize']==='true'
                })??null;

            }
        },

        {
            method:'DELETE',
            match:new RegExp(`${regPrefix}/item(/.*|$)`),
            handler:async ({
                query,
            })=>{

                const path=getPath(query);

                if(path==='/' && !allowDeleteRoot){
                    throw new BadRequestError('Deleting root not permitted');
                }

                return await getFs().removeAsync(path);

            }
        },

        {
            method:'GET',
            match:new RegExp(`${regPrefix}/dir(/.*|$)`),
            handler:async ({
                query,
            })=>{

                const path=getPath(query);

                const filter=parseObjectQueryJsonValue(query['filter']);
                const equals=query['equals'];
                const contains=query['contains'];
                const startsWith=query['startsWith'];
                const endsWith=query['endsWith'];
                const match=query['match'];

                const options:VfsDirReadOptions={
                    path:path,
                    offset:safeParseNumberOrUndefined(query['offset']),
                    limit:safeParseNumberOrUndefined(query['limit']),
                    filter:(
                        (typeof filter ==='object')?
                            filter
                        :(startsWith || endsWith || match || equals || contains)?{
                            startsWith,
                            endsWith,
                            equals,
                            contains,
                            match,
                        }:undefined
                    )
                }

                return await getFs().readDirAsync(options)

            }
        },

        {
            method:'POST',
            match:new RegExp(`${regPrefix}/dir(/.*|$)`),
            handler:async ({
                query,
            })=>{

                const path=getPath(query);

                return await getFs().mkDirAsync(path);

            }
        },

        {
            method:'POST',
            match:new RegExp(`${regPrefix}/touch(/.*|$)`),
            handler:async ({
                query,
            })=>{

                const path=getPath(query);

                return await getFs().touchAsync(path);

            }
        },

        {
            method:'GET',
            match:new RegExp(`${regPrefix}/string(/.*|$)`),
            handler:async ({
                query,
            })=>{

                const path=getPath(query);

                try{
                    return await getFs().readStringAsync(path);
                }catch(ex){
                    if(ex instanceof NotFoundError){
                        return null;
                    }
                    throw ex;
                }

            }
        },

        {
            method:'POST',
            match:new RegExp(`${regPrefix}/string(/.*|$)`),
            handler:async ({
                query,
                body,
            })=>{

                const path=getPath(query);
                if(typeof body !== 'string'){
                    throw new BadRequestError();
                }

                return await getFs().writeStringAsync(path,body);

            }
        },

        {
            method:'PUT',
            match:new RegExp(`${regPrefix}/string(/.*|$)`),
            handler:async ({
                query,
                body,
            })=>{

                const path=getPath(query);
                if(typeof body !== 'string'){
                    throw new BadRequestError();
                }

                return await getFs().appendStringAsync(path,body);

            }
        },

        {
            method:'GET',
            match:new RegExp(`${regPrefix}/stream(/.*|$)`),
            handler:async ({
                query,
            })=>{

                const path=getPath(query);

                const fs=getFs();

                if(await fs.canGetReadStream(path)){
                    const stream=await fs.getReadStreamAsync(path);
                    return createHttpHandlerResult({
                        stream:stream.stream as any,
                        contentType:stream.contentType,
                        size:stream.size,
                    })
                }else{
                    const text=await fs.readStringAsync(path);
                    return createHttpHandlerResult({
                        text,
                        contentType:getContentType(path),
                    })
                }

            }
        },

        {
            method:'POST',
            match:new RegExp(`${regPrefix}/stream(/.*|$)`),
            rawBody:true,
            handler:async ({
                req,
                query,
            })=>{

                const path=getPath(query);

                const fs=getFs();

                if(await fs.canWriteStream(path)){
                    return await fs.writeStreamAsync(path,req);
                }else{
                    const chunks:Buffer[]=[];
                    await new Promise<void>((resolve, reject) => {
                        req.on('data',(chunk)=>chunks.push(Buffer.from(chunk)));
                        req.on('error',(err)=>reject(err));
                        req.on('end',()=>resolve());
                    })

                    if(await fs.canWriteBuffer(path)){
                        return await fs.writeBufferAsync(path,new Blob(chunks));
                    }else{
                        return await fs.writeStringAsync(path,Buffer.concat(chunks).toString('utf8'));
                    }
                }

            }
        },

        {
            method:'POST',
            match:new RegExp(`${regPrefix}/exec`),
            handler:async ({
                body,
            })=>{
                const cmd=body as VfsShellCommand;
                if((typeof cmd !== 'object') || !cmd){
                    throw new BadRequestError();
                }
                if(!cmd.cwd){
                    throw new BadRequestError('cwd required')
                }
                return await getFs().execShellCmdAsync(cmd);
            }
        },

        {
            method:'GET',
            match:new RegExp(`${regPrefix}/pipe(/.*|$)`),
            handler:async ({
                query,
            })=>{

                const path=getPath(query);
                const r=await getFs().getPipeOutputAsync(getDirectoryName(path),getFileName(path));
                if(!r || !Object.keys(r).length){
                    return createHttpHandlerResult({statusCode:204});
                }else{
                    return r;
                }

            }
        },


    ]
}

const getPath=(query:Record<string,string>):string=>{
    const path=query['1'];
    if(path===undefined){
        throw new Error('Invalid route pattern');
    }
    return path.startsWith('/')?path:'/'+path;
}
