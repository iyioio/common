export function isValidEmail(email:string|undefined|null):boolean
{
    if(!email){
        return false;
    }
    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
}
