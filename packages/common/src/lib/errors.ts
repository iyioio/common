export class DisposedError extends Error
{
    public constructor(message:string='disposed')
    {
        super(message);
    }
}
