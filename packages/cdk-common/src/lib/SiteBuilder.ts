import { Construct } from "constructs";
import { ManagedProps, getDefaultManagedProps } from "./ManagedProps";
import { StaticWebSite, StaticWebSiteProps } from "./StaticWebSite";

export interface SiteBuilderProps
{
    sites:SiteInfo[];
    managed?:ManagedProps;
}

export interface SiteInfo
{
    name:string;
    redirectHandler?:string;
    staticSite?:StaticWebSiteProps;
    modify?:(info:SiteInfo)=>void;
}

export interface SiteResult
{
    info:SiteInfo;
    staticSite?:StaticWebSite;
}

export class SiteBuilder extends Construct
{
    public readonly sites:SiteResult[];

    public constructor(scope:Construct, name:string, {
        sites,
        managed=getDefaultManagedProps(),
    }:SiteBuilderProps)
    {

        super(scope,name);

        const {
            params,
            siteContentSources,
            fns,
            resources,
        }=managed;

        const results:SiteResult[]=[];

        for(const info of sites){

            const sources=siteContentSources?.filter(s=>s.targetSiteName===info.name)??[];
            if((sources.length || info.redirectHandler) && info.staticSite){
                const useHandler=(info.redirectHandler && fns)?true:false;
                const redirectHandler=useHandler?fns?.find(f=>f.name===info.redirectHandler):undefined;
                if(useHandler && !redirectHandler){
                    throw new Error(`No redirect handler function found for site. site:${info.name}, handler:${info.redirectHandler}`)
                }
                info.staticSite={
                    redirectHandler,
                    ...info.staticSite,
                    additionalSources:[
                        ...(info.staticSite.additionalSources??[]),
                        ...sources
                    ]
                }
            }

           info.modify?.(info);

            const staticSite=info.staticSite?new StaticWebSite(this,info.name,info.staticSite,managed):undefined;
            if(staticSite && params){
                params.addConsumer(staticSite);
            }

            results.push({
                info,
                staticSite,
            })

            resources.push({name:info.name,staticWebsite:staticSite})

        }

        this.sites=results;
    }
}
