import { apiBaseUrlParam } from "./http.deps";
import { HttpClient } from "./HttpClient";
import { createScope } from "./scope-lib";

describe('HttpClient',()=>{

    it('should apply base url',()=>{

        const apiUrl='https://api.example.com/';

        const client=new HttpClient({baseUrlPrefix:'@',baseUrlMap:{
            api:apiUrl
        }});

        expect(client.applyBaseUrl('@api/ok')).toBe(apiUrl+'ok');
    })

    it('should apply base url with no slash',()=>{

        const apiUrl='https://api.example.com';

        const client=new HttpClient({baseUrlPrefix:'@',baseUrlMap:{
            api:apiUrl
        }});

        expect(client.applyBaseUrl('@api/ok')).toBe(apiUrl+'/ok');
    })

    it('should apply base url using scope',()=>{

        const apiUrl='https://api.example.com/';

        const scope=createScope(reg=>{
            reg.addParams({
                [apiBaseUrlParam.typeName]:apiUrl
            })
        })

        const client=HttpClient.fromScope(scope);

        expect(client.applyBaseUrl('@api/ok')).toBe(apiUrl+'ok');
    })
})
