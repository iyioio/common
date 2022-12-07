import { allBaseLayoutFlagProps, FirstArg } from '@iyio/common';
import React from 'react';
import BaseAppContainer from './BaseAppContainer';

export interface CreateStoryOptions
{
    showBaseLayoutControls?:boolean;
}

/**
 * Creates a new storybook story.
 * @note !! Make sure to include a SPACES in you export between the export name and assignment.
 *       Storybook will not recognize the story. I know this is extremely stupid.
 * @example
 * //      Space here 👇 👇 is required. Storybook must use some stupid linting rule when searching for stories
 * export const Default = createStory(MyComponent,{
 *   propA:1,
 *   propB:2
 * })
 * @param comp React component
 * @param props Default props
 * @returns A storybook story. Make sure to include spaces after assigning value in your export. See example.
 */
export const createStory=<TComp extends ((props:any)=>any)>(
    comp:TComp,props:FirstArg<TComp>,{showBaseLayoutControls}:CreateStoryOptions={}
    ):TComp & {args:FirstArg<TComp>}=>
{
    const Template=(args:any)=>{
        return (
            <BaseAppContainer>
                {React.createElement(comp,args)}
            </BaseAppContainer>
        )
    }
    const boundComp=Template.bind({});
    const argsSorted:any={};
    const keys=Object.keys(props);
    keys.sort((a,b)=>a.localeCompare(b));
    for(const k of keys){
        argsSorted[k]=props[k];
    }
    (boundComp as any).args=argsSorted;
    (boundComp as any).parameters={
        controls:{
            exclude:showBaseLayoutControls?undefined:allBaseLayoutFlagProps
        }
    };
    return boundComp as any;
}
