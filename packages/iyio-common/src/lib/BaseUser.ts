import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { DisposeContainer } from "./DisposeContainer";
import { AuthProvider, UserAuthProviderData } from "./auth-types";
import { IDisposable, IInit, SymStrHashMap } from "./common-types";
import { deepCompare } from "./object";
import { ReadonlySubject } from "./rxjs-types";

export interface BaseUserOptions
{
    id:string;
    name:string;
    email?:string;
    phoneNumber?:string;
    providerData:UserAuthProviderData;
    data?:SymStrHashMap;
    provider:AuthProvider;
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

    private readonly _claims:BehaviorSubject<Record<string,any>>=new BehaviorSubject<Record<string,any>>({});
    public get claimsSubject():ReadonlySubject<Record<string,any>>{return this._claims}
    public get claims(){return this._claims.value}

    public readonly data:SymStrHashMap;
    public readonly providerData:UserAuthProviderData;

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    protected readonly disposables:DisposeContainer=new DisposeContainer();

    private readonly _isInited:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get isInitedSubject():ReadonlySubject<boolean>{return this._isInited}
    public get isInited(){return this._isInited.value}

    public readonly provider:AuthProvider;

    public constructor({
        id,
        name,
        email,
        phoneNumber,
        providerData,
        data,
        provider
    }:BaseUserOptions)
    {
        this.provider=provider;
        this.id=id;
        this._name=new BehaviorSubject<string>(name);
        this._email=new BehaviorSubject<string|null>(email||null);
        this._phoneNumber=new BehaviorSubject<string|null>(phoneNumber||null);
        this.providerData=providerData;
        this.data=data??{};
    }

    public async init():Promise<void>
    {
        if(this._isInited.value){
            return;
        }
        this.updateClaims();
        this._isInited.next(true);
        await this._init();
    }

    protected _init():void|Promise<void>
    {
        // do nothing
    }

    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.disposables.dispose();
    }

    public async updateAsync(update:BaseUserUpdate):Promise<boolean>
    {
        let updated=await this.provider.updateAsync?.(this,update)??false;

        if(update.name && update.name!==this._name.value){
            updated=true;
            this._name.next(update.name);
        }

        return updated;
    }

    public async updateClaims()
    {
        const claims=await this.provider.getClaimsAsync?.(this.providerData)??{};
        if(!deepCompare(claims,this._claims.value)){
            this._claims.next(claims);
        }
    }

    public async getJwtAsync():Promise<string|null>
    {
        return await this.provider.getJwtAsync?.(this.providerData)??null
    }
}
