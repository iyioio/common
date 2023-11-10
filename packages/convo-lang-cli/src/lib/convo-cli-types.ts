export interface ConvoCliConfig
{
    env?:Record<string,string>;
}

export interface ConvoLangCliOptions
{
    /**
     * Path to a ConvoCliConfig file
     */
    config?:string;

    /**
     * Path to a source convo file
     */
    source?:string;

    /**
     * Inline convo code
     */
    inline?:string;

    /**
     * If true the give convo code will be parsed and output as JSON instead of executing the
     * code.
     */
    parse?:boolean;

    /**
     * JSON formatting used if the parse option is true
     */
    parseFormat?:number;

    /**
     * Either a function that will be called with each chunk of generated code or a path to write
     * output to. If out equals "." then the source path will be used. This allows you to run a
     * convo script then output the results back into the same file.
     */
    out?:((...chunks:string[])=>void)|string;

    /**
     * If true the output of the executor is buffered to be used later.
     */
    bufferOutput?:boolean;
}
