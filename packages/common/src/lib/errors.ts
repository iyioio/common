export enum ErrorType{
    unknown=1,
    disposed=2,
    canceled=3,
    unsupported=4,
    configValueNotFound=5,
    dependencyNotFound=6,
    invalidOverloadCall=7,
    typeProviderNotFoundError=8,
    scopeInited=9,
    httpBaseUrlPrefixNotFoundError=10,
}

export abstract class BaseError extends Error
{
    public readonly cErrT:ErrorType;

    public constructor(type:ErrorType,message?:string)
    {
        super(ErrorType[type]+(message?' - '+message:''));
        this.cErrT=type;
    }
}

export class DisposedError extends BaseError
{
    public constructor(message?:string)
    {
        super(ErrorType.disposed,message);
    }
}

export class CanceledError extends BaseError
{
    public constructor(message?:string)
    {
        super(ErrorType.canceled,message);
    }
}

export class UnsupportedError extends BaseError
{
    public constructor(message?:string)
    {
        super(ErrorType.unsupported,message);
    }
}

export class ConfigValueNotFoundError extends BaseError
{
    public constructor(message?:string)
    {
        super(ErrorType.configValueNotFound,message);
    }
}

export class DependencyNotFoundError extends BaseError
{
    public constructor(message?:string)
    {
        super(ErrorType.dependencyNotFound,message);
    }
}

export class InvalidOverloadCallError extends BaseError
{
    public constructor(message?:string)
    {
        super(ErrorType.invalidOverloadCall,message);
    }
}


export class TypeProviderNotFoundError extends BaseError
{
    public constructor(message?:string)
    {
        super(ErrorType.typeProviderNotFoundError,message);
    }
}

export class ScopeInitedError extends BaseError
{
    public constructor(message?:string)
    {
        super(ErrorType.scopeInited,message);
    }
}

export class HttpBaseUrlPrefixNotFoundError extends BaseError
{
    public constructor(message?:string)
    {
        super(ErrorType.httpBaseUrlPrefixNotFoundError,message);
    }
}
