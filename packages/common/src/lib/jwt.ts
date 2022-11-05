export const parseJwt=(token:string)=>{
    try{
        const base64Url=token.split('.')[1];
        const base64=base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload=decodeURIComponent(Buffer.from(base64,'base64').toString().split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    }catch{
        return null;
    }
}

/**
 * Provides a JWT for a given url or undefine if the provider does not have a token for the uri
 */
export type JwtProvider=(uri:string)=>string|undefined;
