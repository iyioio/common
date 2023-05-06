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
