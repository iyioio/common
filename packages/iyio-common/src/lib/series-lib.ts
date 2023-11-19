import { addDays, addMonths, addWeeks, addYears } from "date-fns";
import { asArray } from "./array";
import { HashMap } from "./common-types";
import { deepClone } from "./object";
import { NamedQueryValue, Query, QueryGroupCondition } from "./query-types";
import { getSeriesIntervalCtrl } from "./series-ctrls";
import { AutoSeries, Series, SeriesDataQuery, SeriesRange } from "./series-types";

export const createSeriesQuery=(rangeColumn:string, series:Series, seriesQueries:Query|Query[]):SeriesDataQuery=>{

    if(series?.repeat && !Array.isArray(seriesQueries)){
        const ary:Query[]=[];
        for(let i=0;i<series.repeat;i++){
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
    let offset=0;

    for(let queryIndex=0;queryIndex<seriesQueries.length;queryIndex++){

        const names:string[]=[];
        seriesColNames.push(names);

        for(let rangeIndex=0;rangeIndex<ranges.length;rangeIndex++){
            const range=ranges[rangeIndex] as SeriesRange<any>;
            const sub:Query=deepClone(seriesQueries[queryIndex] as Query);

            const condition:QueryGroupCondition={
                op:'and',
                conditions:[
                    {
                        left:{col:{name:rangeColumn}},
                        op:'>=',
                        right:{value:range.start+offset}
                    },
                    {
                        left:{col:{name:rangeColumn}},
                        op:'<=',
                        right:{value:range.end+offset}
                    },
                ]
            }
            if(sub.condition){
                condition.conditions.push(sub.condition);
            }
            sub.condition=condition;
            sub.columns=[{
                func:'count',
                name:'count'
            }]

            const colName=`c_${queryIndex}_${rangeIndex}`;
            names.push(colName);
            columns.push({
                subQuery:{
                    query:sub
                },
                name:colName
            })
        }

        if(series.offset){
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
            }
        }
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

    return ranges;
}



