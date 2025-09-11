import { useRouteQuery } from "@iyio/react-common";
import dynamic from "next/dynamic";
import Head from "next/head";

const ProtogenView:any=dynamic(()=>import('../components/ProtogenView.js') as any,{ssr:false});

export default function Config()
{

    const {config}=useRouteQuery();

    if(!config){
        return null;
    }

    return (
        <div className="Config">

            <Head>
                <title>{config}</title>
            </Head>

            <ProtogenView
                enablePanZoom
                url={`/api/protogen/${config.replace(/\W/g,'')}`} />

            <style jsx>{`
                .Config{
                    display:flex;
                    flex-direction:column;
                    flex:1;
                }
            `}</style>
        </div>
    )

}
