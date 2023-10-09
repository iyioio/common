import { BaseLayoutBreakpointOptions } from "./base-layout-generator";
import { BaseLayoutBreakpointOptionsDefaults } from "./base-layout-generator-types";

export const getBaseLayoutDefaults=(options:BaseLayoutBreakpointOptions={}):BaseLayoutBreakpointOptionsDefaults=>
{
    const {
        spacing:{
            space0='0',
            space025='0.25rem',
            space050='0.50rem',
            space075='0.75rem',
            space1='1rem',
            space2='2rem',
            space3='3rem',
            space4='4rem',
            space5='5rem',
            space6='6rem',
            space7='8rem',
            space8='10rem',
            space9='15rem',
            space10='20rem',
        }={},
        columnWidths:{
            xs='8rem',
            sm='12rem',
            md='16rem',
            lg='24rem',
            xl='32rem',
        }={},
        animationSpeeds:{
            fast='0.1s',
            quick='0.2s',
            slow='0.5s',
            extraSlow='1.5s'
        }={},
        semiTransparency='0.5',
        containerMargin=space3
    }=options;

    return {
        ...options,
        spacing:{
            space0,
            space025,
            space050,
            space075,
            space1,
            space2,
            space3,
            space4,
            space5,
            space6,
            space7,
            space8,
            space9,
            space10,
        },
        columnWidths:{
            xs,
            sm,
            md,
            lg,
            xl,
        },
        animationSpeeds:{
            fast,
            quick,
            slow,
            extraSlow,
        },
        semiTransparency,
        containerMargin,
    }
}
