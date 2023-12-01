import { parseMarkdownImages } from './markdown-parsing';
import { MarkdownImageParsingItem } from './markdown-types';

describe('markdown-parsing',()=>{

    const expectImages=(items:MarkdownImageParsingItem[],toBe:MarkdownImageParsingItem[])=>{

        expect(items.length).toBe(toBe.length);

        for(let i=0;i<items.length;i++){
            const item=items[i];
            const toBeItem=toBe[i];

            expect(item).not.toBeUndefined();
            expect(toBeItem).not.toBeUndefined();

            expect(item?.text).toBe(toBeItem?.text);

            expect(item?.image?.url).toBe(toBeItem?.image?.url);
            expect(item?.image?.description).toBe(toBeItem?.image?.description);

        }

        expect(items).toEqual(toBe);
    }

    it('should parse empty image',()=>{
        expectImages(parseMarkdownImages('![]()'),[
            {image:{url:''}}
        ])
    });

    it('should parse image',()=>{
        expectImages(parseMarkdownImages('![bob](https://bob.com)'),[
            {image:{url:'https://bob.com',description:'bob'}}
        ])
    });

    it('should parse and trim image',()=>{
        expectImages(parseMarkdownImages(' ![bob](https://bob.com)  '),[
            {image:{url:'https://bob.com',description:'bob'}}
        ])
    });

    it('should parse and not trim image',()=>{
        expectImages(parseMarkdownImages(' ![bob](https://bob.com)  ',{noTrim:true}),[
            {text:' '},
            {image:{url:'https://bob.com',description:'bob'}},
            {text:'  '},
        ])
    });

    it('should parse 2 image',()=>{
        expectImages(parseMarkdownImages(' ![bob](https://bob.com) \n ![tom](https://tom.com)  '),[
            {image:{url:'https://bob.com',description:'bob'}},
            {image:{url:'https://tom.com',description:'tom'}},
        ])
    });

    it('should parse text and images',()=>{
        expectImages(parseMarkdownImages(' ABC ![bob](https://bob.com) 123 \n![tom](https://tom.com) xyz'),[
            {text:'ABC'},
            {image:{url:'https://bob.com',description:'bob'}},
            {text:'123'},
            {image:{url:'https://tom.com',description:'tom'}},
            {text:'xyz'},
        ])
    });

    it('should parse text and images no trim',()=>{
        expectImages(parseMarkdownImages(' ABC ![bob](https://bob.com) 123 \n![tom](https://tom.com) xyz',{noTrim:true}),[
            {text:' ABC '},
            {image:{url:'https://bob.com',description:'bob'}},
            {text:' 123 \n'},
            {image:{url:'https://tom.com',description:'tom'}},
            {text:' xyz'},
        ])
    });

    it('should parse images with new lines',()=>{
        expectImages(parseMarkdownImages('![bob\nand\ntom](https://bob.com)'),[
            {image:{url:'https://bob.com',description:'bob\nand\ntom'}},
        ])
    });

    it('should parse images with new lines',()=>{
        expectImages(parseMarkdownImages('![bob\nand\ntom](https://bob.com)'),[
            {image:{url:'https://bob.com',description:'bob\nand\ntom'}},
        ])
    });

    it('should parse images with new lines',()=>{
        expectImages(parseMarkdownImages('![](https://liirnspace-bucksmediabucket70ce2cea-11rljmkq8tolk.s3.amazonaws.com/vaeCiOZeTyi2U1xyiOiNKgr5hwQ7A9TZqv_xqCvAlIoA)\n\nWhich outfit in this picture would match the best for a guest to wear to a wedding without upstaging the bride?'),[
            {image:{url:'https://liirnspace-bucksmediabucket70ce2cea-11rljmkq8tolk.s3.amazonaws.com/vaeCiOZeTyi2U1xyiOiNKgr5hwQ7A9TZqv_xqCvAlIoA'}},
            {text:'Which outfit in this picture would match the best for a guest to wear to a wedding without upstaging the bride?'}
        ])
    });
});
