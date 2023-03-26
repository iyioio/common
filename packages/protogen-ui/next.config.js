//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withNx } = require('@nrwl/next/plugins/with-nx');

/**
 * @type {import('@nrwl/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = withNx({
    nx: {
        // Set this to true if you would like to to use SVGR
        // See: https://github.com/gregberge/svgr
        svgr: false,
    },
    typescript: {
        ignoreBuildErrors: process.env['NX_IGNORE_NEXTJS_BUILD_ERROR']==='true',
    },

    webpack:(config,{isServer})=>{
        if(!isServer){

            if(!config.resolve){
                config.resolve={};
            }

            if(!config.resolve.alias){
                config.resolve.alias={};
            }
            const ignore=['fs','fs/promises','crypto'];
            for(const i of ignore){
                config.resolve.alias[i]=false;
                config.resolve.alias['node:'+i]=false;
            }

        }
        return config;
    }

});


module.exports = nextConfig;
