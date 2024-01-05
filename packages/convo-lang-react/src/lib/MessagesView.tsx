import { atDotCss } from "@iyio/at-dot-css";
import { aryRemoveWhere, cn, containsMarkdownImage, objectToMarkdown, parseMarkdownImages } from "@iyio/common";
import { ConversationUiCtrl, ConvoMessageRenderResult, FlatConvoMessage } from "@iyio/convo-lang";
import { LoadingDots, ScrollView, useSubject } from "@iyio/react-common";
import { Fragment } from "react";
import { useConversationMessages, useConversationTheme, useConversationUiCtrl } from "./convo-lang-react";

const renderResult=(result:ConvoMessageRenderResult,i:number,showSystemMessages:boolean,showFunctions:boolean):any=>{
    if((typeof result !== 'object') || !result){
        return null;
    }
    if(result.component){
        return <Fragment key={i+'comp'}>{result.component}</Fragment>
    }
    return renderMessage({
        role:result.role??'assistant',
        content:result.content
    },i,showSystemMessages,showFunctions)
}

const renderMessage=(m:FlatConvoMessage,i:number,showSystemMessages:boolean,showFunctions:boolean)=>{
    const className=style.msg({user:m.role==='user',other:m.role!=='user'})

    if(m.setVars && (m.role==='result' || showSystemMessages)){
        const keys=Object.keys(m.setVars);
        aryRemoveWhere(keys,k=>k.startsWith('__'));
        if(!keys.length){
            return null;
        }
        let firstValue=m.setVars[keys[0]??''];
        if(keys.length===1 && Array.isArray(firstValue) && firstValue.length===1){
            firstValue=firstValue[0];
        }
        const singleItem=keys.length===1 && firstValue && (typeof firstValue==='object');
        return (
            <div className={cn(className,style.data())} key={i}>
                <div className={style.table({singleItem})}>
                    {keys.map((k,ki)=>{

                        const value=ki===0?firstValue:(m.setVars?.[k]);

                        return (
                            <Fragment key={k+'r'}>
                                <div>{k}</div>
                                {!singleItem && <div>-</div>}
                                <div>{k[0]===k[0]?.toLowerCase()?
                                    objectToMarkdown(value)
                                :
                                    JSON.stringify(value,null,4)
                                }</div>
                            </Fragment>
                        )
                    })}
                </div>
            </div>
        )
    }else if(m.fn || (m.role!=='user' && m.role!=='assistant')){
        if(showSystemMessages && m.role==='system'){
            return (
                <div className={className} key={i+'s'}>
                    {m.content}
                </div>
            )
        }else if(showFunctions && ( m.fn || m.called)){
            return (
                <div className={className} key={i+'f'}>
                    {JSON.stringify(m,null,4)}
                </div>
            )
        }
        return null;
    }


    if(m.content && containsMarkdownImage(m.content)){

        const parts=parseMarkdownImages(m.content);

        return (<Fragment key={i+'f'}>{
            parts.map((p,pi)=>p.image?(
                <img
                    className={style.img({user:m.role==='user',other:m.role!=='user'})}
                    key={i}
                    alt={p.image.description}
                    src={p.image.url}
                />
            ):(
                <div className={className} key={pi}>
                    {p.text}
                </div>
            ))
    }</Fragment>)

    }else{

        return (
            <div className={className} key={i+'d'}>
                {m.content}
            </div>
        )
    }
}

export interface MessagesViewProps
{
    ctrl?:ConversationUiCtrl;
}

export function MessagesView({
    ctrl:_ctrl,
}:MessagesViewProps){

    const ctrl=useConversationUiCtrl(_ctrl)

    const messages=useConversationMessages(_ctrl);

    const theme=useConversationTheme(_ctrl);

    const currentTask=useSubject(ctrl?.currentTaskSubject);

    const showSystemMessages=useSubject(ctrl.showSystemMessagesSubject);
    const showFunctions=useSubject(ctrl.showFunctionsSubject);

    const mapped=messages.map((m,i)=>{

        const ctrlRendered=ctrl.renderMessage(m,i);
        if(ctrlRendered===false){
            return null;
        }

        if(ctrlRendered?.position==='replace'){
            return renderResult(ctrlRendered,i,showSystemMessages,showFunctions);
        }

        const rendered=renderMessage(m,i,showSystemMessages,showFunctions);
        if(!ctrlRendered){
            return rendered;
        }

        return (
            <Fragment key={i+'j'}>
                {ctrlRendered.position==='before' && renderResult(ctrlRendered,i,showSystemMessages,showFunctions)}
                {rendered}
                {ctrlRendered.position==='after' && renderResult(ctrlRendered,i,showSystemMessages,showFunctions)}
            </Fragment>
        )


    })

    return (
        <div className={style.root()} style={style.vars(theme)}>
            <ScrollView flex1 autoScrollEnd>
                <div className={style.list()}>

                    {mapped}

                    {!!currentTask && <div className={style.msg({other:true})}>
                        <LoadingDots/>
                    </div>}

                </div>
            </ScrollView>
        </div>
    )

}

const style=atDotCss({name:'MessagesView',css:`
    @.root{
        flex:1;
        display:flex;
        flex-direction:column;
    }

    @.list{
        display:flex;
        flex-direction:column;
        gap:@@gap;
        padding:@@padding @@padding 60px @@padding;
    }
    @.msg{
        padding: 10px 14px;
        border-radius:18px;
        white-space:pre-wrap;
    }
    @.msg.user{
        background-color:#4F92F7;
        margin-left:4rem;
        align-self:flex-end;
    }
    @.msg.other{
        background-color:#3B3B3D;
        border: 1px solid rgba(255, 255, 255, 0.11);
        margin-right:4rem;
        align-self:flex-start;
    }

    @.img{
        border-radius:18px;
        max-width:80%;
    }
    @.img.user{
        margin-left:4rem;
        align-self:flex-end;
    }
    @.img.other{
        margin-right:4rem;
        align-self:flex-start;
    }

    @.data{
        background-color:#3B3B3D99 !important;
        font-size:0.8rem;
        padding:0.5rem;
    }
    @.table{
        display:grid;
        grid-template-columns:auto auto 1fr;
    }
    @.table.singleItem{
        display:flex;
        flex-direction:column;
    }
    @.table > *{
        padding:0.5rem 0.25rem;
        border-bottom:1px solid #ffffff33;
        align-items:center;
        display:flex;
    }
    @.table > *:nth-last-child(-n+3){
        border-bottom:none;
    }
    @.table.singleItem > *:first-child{
        font-size:1rem;
        font-weight:bold;
        padding-bottom:0;
    }
`});
