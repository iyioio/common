import { aryRemoveItem, getSubstringCount, joinPaths } from "@iyio/common";
import { ProtoPipelineConfigurablePlugin, protoFormatTsComment } from "@iyio/protogen";
import { z } from "zod";

const supportedTypes=['screen'];

const NextJsPagePluginConfig=z.object(
{
    /**
     * Fallback path to pages dir
     * @default "pages"
     */
    nextJsPageFallbackDir:z.string().optional()
})

export const nextJsPagePlugin:ProtoPipelineConfigurablePlugin<typeof NextJsPagePluginConfig>=
{
    configScheme:NextJsPagePluginConfig,
    generate:async ({
        outputs,
        log,
        nodes,
        metadata
    },{
        nextJsPageFallbackDir="pages"
    })=>{

        const supported=nodes.filter(n=>supportedTypes.some(t=>n.types.some(nt=>nt.type===t)));

        log(`${supported.length} supported node(s)`);
        if(!supported.length){
            return;
        }


        for(const node of supported){

            const appNode=node.children?.['app'];

            const appName=nodes.find(n=>n.name===appNode?.type)?.children?.['name']?.value??appNode?.type;

            const pagesDir=appName?metadata['screens-path-'+appName]:nextJsPageFallbackDir;
            if(!pagesDir){
                throw new Error('Unable to determine pages dir for screen. Try setting the app prop')
            }

            const name=node.name.endsWith('Screen')?node.name.substring(0,node.name.length-("Screen".length)):node.name;

            const route='/'+(
                (node.children?.['route']?.value??name)
                    .replace(/\\/g,'/')
                    .replace(/\.{2,}/g,'')
                    .replace(/\/{2,}/g,'/')
                    .replace(/^\/*/g,'')
                    .replace(/\/*$/g,'')
                ||'index'
            )

            const out:string[]=[];

            out.push(`import { Page } from "${new Array(getSubstringCount(route,'/')).fill('..').join('/')}/components/Page"`);

            if(node.comment){
                out.push(...protoFormatTsComment(node.comment,'').split('\n'))
            }
            out.push(
`export default function ${name}()
{

    return (
        <Page>
            ${name} _🚧
        </Page>
    )

}`)
            const filePath=joinPaths(pagesDir,route+'.tsx');
            const existing=outputs.filter(o=>o.path===filePath);
            for(const e of existing){
                aryRemoveItem(outputs,e);
            }

            outputs.push({
                path:filePath,
                content:out.join('\n'),
                autoMerge:true,
            })

        }


    }
}
