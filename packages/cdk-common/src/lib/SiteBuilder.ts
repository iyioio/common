import { Construct } from "constructs";
import { ManagedProps } from "./ManagedProps";
import { StaticWebSite, StaticWebSiteProps } from "./StaticWebSite";

export interface SiteBuilderProps
{
    sites:SiteInfo[];
    managed?:ManagedProps;
}

export interface SiteInfo
{
    name:string;
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
        managed:{
            params,
            siteContentSources
        }={}
    }:SiteBuilderProps)
    {

        super(scope,name);

        const results:SiteResult[]=[];


        for(const info of sites){

            const sources=siteContentSources?.filter(s=>s.targetSiteName===info.name);
            if(sources?.length && info.staticSite){
                info.staticSite={
                    ...info.staticSite,
                    additionalSources:[
                        ...(info.staticSite.additionalSources??[]),
                        ...sources
                    ]
                }
            }

           info.modify?.(info);

            const staticSite=info.staticSite?new StaticWebSite(this,info.name,info.staticSite):undefined;
            if(staticSite && params){
                params.addConsumer(staticSite);
            }

            results.push({
                info,
                staticSite,
            })

        }

        this.sites=results;
    }
}
