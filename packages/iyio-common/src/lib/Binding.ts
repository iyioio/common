import { PathValue, RecursiveKeyOf } from "./common-types";
import { wSetProp, watchObjAtPath } from "./obj-watch-lib";
import { Watchable, WatchedPath } from "./obj-watch-types";
import { getValueByAryPath, getValueByPath, getValueByReverseAryPath } from "./object";

interface BindingOptions<
    Src extends Watchable,
    Dest extends Watchable,
    SrcPath extends string=RecursiveKeyOf<Src>,
    DestPath extends string=RecursiveKeyOf<Dest>
>{

    /**
     * The source object
     */
    src:Src;

    /**
     * Dot separated path to the source value
     */
    srcPath:SrcPath;

    /**
     * The destination object
     */
    dest:Dest;

    /**
     * Dot separated path to the destination value
     */
    destPath:DestPath;

    /**
     * If true changes to the destination object will be applied to source object
     */
    twoWay?:boolean;

    /**
     * The maximum number of times a destination or source value can be set recursively. When using
     * multiple Bindings it is possible to get into a binding loop. To prevent the loop from
     * running infinitely maxSetDepth defines the maximum number of times a binding can set its
     * target or destination recursively.
     * @default 1
     */
    maxSetDepth?:number;

    /**
     * If true setting the destination value when the Binding is created will be skipped.
     */
    skipInit?:boolean;

    /**
     * If true debug info is printed to the console when binding update occur
     */
    debug?:boolean;

}

/**
 * Binds the value of a destination property to a source property. Use the obj-watch setter
 * functions such as wSetProp to manipulate the source and destination. The Binding class uses
 * watchObjAtPath to watch for changes.
 */
export class Binding<
    Src extends Watchable,
    Dest extends Watchable,
    SrcPath extends string=RecursiveKeyOf<Src>,
    DestPath extends string=RecursiveKeyOf<Dest>
>{
    public readonly src:Src;

    public readonly dest:Dest;

    public readonly twoWay:boolean;

    private readonly srcWatchPath:WatchedPath;

    private readonly destWatchPath?:WatchedPath;

    public debug:boolean;

    public constructor({
        src,
        srcPath,
        dest,
        destPath,
        twoWay=false,
        skipInit=false,
        debug=false,
        maxSetDepth=1
    }:PathValue<Src,SrcPath> extends PathValue<Dest,DestPath>?
        BindingOptions<Src,Dest,SrcPath,DestPath>:never
    ){
        this.src=src;
        this.dest=dest;
        this.twoWay=twoWay;
        this.debug=debug;

        let setDepth=0;

        const destPathAry=destPath.split('.');
        const destProp=destPathAry[destPathAry.length-1]??'';
        destPathAry.pop();
        this.srcWatchPath=watchObjAtPath(src,srcPath as RecursiveKeyOf<Src>,(obj,evt,reversePath)=>{
            if(!destProp || setDepth>=maxSetDepth){
                return;
            }
            const value=reversePath?getValueByReverseAryPath(src,reversePath):getValueByPath(src,srcPath);
            const target=getValueByAryPath(dest,destPathAry);
            if(this.debug){
                console.info(`Binding src(${srcPath}) -> dest(${destPath})`,value,{target,value,destPathAry,obj,evt,reversePath});
            }
            if(target){
                setDepth++;
                try{
                    wSetProp(target,destProp,value);
                }finally{
                    setDepth--;
                }
            }
        },{skipInitCall:skipInit});

        if(twoWay){
            const srcPathAry=srcPath.split('.');
            const srcProp=srcPathAry[srcPathAry.length-1]??'';
            srcPathAry.pop();
            this.destWatchPath=watchObjAtPath(dest,destPath as RecursiveKeyOf<Dest>,(obj,evt,reversePath)=>{
                if(!srcProp || setDepth>=maxSetDepth){
                    return;
                }
                const value=reversePath?getValueByReverseAryPath(dest,reversePath):getValueByPath(dest,destPath);
                const target=getValueByAryPath(src,srcPathAry);
                if(this.debug){
                    console.info(`Binding dest(${srcPath}) -> src(${destPath})`,value,{target,value,srcPathAry,obj,evt,reversePath});
                }
                if(target){
                    setDepth++;
                    try{
                        wSetProp(target,srcProp,value);
                    }finally{
                        setDepth--;
                    }
                }
            },{skipInitCall:true});
        }
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.srcWatchPath.dispose();
        this.destWatchPath?.dispose();
    }
}

