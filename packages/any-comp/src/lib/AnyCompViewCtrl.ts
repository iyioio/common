import { ReadonlySubject } from "@iyio/common";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { AcComp, AcProp, AcTaggedPropRenderer, AnyCompSaveState } from "./any-comp-types.js";
import { defaultAcPropRenderers } from "./prop-renderers/_default-prop-renderers.js";

export class AnyCompViewCtrl
{
    /**
     * Property values. use the setProp function to change prop values
     */
    public readonly props:Record<string,any>={};

    private readonly _bindings:BehaviorSubject<Record<string,string>>=new BehaviorSubject<Record<string,string>>({});
    public get bindingsSubject():ReadonlySubject<Record<string,string>>{return this._bindings}
    public get bindings(){return this._bindings.value}
    public set bindings(value:Record<string,string>){
        if(value==this._bindings.value){
            return;
        }
        this._bindings.next(value);
    }

    private readonly _onPropChange=new Subject<string>();
    /**
     * Occurs when a property changes or when multiple properties change. If a single prop changes
     * the name of the changed prop is supplied, if multiple props change the value of the subject
     * will be an empty string
     */
    public get onPropChange():Observable<string>{return this._onPropChange}

    private readonly _extraProps:BehaviorSubject<Record<string,any>>=new BehaviorSubject<Record<string,any>>({});
    public get extraPropsSubject():ReadonlySubject<Record<string,any>>{return this._extraProps}
    public get extraProps(){return this._extraProps.value}

    private readonly _extra:BehaviorSubject<string>=new BehaviorSubject<string>("{\n\n}");
    public get extraSubject():ReadonlySubject<string>{return this._extra}
    public get extra(){return this._extra.value}
    public set extra(value:string){
        if(value==this._extra.value){
            return;
        }
        this._extra.next(value);
        try{
            const v=JSON.parse(value);
            if(v && (typeof v === 'object')){
                this._extraProps.next(v);
            }else{
                this._extraProps.next({});
            }
        }catch{
            this._extraProps.next({});
        }
        this.update('');
    }

    private readonly _requiredProps:BehaviorSubject<AcProp[]>=new BehaviorSubject<AcProp[]>([]);
    public get requiredPropsSubject():ReadonlySubject<AcProp[]>{return this._requiredProps}
    public get requiredProps(){return this._requiredProps.value}


    private readonly _computedProps:BehaviorSubject<Record<string,any>>=new BehaviorSubject<Record<string,any>>({});
    public get computedPropsSubject():ReadonlySubject<Record<string,any>>{return this._computedProps}
    public get computedProps(){return this._computedProps.value}

    private readonly _resetKey:BehaviorSubject<number>=new BehaviorSubject<number>(0);
    public get resetKeySubject():ReadonlySubject<number>{return this._resetKey}
    public get resetKey(){return this._resetKey.value}

    private readonly _renderers:BehaviorSubject<AcTaggedPropRenderer[]>=new BehaviorSubject<AcTaggedPropRenderer[]>(defaultAcPropRenderers);
    public get renderersSubject():ReadonlySubject<AcTaggedPropRenderer[]>{return this._renderers}
    public get renderers(){return this._renderers.value}
    public set renderers(value:AcTaggedPropRenderer[]){
        if(value==this._renderers.value){
            return;
        }
        this._renderers.next(value);
    }

    private readonly _showExtra:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get showExtraSubject():ReadonlySubject<boolean>{return this._showExtra}
    public get showExtra(){return this._showExtra.value}
    public set showExtra(value:boolean){
        if(value==this._showExtra.value){
            return;
        }
        this._showExtra.next(value);
    }

    public readonly comp:AcComp;


    public constructor(comp:AcComp){
        this.comp=comp;
    }

    public setProp(name:string,value:any){
        if(this.props[name]===value){
            return;
        }
        if(value===undefined){
            delete this.props[name];
        }else{
            this.props[name]=value;
        }
        this.update(name);
    }

    public setProps(props:Record<string,any>){
        for(const e in this.props){
            delete this.props[e];
        }
        for(const e in props){
            this.props[e]=props[e];
        }
        this.update('');
    }

    private update(propChangeName:string)
    {
        this._computedProps.next({...this.props,...this.extraProps});
        const props=this._computedProps.value;

        const required:AcProp[]=[];
        for(const p of this.comp.props){
            if(!p.o && props[p.name]===undefined){
                required.push(p)
            }
        }
        required.sort((a,b)=>a.name.localeCompare(b.name));
        const current=this._requiredProps.value;
        if(required.length===current.length){
            let match=true;
            for(let i=0;i<required.length;i++){
                const prop=required[i];
                if(prop?.name!==current[i]?.name){
                    match=false;
                    break;
                }
            }
            if(!match){
                this._requiredProps.next(required);
            }
        }else{
            this._requiredProps.next(required);
        }
        this._onPropChange.next(propChangeName);
    }

    private readonly _saved:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get savedSubject():ReadonlySubject<boolean>{return this._saved}
    public get saved(){return this._saved.value}

    private getSaveState():AnyCompSaveState
    {
        return {
            props:this.props,
            extra:this.extra,
            bindings:this.bindings,
        }
    }

    public load(state?:AnyCompSaveState)
    {
        if(!state){
            const json=globalThis.localStorage?.getItem(`any-comp-${this.comp.id}`);
            if(!json){
                return;
            }
            state=JSON.parse(json);
        }
        const {
            props={},
            extra='{\n\n}',
            bindings={}
        }=state??{};

        for(const e in this.props){
            delete this.props[e];
        }
        for(const e in props){
            this.props[e]=props[e];
        }
        for(const e in this.bindings){
            delete this.bindings[e];
        }
        for(const e in bindings){
            this.bindings[e]=bindings[e]??'';
        }
        this._extra.next(extra??'');
        try{
            this._extraProps.next(JSON.parse(extra??''))
        }catch{
            this._extraProps.next({});
        }
        this._saved.next(true);
        this.update('');
        this._resetKey.next(this._resetKey.value+1);
    }

    public save()
    {
        globalThis.localStorage?.setItem(`any-comp-${this.comp.id}`,JSON.stringify(this.getSaveState()));
        this._saved.next(true);
    }

    public clearSaved()
    {
        globalThis.localStorage?.removeItem(`any-comp-${this.comp.id}`);
        this._saved.next(false);
    }

    public reset()
    {
        for(const e in this.props){
            delete this.props[e];
        }
        for(const e in this.bindings){
            delete this.bindings[e];
        }
        this.extra='{\n\n}';
        this._resetKey.next(this._resetKey.value+1);
    }


}
