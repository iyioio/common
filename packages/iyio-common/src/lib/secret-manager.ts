export interface SecretManager
{
    getSecretAsync(name:string,cache:boolean):Promise<string|undefined>;

    getSecretTAsync<T>(name:string,cache:boolean):Promise<T|undefined>;

    requireSecretAsync(name:string,cache:boolean):Promise<string>;

    requireSecretTAsync<T>(name:string,cache:boolean):Promise<T>;
}
