import { unescapeHtml } from "./html";

describe('html',()=>{

    it('should unescape HTML',()=>{

        expect(unescapeHtml('')).toBe('');

        expect(unescapeHtml('&amp;')).toBe('&');

        expect(unescapeHtml('&nbsp;')).toBe(' ');

        expect(unescapeHtml('&#x20;')).toBe(' ');

    })

})
