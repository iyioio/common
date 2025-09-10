import { createSeriesQuery, deepCompare, FuncColumn, Query, queryCtrlFactory, Series, SeriesData, SeriesDataQuery } from "@iyio/common";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSubject } from "./rxjs-hooks.js";

interface QueryState
{
    rangeColumn:string;
    sumColumn?:string|null;
    series:Series;
    seriesQueries:Query|Query[];
}

export interface SeriesDataQueryOptions
{
    rangeColumn:string|null|undefined,
    sumColumn?:string|null;
    funcColumn?:FuncColumn|string|null;
    series:Series|null|undefined,
    seriesQueries:Query|Query[]|null|undefined;
}



export const useSeriesDataQuery=(
    {
        rangeColumn,
        sumColumn,
        funcColumn=sumColumn,
        series,
        seriesQueries,
    }:SeriesDataQueryOptions={rangeColumn:null,series:null,seriesQueries:null}
):SeriesData|undefined=>{

    const enabled=seriesQueries?true:false;
    const ctrl=useMemo(()=>enabled?queryCtrlFactory():null,[enabled]);

    const [sq,setSq]=useState<SeriesDataQuery|null>(null);

    const lastStateRef=useRef<QueryState|null>(null);

    useEffect(()=>{
        if(!ctrl){
            setSq(null);
            return;
        }

        if(!rangeColumn || !series || !seriesQueries){
            setSq(null);
            ctrl.query=null;
            return;
        }

        const state={rangeColumn,series,seriesQueries,funcColumn};
        if(lastStateRef.current && deepCompare(lastStateRef.current,state)){
            return;
        }

        const sq=createSeriesQuery(rangeColumn,series,seriesQueries,funcColumn??undefined);
        lastStateRef.current=state;
        setSq(sq);
        ctrl.setLimit(Array.isArray(seriesQueries)?seriesQueries.length:1);
        ctrl.query=sq.query;

    },[ctrl,seriesQueries,series,rangeColumn,funcColumn]);

    const data=useSubject(ctrl?.data);

    return useMemo(()=>(sq && data)?sq.getSeriesData(data):undefined,[sq,data]);
}
