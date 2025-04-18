import { addDays, addMonths, addWeeks, addYears } from "date-fns";
import { asArray } from "./array";
import { HashMap } from "./common-types";
import { deepClone } from "./object";
import { FuncColumn, NamedQueryValue, Query, QueryCondition, QueryGroupCondition } from "./query-types";
import { getSeriesIntervalCtrl } from "./series-ctrls";
import { AutoSeries, Series, SeriesData, SeriesDataQuery, SeriesRange } from "./series-types";
import { buildQuery } from "./sql-query-builder";

export const createSeriesQuery=(
    rangeColumn:string,
    series:Series,
    seriesQueries:Query|Query[],
    funcColumn?:FuncColumn|string
):SeriesDataQuery=>{

    if(typeof funcColumn === 'string'){
        funcColumn={
            func:'sum',
            name:'count',
            col:funcColumn
        }
    }

    const repeatAry=Array.isArray(series.repeat)?series.repeat:undefined;

    if(series?.repeat && !Array.isArray(seriesQueries)){
        const ary:Query[]=[];
        const l=Array.isArray(series.repeat)?series.repeat.length+1:series.repeat;
        for(let i=0;i<l;i++){
            ary.push(seriesQueries);
        }
        seriesQueries=ary;
    }

    seriesQueries=asArray(seriesQueries);

    const ranges=series.ranges??(series.auto?autoSeriesToRanges(series.auto):[]);

    const columns:NamedQueryValue[]=[];
    const query:Query={
        columns,
        limit:seriesQueries.length
    }

    const seriesColNames:string[][]=[];
    const allRanges:SeriesRange[][]=[];
    let offset=0;
    const rangeType=series.rangeType??'<=>';

    if(series.debug){
        console.info(
            'createSeriesQuery - before main loop',
            {seriesQueriesLength:seriesQueries.length,seriesQueries}
        );
    }

    for(let queryIndex=0;queryIndex<seriesQueries.length;queryIndex++){

        const names:string[]=[];
        seriesColNames.push(names);

        if(series.debug){
            console.info(
                'createSeriesQuery - before inner loop',
                {queryIndex,rangesLength:ranges.length,ranges}
            );
        }

        for(let rangeIndex=0;rangeIndex<ranges.length;rangeIndex++){
            const range=ranges[rangeIndex] as SeriesRange<any>;

            let sub:Query=deepClone(seriesQueries[queryIndex] as Query);

            if(series.debug){
                console.info(
                    'inner loop'
                );
            }

            if(series.debug&&(typeof sub.table!=='string')){
                console.info(
                    '--- before updated ---\n',
                    sub,
                    '\nColumns',
                    sub.columns,
                    '\nTable Columns',
                    sub.table?.columns,
                    '\n',
                    buildQuery(sub),
                );
            }

            const conditions:QueryCondition[]=[];
            const startCond:QueryCondition={
                left:{col:{name:rangeColumn}},
                op:(rangeType==='<=>' || rangeType==='>=')?'>=':'>',
                right:{value:range.start+offset}
            }
            const endCond:QueryCondition={
                left:{col:{name:rangeColumn}},
                op:(rangeType==='<=>' || rangeType==='<=')?'<=':'<',
                right:{value:range.end+offset}
            }

            if(rangeType==='<=>' || rangeType==='<>'){
                conditions.push(startCond);
                conditions.push(endCond);
            }else if(rangeType==='<' || rangeType==='<='){
                conditions.push(endCond);
            }else{
                conditions.push(startCond);
            }

            const condition:QueryGroupCondition={
                op:'and',
                conditions
            }
            if(sub.condition){
                condition.conditions.push(sub.condition);
            }
            sub.condition=condition;

            const cols:NamedQueryValue[]=[funcColumn?{
                func:funcColumn.func,
                col:{name:funcColumn.col},
                name:funcColumn.name
            }:{
                func:'count',
                name:'count',
            }];

            if(sub.columns){
                sub={
                    columns:cols,
                    table:sub
                }
            }else{
                sub.columns=cols;
            }

            if(series.debug&&(typeof sub.table!=='string')){
                console.info(
                    '--- after updated ---\n',
                    sub,
                    '\nColumns',
                    sub.columns,
                    '\nTable Columns',
                    sub.table?.columns,
                    '\n',
                    buildQuery(sub),
                );
            }

            const colName=`c_${queryIndex}_${rangeIndex}`;
            names.push(colName);
            columns.push({
                subQuery:{
                    query:sub
                },
                name:colName
            })
        }


    allRanges.push(
        ranges.map(r => ({
          ...r,
          start: r.start + offset,
          end: r.end + offset
        }))
      );
        if(repeatAry){
            offset=(repeatAry[queryIndex]??0)-(ranges[0]?.start??0);
        }else if(series.offset){
            const first=ranges[0];
            const last=ranges[ranges.length-1];
                if(first && last && ranges.length>1){

                if(series.offset===true){
                    offset+=last.end-first.start;
                }else{
                    const start=new Date(first.start).getTime();
                    const qi=queryIndex+1;
                    const mul=series.offsetMultiplier??1;
                    switch(series.offset){

                        case 'day':
                            offset=addDays(start,-qi*mul).getTime();
                            offset-=start;
                            break;

                        case 'week':
                            offset=addWeeks(start,-qi*mul).getTime();
                            offset-=start;
                            break;

                        case 'month':
                            offset=addMonths(start,-qi*mul).getTime();
                            offset-=start;
                            break;

                        case 'year':
                            offset=addYears(start,-qi*mul).getTime();
                            offset-=start;
                            break;
                    }
                }
            }
        }
    }

    return {
        query,
        getSeriesData(rows:HashMap[]){
            const labels:string[]=ranges.map((r,i)=>r.name??'column-'+i);
            const series:number[][]=[];

            const timestamps: number[][] = allRanges.map(rngs => rngs.map(r => r.start));

            for(let rowI=0;rowI<seriesColNames.length;rowI++){
                const nameRow=seriesColNames[rowI] as string[];
                const s:number[]=[];
                series.push(s);
                const data=rows[0];
                if(!data){
                    break;
                }
                for(let colI=0;colI<nameRow.length;colI++){
                    s.push(Number(data[nameRow[colI] as string]));
                }

            }

            return {
                labels,
                series,
                timestamps
            }
        },
    }

}

/*
select
                                      |-------------------range--------------------------- |     |
 query a -- (select count(*) from "Events" where "d" >= '2022-01-01' AND "d" <= '2022-01-31T23:59:59' and (source condition A)) as "A_Jan",
 query a -- (select count(*) from "Events" where "d" >= '2022-02-01' AND "d" <= '2022-02-28T23:59:59') as                            "A_Fed",
 query a -- (select count(*) from "Events" where "d" >= '2022-10-01' AND "d" <= '2022-10-31T23:59:59') as                            "A_Oct",

 query b -- (select count(*) from "Events" where ("d" >= '2022-01-01' AND "d" <= '2022-01-31T23:59:59') and (source condition A)) as "B_Jan",
 query b -- (select count(*) from "Events" where "d" >= '2022-02-01' AND "d" <= '2022-02-28T23:59:59') as                            "B_Fed",
 query b -- (select count(*) from "Events" where "d" >= '2022-10-01' AND "d" <= '2022-10-31T23:59:59') as                            "B_Oct"
*/

export const autoSeriesToRanges=(auto:AutoSeries):SeriesRange[]=>{

    const ctrl=getSeriesIntervalCtrl(auto.type,auto.format,auto.useNumbers);

    const ranges:SeriesRange[]=[];

    const count=auto.count??4;

    let current:any=auto.start??ctrl.getDefault(-Math.max(0,count-1));

    for(let i=0;i<count;i++){

        ranges.push(ctrl.getRange(current));

        current=ctrl.add(current,1);

    }

      if (auto.labelInterval && auto.labelInterval > 1 && ranges !== undefined) {

        if (auto.type === 'day') {
            let firstDayOfWeekIndex = -1;
            for (let i = 0; i < ranges.length; i++) {
                const date = new Date(ranges[i]?.start);

                if (date.getDay() === 0 || firstDayOfWeekIndex === -1) {
                    firstDayOfWeekIndex = i;
                    break;
                }
            }

            if (firstDayOfWeekIndex !== -1) {
                for (let i = 0; i < ranges.length; i++) {
                    if (ranges[i] !== undefined && ranges[i]?.name !== undefined) {
                        ranges[i]!.name = "";
                    }
                }
            } else {
                for (let i = 0; i < ranges.length; i++) {
                    if (i % auto.labelInterval !== 0) {
                        if (ranges[i] !== undefined && ranges[i]?.name !== undefined) {
                            ranges[i]!.name = "";
                        }
                    }
                }
            }
        }
    }

    return ranges;
}




export interface DataDiff{
    diff:number;
    current:number;
    prev?:number;
    percent?:number;
}

export const getSeriesDiff=(data:SeriesData):DataDiff=>{
    let current:number|undefined=undefined;
    let prev:number|undefined=undefined;
    if(data.series.length===0){
        return {
            diff:0,
            current:0,
        };
    }else if(data.series.length===1){
        const p=data.series[0];
        if(p && p.length>1){
            current=p[p.length-1];
            prev=p[p.length-2];
        }else{
            current=p?.[0];
        }
    }else if(data.series.length>1){
        const c=data.series[0];
        const p=data.series[1];
        if(p && c){
            current=c[c.length-1];
            prev=p[p.length-1];
        }
    }

    if(current===undefined){
        return {
            diff:0,
            current:0,
        }
    }

    if(prev===undefined){
        return {
            diff:0,
            current,
        }
    }

    const diff=current-prev;
    return {
        diff,
        current,
        prev,
        percent:current===diff?0:((diff/prev)||0),
    }
}


