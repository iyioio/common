import { BehaviorSubject } from "rxjs";
import { UserAuthProviderData } from "./auth-types";
import { IDisposable, IInit, SymStrHashMap } from "./common-types";
import { DisposeContainer } from "./DisposeContainer";
import { ReadonlySubject } from "./rxjs-types";

export interface BaseUserOptions
{
    id:string;
    name:string;
    providerData:UserAuthProviderData;
    data?:SymStrHashMap;
}

export class BaseUser implements IDisposable, IInit
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

    public constructor({
        id,
        name,
        providerData,
        data,
    }:BaseUserOptions)
    {
        this.id=id;
        this._name=new BehaviorSubject<string>(name);
        this.providerData=providerData;
        this.data=data??{};
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
