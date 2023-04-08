import { protoParseCliArgs } from "@iyio/protogen";
import { runProtogenCliAsync } from "./runProtogenCliAsync";

const {config,args}=protoParseCliArgs(globalThis.process?.argv??[],2)

runProtogenCliAsync({config,args,loadModule:require});
