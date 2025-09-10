import { cn } from "@iyio/common";
import { createContext, useContext } from "react";
import { View, ViewProps } from "./View.js";

export const defaultTheme='default-theme';

export interface ThemeProps
{
    theme?:string;
    children?:any;
}

export function Theme({
    theme=defaultTheme,
    children,
    className,
    ...props
}:ThemeProps & ViewProps){

    return (
        <ReactThemeContext.Provider value={theme}>
            <View {...props} className={cn('Theme',theme,className)}>
                {children}
            </View>
        </ReactThemeContext.Provider>
    )

}

export const ReactThemeContext=createContext<string>(defaultTheme);

export const useTheme=():string=>{
    const ctrl=useContext(ReactThemeContext);
    return ctrl??defaultTheme;
}

