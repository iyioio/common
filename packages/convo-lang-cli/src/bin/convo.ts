import { parseCliArgsT, safeParseNumberOrUndefined } from "@iyio/common";
import { ConvoLangCli } from "../lib/ConvoLangCli";
import { ConvoLangCliOptions } from "../lib/convo-cli-types";

type Args=ConvoLangCliOptions;
const args=parseCliArgsT<Args>({
    args:process.argv,
    startIndex:2,
    defaultKey:'source',
    converter:{
        source:args=>args[0],
        inline:args=>args[0],
        config:args=>args[0],
        out:args=>args[0],
        parse:args=>args.length?true:false,
        parseFormat:args=>safeParseNumberOrUndefined(args[0]),
        bufferOutput:args=>args.length?true:false,

    }
}).parsed as Args;

const main=async()=>{
    const cli=new ConvoLangCli(args);
    try{
        await cli.executeAsync();
    }catch(ex){
        console.error('convo execution failed',ex);
        process.exit(1);
    }
}

main();
