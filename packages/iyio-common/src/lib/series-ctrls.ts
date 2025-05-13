import { addDays, addMonths, addWeeks, addYears, endOfDay, endOfMonth, endOfWeek, endOfYear, format, startOfDay, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import { UnsupportedError } from "./errors";
import { SeriesIntervalCtrl, SeriesRange, SeriesType } from "./series-types";

export class DaySeriesIntervalCtrl implements SeriesIntervalCtrl<Date>
{

    public format:string;

    public constructor(format='E')
    {
        this.format=format;
    }

    public getDefault(offset:number){
        return this.add(startOfDay(new Date()),offset);
    }
    public add(value:Date,count:number):Date{
        return addDays(value,count);
    }
    public getRange(value:Date):SeriesRange<Date>
    {
        const start=startOfDay(value)
        return {
            name:format(start,this.format),
            start,
            end:endOfDay(value)
        }
    }
}

export class WeekSeriesIntervalCtrl implements SeriesIntervalCtrl<Date>
{

    public format:string;

    public constructor(format='do')
    {
        this.format=format;
    }

    public getDefault(offset:number){
        return this.add(new Date(),offset);
    }
    public add(value:Date,count:number):Date{
        return addWeeks(value,count);
    }
    public getRange(value:Date):SeriesRange<Date>
    {
        const start=value
        return {
            name:format(start,this.format),
            start,
            end:endOfWeek(value)
        }
    }
}

export class MonthSeriesIntervalCtrl implements SeriesIntervalCtrl<Date>
{

    public format:string;

    public constructor(format='MMM')
    {
        this.format=format;
    }

    public getDefault(offset:number){
        return this.add(startOfMonth(new Date()),offset);
    }
    public add(value:Date,count:number):Date{
        return addMonths(value,count);
    }
    public getRange(value:Date):SeriesRange<Date>
    {
        const start=startOfMonth(value)
        return {
            name:format(start,this.format),
            start,
            end:endOfMonth(value)
        }
    }
}

export class YearSeriesIntervalCtrl implements SeriesIntervalCtrl<Date>
{

    public format:string;

    public constructor(format='yyyy')
    {
        this.format=format;
    }

    public getDefault(offset:number){
        return this.add(startOfYear(new Date()),offset);
    }
    public add(value:Date,count:number):Date{
        return addYears(value,count);
    }
    public getRange(value:Date):SeriesRange<Date>
    {
        const start=startOfYear(value)
        return {
            name:format(start,this.format),
            start,
            end:endOfYear(value)
        }
    }
}


export class DayMsSeriesIntervalCtrl implements SeriesIntervalCtrl<number>
{

    public format:string;

    public constructor(format='do')
    {
        this.format=format;
    }

    public getDefault(offset:number){
        return this.add(startOfDay(new Date()).getTime(),offset);
    }
    public add(value:number,count:number):number{
        return addDays(value,count).getTime();
    }
    public getRange(value:number):SeriesRange<number>
    {
        const start=startOfDay(value)
        return {
            name:format(start,this.format),
            start:start.getTime(),
            end:endOfDay(value).getTime(),
        }
    }
}

export class WeekMsSeriesIntervalCtrl implements SeriesIntervalCtrl<number>
{

    public format:string;

    public constructor(format='do')
    {
        this.format=format;
    }

    public getDefault(offset:number){
        return this.add(new Date().getTime(),offset);
    }
    public add(value:number,count:number):number{
        return addWeeks(value,count).getTime();
    }
    public getRange(value:number):SeriesRange<number>
    {
        const start=value
        return {
            name:format(start,this.format),
            start:start,
            end:endOfWeek(value).getTime(),
        }
    }
}

export class MonthMsSeriesIntervalCtrl implements SeriesIntervalCtrl<number>
{

    public format:string;

    public constructor(format='MMM')
    {
        this.format=format;
    }

    public getDefault(offset:number){
        return this.add(startOfMonth(new Date()).getTime(),offset);
    }
    public add(value:number,count:number):number{
        return addMonths(value,count).getTime();
    }
    public getRange(value:number):SeriesRange<number>
    {
        const start=startOfMonth(value)
        return {
            name:format(start,this.format),
            start:start.getTime(),
            end:endOfMonth(value).getTime(),
        }
    }
}

export class YearMsSeriesIntervalCtrl implements SeriesIntervalCtrl<number>
{

    public format:string;

    public constructor(format='yyyy')
    {
        this.format=format;
    }

    public getDefault(offset:number){
        return this.add(startOfYear(new Date()).getTime(),offset);
    }
    public add(value:number,count:number):number{
        return addYears(value,count).getTime();
    }
    public getRange(value:number):SeriesRange<number>
    {
        const start=startOfYear(value)
        return {
            name:format(start,this.format),
            start:start.getTime(),
            end:endOfYear(value).getTime(),
        }
    }
}

export const getSeriesIntervalCtrl=(type:SeriesType,format?:string,useNumbers?:boolean):SeriesIntervalCtrl=>{
    switch(type){

        case 'day':
            return useNumbers?new DayMsSeriesIntervalCtrl(format):new DaySeriesIntervalCtrl(format);

        case 'week':
            return useNumbers?new WeekMsSeriesIntervalCtrl(format):new WeekSeriesIntervalCtrl(format);

        case 'month':
            return useNumbers?new MonthMsSeriesIntervalCtrl(format):new MonthSeriesIntervalCtrl(format);

        case 'year':
            return useNumbers?new YearMsSeriesIntervalCtrl(format):new YearSeriesIntervalCtrl(format);

        default:
            throw new UnsupportedError(`Unsupported SeriesType. type = ${type}`);
    }
}
