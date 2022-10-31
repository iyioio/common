import { DisposeContainer, IDisposable, IInit, ReadonlySubject, SymStrHashMap } from "@iyio/common";
import { BehaviorSubject } from "rxjs";
import { UserAuthProviderData } from "./auth-types";



export class User implements IDisposable, IInit
{
    public readonly id:string;

    private readonly _name:BehaviorSubject<string>;
    public get nameSubject():ReadonlySubject<string>{return this._name}
    public get name(){return this._name.value}

    public readonly data:SymStrHashMap;
    public readonly providerData:UserAuthProviderData;

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    protected readonly disposables:DisposeContainer=new DisposeContainer();

    public constructor(id:string,name:string,providerData:UserAuthProviderData,data:SymStrHashMap={})
    {
        this.id=id;
        this._name=new BehaviorSubject<string>(name);
        this.providerData=providerData;
        this.data=data;
    }

    public init():void|Promise<void>
    {
        // do nothing for now
    }

    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.disposables.dispose();
    }
}
