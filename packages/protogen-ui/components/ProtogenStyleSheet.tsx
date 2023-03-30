import { dt } from "../lib/lib-design-tokens";


export default function ProtogenStyleSheet()
{
    return (
        <style global jsx>{`
            html {
                -webkit-text-size-adjust: 100%;
                font-family: ${dt().fontFamily}, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
                    Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif,
                    Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
                font-size:${dt().fontSize}
                line-height: 1.5;
                tab-size: 4;
                scroll-behavior: smooth;
            }
            body {
                font-family: inherit;
                line-height: inherit;
                color:${dt().fontColor};
                background:${dt().bgColor};
            }
            body,html,#__next,main{
                width:100%;
                height:100%;
                margin:0;
                padding:0;
                overflow:hidden;
                overflow:clip;
            }
            main{
                display:flex;
                flex-direction:column;
            }

            h1,h2,h3,h4,h5,h6,p{
                margin:0;
            }

            .node-container{
                background:${dt().entityBgColor};
                box-shadow:0 0 8px #00000033;
                backdrop-filter: blur(3px);
            }

            .min-button{
                border:none;
                border-radius:4px;
                background:transparent;
                padding:4px;
                color:${dt().mutedColor}99;
                font-weight:bold;
                transition:opacity 0.1s ease-in-out;
                cursor:pointer;
            }
            .min-button:active, .min-button.active{
                color:${dt().mutedColor};
            }


        `}</style>
    )
}
