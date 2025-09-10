import { addQueryCondition, deepClone, deepCompare, Query, QueryConditionOrGroup, queryCtrlFactory, SeriesData } from "@iyio/common";
import { useEffect, useMemo, useRef } from "react";
import { useSubject } from "./rxjs-hooks.js";

interface QueryState
{
    lc:string,
    vc:string,
    start?:number|string;
    end?:number|string;
    query:Query;
    rangeColumn?:string;
}

export interface DataQueryOptions
{
    labelColumn?:string|null;
    valueColumn?:string|null;
    query?:Query|null;
    start?:number|string;
    end?:number|string;
    rangeColumn?:string;
    fallbackLabel?:string|((item:any)=>string|null|undefined);
}

export const useDataQuery=(
    {
        labelColumn,
        valueColumn,
        query,
        fallbackLabel,
        start,
        end,
        rangeColumn,
    }:DataQueryOptions={}
):SeriesData|undefined=>{

    const enabled=query?true:false;

    const ctrl=useMemo(()=>enabled?queryCtrlFactory():null,[enabled]);
    const data=useSubject(ctrl?.data);

    const vc=valueColumn??query?.columns?.[0]?.name;
    const lc=labelColumn??query?.columns?.[1]?.name;

    const lastStateRef=useRef<QueryState|null>(null);

    const fallbackRef=useRef(fallbackLabel);
    fallbackRef.current=fallbackLabel;

    useEffect(()=>{
        if(!ctrl){
            lastStateRef.current=null;
            return;
        }

        if(!query || !vc || !lc){
            ctrl.query=null;
            lastStateRef.current=null;
            return;
        }


        const state={query,vc,lc,start,rangeColumn,end};
        if(lastStateRef.current && deepCompare(lastStateRef.current,state)){
            return;
        }

        if(rangeColumn && (start!==undefined || end!==undefined)){
            let cond:QueryConditionOrGroup;
            if(end===undefined){
                cond={
                    left:{col:{name:rangeColumn}},
                    op:'>=',
                    right:{value:start}
                }
            }else if(start===undefined){
                cond={
                    left:{col:{name:rangeColumn}},
                    op:'<=',
                    right:{value:end}
                }
            }else{
                cond={
                    op:'and',
                    conditions:[
                        {
                            left:{col:{name:rangeColumn}},
                            op:'>=',
                            right:{value:start}
                        },
                        {
                            left:{col:{name:rangeColumn}},
                            op:'<=',
                            right:{value:end}
                        },
                    ]
                }
            }
            query=deepClone(query);
            addQueryCondition(query,cond,'and');
        }

        lastStateRef.current=state;
        ctrl.query=query;

    },[ctrl,query,vc,lc,start,rangeColumn,end]);


    return useMemo<SeriesData|undefined>(()=>{
        if(!data || !vc || !lc){
            //setSq(null);
            return undefined;
        }

        const labels:string[]=[];
        const values:number[]=[];

        for(let i=0;i<data.length;i++){
            const item=data[i];
            if(!item){continue}
            labels.push(
                item[lc]?.toString()??
                (typeof fallbackRef.current === 'function'?fallbackRef.current(item):fallbackRef.current)??
                ('col-'+(i+1)));
            values.push(Number(item[vc])||0);
        }

        return {
            labels,
            series:[values],
            timestamps:[],
        }

    },[data,vc,lc]);
}
