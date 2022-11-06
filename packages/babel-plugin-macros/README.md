# IYIO babel-plugin-macros
Used to register environment variables with the @iyio/common registerConfig function

## Usage
The follow will be transformed 
``` ts
import { registerConfig, STATIC_ENV_VARS } from '@iyio/common';
registerConfig(null,STATIC_ENV_VARS);
```
-to-
``` ts
import { registerConfig, STATIC_ENV_VARS } from '@iyio/common';
registerConfig(null,{
    NX_ENV_VAR_A:'value a from the environment',
    NX_ENV_VAR_B:'value b from the environment',
});
```

STATIC_ENV_VARS must be passed as an argument to the registerConfig for the substation to occur.


## Plugin options
 - identifier : string
     - The identifier to replace assignment value for.
     - default = 'STATIC_ENV_VARS'

 - func : string
     - The name of the function being call to replace the identifier argument of
     - default = 'registerConfig'

 - prefix : string | null | false
   - Environment variables must be prefixed with this value to be added.
   - default = 'NX_'

 - ignore : string[]
     - An array of environment variables to ignore
     - default = []
     
 - mode : 'keep' | 'drop' | 'both'
     - Determines what is done with the prefix
     - default = 'both'


## Workspace level configuration
To enable the plugin workspace wide add the plugin to the root babel.config.json file

/babel.config.json
``` json
{
    "babelrcRoots": ["*"],
    "plugins": ["@iyio/babel-plugin-macros"]
}
```

## NextJS Project level configuration
To enable the plugin in a NextJS project add the plugin to the .babelrc file in the project. If
.babelrc does not exist create it.


/packages/{NextJsProject}/.babelrc
``` json
{
    "presets": ["@nrwl/next/babel"],
    "plugins": ["@iyio/babel-plugin-macros"]
}
```

If workspace level configuration has been enabled
``` json
{
    "presets": ["@nrwl/next/babel"]
}

