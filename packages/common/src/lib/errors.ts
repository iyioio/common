export enum ErrorType{
    unknown=1,
    disposed=2,
    canceled=3,
    unsupported=4,
}

export abstract class BaseError extends Error
{
    public readonly cErrT:ErrorType;

    public constructor(type:ErrorType,message?:string)
    {
        super(message??ErrorType[type]);
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
