import { addDays, addHours, addMinutes, addMonths, addSeconds, addWeeks, addYears } from "date-fns";
import { TimeInterval } from "./time-types";

export const secondMs=1000;
export const minuteMs=secondMs*60;
export const hourMs=minuteMs*60;
export const dayMs=hourMs*24;
export const weekMs=dayMs*7;
export const avgMonthMs=dayMs*30;
export const yearMs=dayMs*365;

/**
 * The last date timestamp that should be used for sorting. endDateSort equals 1,000,000,000,000,000
 * which allows for dates up to +033658-09-27T01:46:40.000Z to be used for sorting.
 */
export const endDateSort=1000000000000000;


export const getTimeAny=(date:any,utc?:boolean):number=>
{
    const type=typeof date;

    if(type==='string'){
        if(utc && !(date as string).endsWith('Z') && !(date as string).endsWith('z')){
            date+='Z';
        }
        const d=new Date(date as string).getTime();
        if(Number.isNaN(d)){
            return Number(date);
        }else{
            return d;
        }
    }

    if(type==='number'){
        return date as number;
    }

    if(date && (date as any).getTime){
        try{
            const d=(date as any).getTime();
            if(typeof d === 'number'){
                return d;
            }
        }catch{
            //
        }
    }

    return Number.NaN;
}


export const getTimeZoneOffsetHours=():number=>
{
    return new Date().getTimezoneOffset()/-60;
}

export const defaultTimeZone='America/New_York';

export const getTimeZone=():string=>{
    try{
        return globalThis.Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone??defaultTimeZone;
    }catch{
        return defaultTimeZone;
    }
}
/**
 * Adds time interval b to time interval a. Time interval a is mutated.
 */
export const addTimeIntervals=(a:TimeInterval,b:TimeInterval)=>{
    a.ms=(a.ms??0)+(b.ms??0);
    a.seconds=(a.seconds??0)+(b.seconds??0);
    a.minutes=(a.minutes??0)+(b.minutes??0);
    a.hours=(a.hours??0)+(b.hours??0);
    a.days=(a.days??0)+(b.days??0);
    a.weeks=(a.weeks??0)+(b.weeks??0);
    a.months=(a.months??0)+(b.months??0);
    a.years=(a.years??0)+(b.years??0);

    for(const e in a){
        if(!(a as any)[e]){
            delete (a as any)[e];
        }
    }
}
export const parseTimeInterval=(value:string|number):TimeInterval=>{

    if(typeof value === 'number'){
        return {
            ms:value
        }
    }

    const interval:TimeInterval={}
    const matches=value.replace(/and/gi,' ').matchAll(/(-?[.\d,]+)\s*(\w+)/g);
    for(const match of matches){
        const v=Number(match[1]?.replace(/,/g,'')??'0');
        if(!isFinite(v)){
            continue;
        }
        switch(match[2]?.toLowerCase()){

            case 'm':
            case 'min':
            case 'mins':
            case 'minute':
            case 'minutes':
                if(!interval.minutes){
                    interval.minutes=0;
                }
                interval.minutes+=v;
                break;

            case 'h':
            case 'hr':
            case 'hrs':
            case 'hour':
            case 'hours':
                if(!interval.hours){
                    interval.hours=0;
                }
                interval.hours+=v;
                break;

            case 'd':
            case 'day':
            case 'days':
                if(!interval.days){
                    interval.days=0;
                }
                interval.days+=v;
                break;

            case 'w':
            case 'wk':
            case 'wks':
            case 'week':
            case 'weeks':
                if(!interval.weeks){
                    interval.weeks=0;
                }
                interval.weeks+=v;
                break;

            case 'mon':
            case 'mons':
            case 'month':
            case 'months':
                if(!interval.months){
                    interval.months=0;
                }
                interval.months+=v;
                break;

            case 'y':
            case 'yr':
            case 'yrs':
            case 'year':
            case 'years':
                if(!interval.years){
                    interval.years=0;
                }
                interval.years+=v;
                break;

            case 'ms':
            case 'millisecond':
            case 'milliseconds':
                if(!interval.ms){
                    interval.ms=0;
                }
                interval.ms+=v;
                break;
        }
    }

    return interval;
}

export const addTimeIntervalToDate=(interval:TimeInterval,date:Date|number):Date=>{
    if(interval.ms){
        date=new Date(typeof date==='number'?date:date.getTime()+interval.ms);
    }

    if(interval.seconds){
        date=addSeconds(date,interval.seconds);
    }

    if(interval.minutes){
        date=addMinutes(date,interval.minutes);
    }

    if(interval.hours){
        date=addHours(date,interval.hours);
    }

    if(interval.days){
        date=addDays(date,interval.days);
    }

    if(interval.weeks){
        date=addWeeks(date,interval.weeks);
    }

    if(interval.months){
        date=addMonths(date,interval.months);
    }

    if(interval.years){
        date=addYears(date,interval.years);
    }

    if(typeof date === 'number'){
        date=new Date(date);
    }

    return date;
}

export const getTimestampString=():string=>{
    const d=new Date();

    return `${
        d.getFullYear()
    }-${
        d.getMonth().toString().padStart(2,'0')
    }-${
        d.getDate().toString().padStart(2,'0')
    }T${
        d.getHours().toString().padStart(2,'0')
    }-${
        d.getMinutes().toString().padStart(2,'0')
    }-${
        d.getSeconds().toString().padStart(2,'0')
    }`;
}
