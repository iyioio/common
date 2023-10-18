import { parseCliArgsT } from "@iyio/common";
import { AnyCompWatcher } from "../lib/AnyCompWatcher";


interface Args
{
    dir:string[];
    outDir:string;
    debug?:boolean|string;
    disableLazyLoading:boolean;
    breakOnDebug?:boolean;
}

const args=parseCliArgsT<Args>({
    args:process.argv,
    startIndex:2,
    converter:{
        dir:args=>args,
        outDir:args=>args[0]??'',
        debug:args=>args[0]?.length===0?true:args[0],
        disableLazyLoading:args=>args.length?true:false,
        breakOnDebug:args=>args.length?true:false,

    }
}).parsed as Args

const main=async ({
    dir,
    outDir,
    debug,
    disableLazyLoading,
    breakOnDebug
}:Args)=>{

    const watcher=new AnyCompWatcher({watchDirs:dir,log:console.log,outDir,debug,disableLazyLoading,breakOnDebug});

    let shouldExit=false;
    function kill(){
        console.log("Exiting");
        watcher.dispose();
        if(shouldExit){
            process.exit();
        }
        shouldExit=true;
    }
    process.on('SIGINT',kill);
    process.on('SIGQUIT',kill);
    process.on('SIGTERM',kill);

    console.info('Start watching')
    await watcher.watchAsync();
}

main(args);
