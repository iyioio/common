module.exports=function babelPluginEnv()
{
    const defaultIdentifier='STATIC_ENV_VARS';
    const defaultFunc='registerConfig';
    const defaultPrefix='NX_';
    const defaultIgnore=[];
    const defaultMode='both';


    let envs=null;
    const getEnvs=(opts)=>{
        if(envs){
            return envs;
        }
        envs={NODE_ENV:process.env['NODE_ENV']||'production'}
        const prefix=opts.prefix??defaultPrefix;
        const ignore=opts.ignore??defaultIgnore;
        const mode=opts.mode??defaultMode;

        for(const e in process.env){
            if((prefix && !e.startsWith(prefix)) || ignore.includes(e)){
                continue;
            }
            switch(mode){

                case 'keep':
                    envs[e]=process.env[e];
                    break;

                case 'drop':
                    envs[e.substring(prefix.length)]=process.env[e];
                    break;

                default:
                    envs[e]=process.env[e];
                    envs[e.substring(prefix.length)]=process.env[e];
                    break;
            }
        }

        return envs;
    }
    return {
        visitor:{
            Identifier(path,state){
                const id=state.opts.identifier??defaultIdentifier;
                const func=state.opts.func??defaultFunc;
                if( path.node.name===id &&
                    path.parent &&
                    path.parent.type==='CallExpression' &&
                    path.parent.callee &&
                    path.parent.callee.name===func &&
                    path.parent.arguments &&
                    path.parent.arguments.includes(path.node)
                ){
                    path.replaceWithSourceString(JSON.stringify(getEnvs(state.opts)))
                }

            }
        }
    }
}
