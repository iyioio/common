import { createSeriesQuery, deepCompare, Query, queryCtrlFactory, Series, SeriesData, SeriesDataQuery } from "@iyio/common";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSubject } from "./rxjs-hooks";

interface QueryState
{
    rangeColumn:string;
    series:Series;
    seriesQueries:Query|Query[];
}

export interface SeriesDataQueryOptions
{
    rangeColumn:string|null|undefined,
    series:Series|null|undefined,
    seriesQueries:Query|Query[]|null|undefined;
}

export const useSeriesDataQuery=(
    {
        rangeColumn,
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

        const state={rangeColumn,series,seriesQueries};
        if(lastStateRef.current && deepCompare(lastStateRef.current,state)){
            return;
        }

        const sq=createSeriesQuery(rangeColumn,series,seriesQueries);
        lastStateRef.current=state;
        setSq(sq);
        ctrl.setLimit(Array.isArray(seriesQueries)?seriesQueries.length:1);
        ctrl.query=sq.query;

    },[ctrl,seriesQueries,series,rangeColumn]);

    const data=useSubject(ctrl?.data);

    return useMemo(()=>(sq && data)?sq.getSeriesData(data):undefined,[sq,data]);
}
