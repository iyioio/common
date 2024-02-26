# AnyComp
A lightweight replacement for Storybook designed to run directly in any React application.

## Features

- **Simplified Integration** - No complex configuration or build steps. Just run the
  any-comp CLI and quickly test any of your components.

- **Auto Scanning** - All components in your project are automatically registered. No need to define
  a story for every component you want to test.

- **Persistent Component State** - Save and reload the state of your components as you test to
  quickly recreate specific testing conditions.

## The CLI
When running, the watch-any-comp command scans and watches for changes to all of your components and generates
a AcCompRegistry. This component registry can then be rendered by the AnyCompBrowser component 
which renders an interface similar to StoryBook and contains a searchable list of all the
components in your project

The example below continuously watches the `src/components` directly and creates a component
registry located at `src/testing/all-comps.tsx`. The component registry is updated with any
changes while the watch-any-comp command is running.
``` sh
npx watch-any-comp --dir src/components --outDir src/testing
```

## Component Browser
Once the your component registry has be created using the watch-any-comp command you can view your
components using the `AnyCompBrowser` component. When using AnyComp with a NexJS project create a
new page that renders the `AnyCompBrowser` component then browse to the newly created page.

NextJs usage example
``` tsx
import { AcCompRegistry, AnyCompBrowser } from '@iyio/any-comp';
import { useEffect, useState } from 'react';

export default function AnyCompExamplePage(){

    const [compReg,setCompReg]=useState<AcCompRegistry|null>(null);

    useEffect(()=>{
        // import dynamically to avoid NextJS server side errors
        import('../any/all-comps').then(v=>{
            setCompReg(v.anyCompReg as any);
        })
    },[]);

    return (
        <div>
            {compReg && <AnyCompBrowser reg={compReg} rememberCompId/>}
        </div>
    );
};
```

## Installation
AnyComp consists of 2 packages `@iyio/any-comp` and `@iyio/any-comp-cli`. `@iyio/any-comp` contains
the `AnyCompBrowser` component and other supporting code used to render your component for testing.
`@iyio/any-comp-cli` contains the `watch-all-comps` command uses to build component registries.

``` sh
npm install @iyio/any-comp
npm install @iyio/any-comp-cli --save-dev
```

## OnChange Prop Bindings
Prop bindings allow you to connect value properties to an on change callbacks without the need to 
write custom testing code. For example if you have a TextInput component with a value prop
representing the current value of the text input and an onChange prop called when the value changes
you can have these 2 props automatically bound together. With StoryBook you would have to create a
custom Template to bind the 2 values together.

By default AnyComp will automatically bind `value` to `onChange` and `{x}` to `on{x}Change`.
You can also use tags defined in JSDoc style comments to define custom bindings that don't fit the
auto binding naming convention.

Binding examples:
``` ts
interface ExampleCompProps
{
    onChange:(value:string)=>void;
    value:string;

    age:number;
    onAgeChange:(value:number)=>void;

    jobTitle:string;
    /**
     * @acBind jobTitle
     */
    onPositionChange:(value:string)=>void;
}
```

Resulting bindings
``` text
onChange -> value
onAgeChange -> value
onPositionChange -> jobTitle
```

## Tags
Tags allow you to customize the behaviour of your components when rendered by AnyComp. Tags are 
stored as metadata in JSDoc style comments.

- `@acIgnore` - Ignores the component or prop the tag is applied to.
- `@acBind targetPropName` - Binds a the callback prop to target prop.

Tag examples:
``` tsx
interface ExampleCompProps
{
    sirName:string;
    /**
     * @acBind sirName
     */
    onLastNameChange:(value:string)=>void;

    /**
     * @acIgnore
     */
    secretKey:string;
}

export function ExampleComp({
    sirName,
    onLastNameChange,
    secretKey
}:ExampleCompProps){

    // ...
}


/**
 * @acIgnore
 */
export function UtilityComp()
{

}
```


## CLI Options

| arg                  | value          | description                                                                                                                        |
|----------------------|----------------|------------------------------------------------------------------------------------------------------------------------------------|
| --dir                | directory path | Path to a directory with components. multiple --dir arguments can be specified                                                     |
| --outDir             | directory path | Directory where to write the all-comps.tsx component registry                                                                      |
| --disableLazyLoading |                | By default the component registry uses lazy loading to load component but this can be disabled using the --disableLazyLoading flag |
| --debug              |                | Write debug information to console                                                                                                 |
| --breakOnDebug       |                | Causes the process to enter a break point and wait for a debugger to attach when entering debug mode                               |
