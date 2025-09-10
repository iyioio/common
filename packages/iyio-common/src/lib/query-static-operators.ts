import { asArray } from "./array.js";
import { StaticQueryOperator } from "./query-types.js";

export const sortStaticQuery:StaticQueryOperator={
    orderBy:true,
    op:(newData,query)=>{
        const orderBy=asArray(query.orderBy);
        if(!orderBy){
            return;
        }
        for(const order of orderBy){
            newData.sort((a,b)=>{
                const av=a[order.name];
                const bv=b[order.name];
                if(typeof av === 'number' && typeof bv === 'number'){
                    if(order.desc){
                        return bv-av;
                    }else{
                        return av-bv;
                    }
                }else{
                    if(order.desc){
                        return (bv?.toString()??'').localeCompare(av?.toString??'');
                    }else{
                        return (av?.toString()??'').localeCompare(bv?.toString??'');
                    }
                }
            })
        }
    }
}
