import { atDotCss } from "@iyio/at-dot-css";
import { FirstArg } from "@iyio/common";

export const acStyle=atDotCss({name:'AnyCompStyle',css:`
    @.root{ vars:
        @@borderRadius
        @@borderWidth
        @@borderDefault
        @@foregroundColor
        @@inputBg
        @@borderColor
        @@inputPadding
    }
`});

export type AcStyleVars=Required<FirstArg<typeof acStyle.vars>>;

let foregroundColor='#000000';
export const defaultAcStyle:AcStyleVars={
    borderRadius:'0.5rem',
    borderWidth:'1px',
    borderDefault:`solid 1px ${foregroundColor}33`,
    inputPadding:'0.5rem',
    foregroundColor,
    inputBg:foregroundColor+'33',
    borderColor:foregroundColor+'33',
}

foregroundColor='#ffffff';
export const defaultAcStyleDarkMode:AcStyleVars={
    ...defaultAcStyle,
    foregroundColor,
    borderDefault:`solid 1px ${foregroundColor}33`,
    inputBg:foregroundColor+'33',
    borderColor:foregroundColor+'33',
}
