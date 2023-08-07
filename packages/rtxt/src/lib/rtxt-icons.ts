import { escapeHtml } from "@iyio/common";

export interface RTxtIconOptions
{
    type:RTxtIconType;
    fill?:string;
}

export const getRTxtIcon=({
    type,
    fill,
}:RTxtIconOptions)=>{

    let html=rTxtIcons[type];

    if(fill){
        html=html.replace(/(?:\W)fill="[^"]*"/gi,`fill="${escapeHtml(fill)}"`)
    }

    return html;

}

export const rTxtIcons={
        alignLeft:
`<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="20" y="58" width="38" height="10" fill="#7D7D7D"/>
<path d="M20 31H84V41H20V31Z" fill="#7D7D7D"/>
<rect x="7" y="10" width="7" height="80" fill="#7D7D7D"/>
</svg>
`,
    alignCenter:
`<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M31 58H69V68H31V58Z" fill="#7D7D7D"/>
<path d="M18 31H82V41H18V31Z" fill="#7D7D7D"/>
<path d="M46.5 10H53.5V28H46.5V10Z" fill="#7D7D7D"/>
<path d="M46.5 44V55H53.5V44H46.5Z" fill="#7D7D7D"/>
<path d="M46.5 71H53.5V90H46.5V71Z" fill="#7D7D7D"/>
</svg>`,
    alignRight:
`<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="38" height="10" transform="matrix(-1 0 0 1 80 58)" fill="#7D7D7D"/>
<path d="M80 31H16V41H80V31Z" fill="#7D7D7D"/>
<rect width="7" height="80" transform="matrix(-1 0 0 1 93 10)" fill="#7D7D7D"/>
</svg>`,

}

export type RTxtIconType=keyof typeof rTxtIcons;
