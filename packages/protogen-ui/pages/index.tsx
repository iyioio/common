import dynamic from "next/dynamic";

const ProtogenView=dynamic(()=>import('../components/ProtogenView'),{ssr:false});

export default function index()
{

    return (
        <div className="index">

            <ProtogenView
                enablePanZoom
                url="/api/protogen" />

            <style jsx>{`
                .index{
                    display:flex;
                    flex-direction:column;
                    flex:1;
                }
            `}</style>
        </div>
    )

}
