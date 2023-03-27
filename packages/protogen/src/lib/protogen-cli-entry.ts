import { runProtogenCliAsync } from "./runProtogenCliAsync";

runProtogenCliAsync(globalThis.process?.argv??[],2,require);
