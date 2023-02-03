import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { UserAuthProviderData } from "./auth-types";
import { IDisposable, IInit, SymStrHashMap } from "./common-types";
import { DisposeContainer } from "./DisposeContainer";
import { ReadonlySubject } from "./rxjs-types";

export interface BaseUserOptions
{
    id:string;
    name:string;
    email?:string;
    phoneNumber?:string;
    providerData:UserAuthProviderData;
    data?:SymStrHashMap;
}

export interface BaseUserUpdate
{
    name?:string;
    /**
     * Undefined values will be deleted
     */
    data?:SymStrHashMap;
}

export class BaseUser implements IDisposable, IInit
{
    public readonly id:string;

    private readonly _name:BehaviorSubject<string>;
    public get nameSubject():ReadonlySubject<string>{return this._name}
    public get name(){return this._name.value}

    private readonly _email:BehaviorSubject<string|null>;
    public get emailSubject():ReadonlySubject<string|null>{return this._email}
    public get email(){return this._email.value}

    private readonly _phoneNumber:BehaviorSubject<string|null>;
    public get phoneNumberSubject():ReadonlySubject<string|null>{return this._phoneNumber}
    public get phoneNumber(){return this._phoneNumber.value}

    public readonly data:SymStrHashMap;
    public readonly providerData:UserAuthProviderData;

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    protected readonly disposables:DisposeContainer=new DisposeContainer();

    public constructor({
        id,
        name,
        email,
        phoneNumber,
        providerData,
        data,
    }:BaseUserOptions)
    {
        this.id=id;
        this._name=new BehaviorSubject<string>(name);
        this._email=new BehaviorSubject<string|null>(email||null);
        this._phoneNumber=new BehaviorSubject<string|null>(phoneNumber||null);
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
