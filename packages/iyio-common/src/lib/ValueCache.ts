/**
 * A ValueCache stores the return of a function based on a key
 */
export class ValueCache<T=any>
{
    public readonly values:Record<string|symbol,T>={};

    public clear()
    {
        const keys=Object.keys(this.values);
        const symbols=Object.getOwnPropertySymbols(this.values);
        for(const key of keys){
            delete this.values[key];
        }
        for(const key of symbols){
            delete this.values[key];
        }
    }

    public getOrCreate(key:string|symbol,create:(key:string|symbol)=>T):T{
        const value=this.values[key];
        if(value!==undefined){
            return value;
        }
        const v=create(key);
        this.values[key]=v;
        return v;
    }

    public get(key:string|symbol):T|undefined{
        return this.values[key];
    }

    public set(key:string|symbol,value:T){
        this.values[key]=value;
    }

    public remove(key:string|symbol):void{
        delete this.values[key];
    }
}
