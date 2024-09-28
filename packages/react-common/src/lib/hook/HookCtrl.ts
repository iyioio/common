import { ProxyChangeDetector } from "@iyio/common";

let nextId=0;

export class HookCtrl{

    public readonly id=++nextId;

    public readonly state:Record<string|symbol,any>;

    public readonly changeDetector:ProxyChangeDetector;

    public constructor()
    {
        const state:Record<string|symbol,any>={};
        const changeDetector=new ProxyChangeDetector({
            target:state,
            maxDepth:30
        })
        this.state=changeDetector.proxy;
        this.changeDetector=changeDetector;
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.changeDetector.dispose();
    }



    /**
     * Copies all of the properties from the props param to the state of the controller. Properties
     * with an undefined value will be deleted form the state of the controller.
     */
    public mergeState(props:Record<string,any>){
        const changed:string[]=[];

        for(const e in props){
            const v=props[e];
            if(this.state[e]===v){
                continue;
            }
            changed.push(e);
            if(v===undefined){
                delete this.state[e];
            }else{
                this.state[e]=v;
            }
        }

        return changed;
    }

    /**
     * Replaces the current state with the given state.
     */
    public stateState(state:Record<string,any>){
        for(const e in this.state){
            delete this.state[e];
        }
        for(const e in state){
            const v=state[e];
            if(v!==undefined){
                state[e]=v;
            }
        }
    }

    /**
     * Sets a single property of the state.
     */
    public stateStateProp(propName:string,value:any){
        if(this.state[propName]===value){
            return false;
        }
        this.state[propName]=value;
        return true;
    }
}
