export interface ConvoLangTheme
{
    foregroundColor:string;
    inputBackground:string;
    inputPadding:string;
    inputMargin:string;
    inputShadow:string;
    inputBorder:string;
    buttonColor:string;
    buttonForeground:string;
    borderRadius:string;
    padding:string;
    gap:string;
}

export const defaultLightConvoLangTheme:ConvoLangTheme={
    foregroundColor:'#111111',
    inputBackground:'#ffffff',
    inputPadding:'0.5rem',
    inputMargin:'0 0.5rem 0.5rem 0.5rem',
    inputShadow:'none',
    inputBorder:'none',
    borderRadius:'0.5rem',
    buttonColor:'#cccccc',
    buttonForeground:'#111111',
    padding:'1rem',
    gap:'1rem',
} as const

export const defaultDarkConvoLangTheme:ConvoLangTheme={
    ...defaultLightConvoLangTheme,
    foregroundColor:'#ffffff',
    inputBackground:'#333333',
    inputShadow:'0 0 20px 0px #ffffff11',
    inputBorder:'1px solid #ffffff22',
    buttonColor:'#333333',
    buttonForeground:'#ffffff',
} as const
