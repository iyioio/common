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
    invalidStoreKeyError=11,

    // Http 400 Errors
    badRequest=400,
    unauthorized=401,
    paymentRequired=402,
    forbidden=403,
    notFound=404,
    methodNotAllowed=405,
    notAcceptable=406,
    proxyAuthenticationRequired=407,
    requestTimeout=408,
    conflict=409,
    gone=410,
    lengthRequired=411,
    preconditionFailed=412,
    contentTooLarge=413,
    uRITooLong=414,
    unsupportedMediaType=415,
    rangeNotSatisfiable=416,
    expectationFailed=417,
    misdirectedRequest=421,
    unprocessableContent=422,
    locked=423,
    failedDependency=424,
    tooEarly=425,
    upgradeRequired=426,
    preconditionRequired=428,
    tooManyRequests=429,
    requestHeaderFieldsTooLarge=431,
    unavailableForLegalReasons=451,

    // Http 500 Errors
    internalServerError=500,
    notImplemented=501,
    badGateway=502,
    serviceUnavailable=503,
    gatewayTimeout=504,
    hTTPVersionNotSupported=505,
    variantAlsoNegotiates=506,
    insufficientStorage=507,
    loopDetected=508,
    networkAuthenticationRequired=511

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

export class NotImplementedError extends BaseError
{
    public constructor(message?:string)
    {
        super(ErrorType.notImplemented,message);
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

export class InvalidStoreKeyError extends BaseError
{
    public constructor(message?:string)
    {
        super(ErrorType.invalidStoreKeyError,message);
    }
}

export class BadRequestError extends BaseError
{
    public constructor(message?:string)
    {
        super(ErrorType.badRequest,message);
    }
}

export class NotFoundError extends BaseError
{
    public constructor(message?:string)
    {
        super(ErrorType.notFound,message);
    }
}

export class UnauthorizedError extends BaseError
{
    public constructor(message?:string)
    {
        super(ErrorType.unauthorized,message);
    }
}

export class InternalServerError extends BaseError
{
    public constructor(message?:string)
    {
        super(ErrorType.internalServerError,message);
    }
}
