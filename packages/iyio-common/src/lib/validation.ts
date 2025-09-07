export function isValidEmail(email:string|undefined|null):boolean
{
    if(typeof email !== 'string'){
        return false;
    }
    if(email.includes('..') || email.includes('.@')){
        return false;
    }
    return /^[a-zA-Z0-9_+-][a-zA-Z0-9._'%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/.test(email);
}
