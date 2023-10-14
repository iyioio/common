import { parseCliArgsT } from "@iyio/common";
import { AnyCompWatcher } from "../lib/AnyCompWatcher";


interface Args
{
    dir:string[];
    outDir:string;
}

const args=parseCliArgsT<Args>({
    args:process.argv,
    startIndex:2,
    converter:{
        dir:args=>args,
        outDir:args=>args[0]??'',

    }
}).parsed as Args

const main=async ({
    dir,
    outDir
}:Args)=>{

    const watcher=new AnyCompWatcher({watchDirs:dir,log:console.log,outDir});

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
