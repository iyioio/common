import { strHashBase64 } from './string-hashing';

describe('string-hashing',()=>{

    it('should hash base64',()=>{

        const abcHash=strHashBase64('abc')
        expect(abcHash).toBe('YQAAAGIAAABjAAAA');

        expect(abcHash).toBe(strHashBase64('abc'));

        expect(abcHash).not.toBe(strHashBase64('zbc'));

    })
})
