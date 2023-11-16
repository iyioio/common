import { HashMap } from "./common-types";
import { Query } from "./query-types";

export interface SeriesData
{
    labels:string[];
    series:number[][];
}

export interface SeriesDataQuery
{
    query:Query;
    getSeriesData(rows:HashMap[]):SeriesData;
}

export interface SeriesRange<T=any>
{
    name?:string;
    start:T;
    end:T;
}

export type SeriesType='day'|'week'|'month'|'year';

export interface AutoSeries
{
    type:SeriesType;
    start?:any;
    count:number;
    format?:string;
    useNumbers?:boolean;
}

export interface Series<T=any>
{
    auto?:AutoSeries;
    ranges?:SeriesRange<T>[];
}

export interface SeriesIntervalCtrl<T=any>
{
    getDefault(offset:number):T;
    add(value:T,count:number):T;
    getRange(value:T):SeriesRange<T>;
}
