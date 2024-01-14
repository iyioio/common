import { asType } from './common-lib';
import { parseMarkdown } from './markdown-parser';
import { MarkdownLineType, MarkdownParsingOptions } from './markdown-types';

const parse=(md:string,options?:MarkdownParsingOptions)=>{

    const result=parseMarkdown(md.trim(),options);

    const lines=result.result;
    if(!lines){
        console.error(result.error);
        throw new Error('markdown parsing failed');
    }

    return lines;
}

describe('markdown-parser',()=>{

    it('should parse markdown',()=>{

        const lines=parse(`
hello

# World
## 2 heads extra space at end        ${''/* line 4*/}

- item 1
+ item 2
  - item 2.1
  * item 2.2
+ item 3
* item 4                             ${''/* line 11*/}

1. ordered 1
2. ordered 2
  1. ordered 2.1                     ${''/* line 15*/}

-------
+++++                                ${''/* line 18*/}

> block 1
>> block 2
> ## block 3

        `);

        let n=0
        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('p'));
        expect(lines[n]?.text).toBe('hello');
        expect(lines[n]?.ln).toBe(1);
        n++

        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('header'));
        expect(lines[n]?.text).toBe('World');
        expect(lines[n]?.headerLevel).toBe(1);
        expect(lines[n]?.ln).toBe(3);
        n++

        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('header'));
        expect(lines[n]?.text).toBe('2 heads extra space at end');
        expect(lines[n]?.headerLevel).toBe(2);
        expect(lines[n]?.ln).toBe(4);
        n++

        // unordered list
        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('list-item'));
        expect(lines[n]?.text).toBe('item 1');
        expect(lines[n]?.ulType).toBe('-');
        expect(lines[n]?.indent).toBe(undefined);
        expect(lines[n]?.ln).toBe(6);
        n++
        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('list-item'));
        expect(lines[n]?.text).toBe('item 2');
        expect(lines[n]?.ulType).toBe('+');
        expect(lines[n]?.indent).toBe(undefined);
        expect(lines[n]?.ln).toBe(7);
        n++
        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('list-item'));
        expect(lines[n]?.text).toBe('item 2.1');
        expect(lines[n]?.ulType).toBe('-');
        expect(lines[n]?.indent).toBe(1);
        expect(lines[n]?.ln).toBe(8);
        n++
        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('list-item'));
        expect(lines[n]?.text).toBe('item 2.2');
        expect(lines[n]?.ulType).toBe('*');
        expect(lines[n]?.indent).toBe(1);
        expect(lines[n]?.ln).toBe(9);
        n++
        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('list-item'));
        expect(lines[n]?.text).toBe('item 3');
        expect(lines[n]?.ulType).toBe('+');
        expect(lines[n]?.indent).toBe(undefined);
        expect(lines[n]?.ln).toBe(10);
        n++
        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('list-item'));
        expect(lines[n]?.text).toBe('item 4');
        expect(lines[n]?.ulType).toBe('*');
        expect(lines[n]?.indent).toBe(undefined);
        expect(lines[n]?.ln).toBe(11);
        n++

        // ordered list
        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('list-item'));
        expect(lines[n]?.text).toBe('ordered 1');
        expect(lines[n]?.ulType).toBe(undefined);
        expect(lines[n]?.listOrder).toBe(1);
        expect(lines[n]?.indent).toBe(undefined);
        expect(lines[n]?.ln).toBe(13);
        n++
        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('list-item'));
        expect(lines[n]?.text).toBe('ordered 2');
        expect(lines[n]?.ulType).toBe(undefined);
        expect(lines[n]?.listOrder).toBe(2);
        expect(lines[n]?.indent).toBe(undefined);
        expect(lines[n]?.ln).toBe(14);
        n++
        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('list-item'));
        expect(lines[n]?.text).toBe('ordered 2.1');
        expect(lines[n]?.ulType).toBe(undefined);
        expect(lines[n]?.listOrder).toBe(1);
        expect(lines[n]?.indent).toBe(1);
        expect(lines[n]?.ln).toBe(15);
        n++


        // hr
        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('hr'));
        expect(lines[n]?.text).toBe('-------');
        expect(lines[n]?.ln).toBe(17);
        n++
        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('hr'));
        expect(lines[n]?.text).toBe('+++++');
        expect(lines[n]?.ln).toBe(18);
        n++


        // blocks
        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('p'));
        expect(lines[n]?.text).toBe('block 1');
        expect(lines[n]?.blockQuoteLevel).toBe(1);
        expect(lines[n]?.ln).toBe(20);
        n++
        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('p'));
        expect(lines[n]?.text).toBe('block 2');
        expect(lines[n]?.blockQuoteLevel).toBe(2);
        expect(lines[n]?.ln).toBe(21);
        n++
        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('header'));
        expect(lines[n]?.text).toBe('block 3');
        expect(lines[n]?.blockQuoteLevel).toBe(1);
        expect(lines[n]?.ln).toBe(22);
        n++


        expect(lines[n]).toBeUndefined();

    })


    it('should parse bold, italic, address and code',()=>{

        const lines=parse(`

Stuff *italic1* _italic2_ more stuff **bold1** __bold2__ <address> \`some code\` More text here  ${''/*line 1*/}

        `);


        let n=0;
        const line=lines[0];
        expect(line?.nodes).not.toBeUndefined();
        if(!line?.nodes){return;}

        expect(line.ln).toBe(1);
        n++;
        expect(lines[n]).toBeUndefined();

        let c=0;
        expect(line.nodes[c]?.text).toBe('Stuff ');
        c++;

        expect(line.nodes[c]?.text).toBe('italic1');
        expect(line.nodes[c]?.italic).toBe(true);
        c++;

        expect(line.nodes[c]?.text).toBe(' ');
        c++;

        expect(line.nodes[c]?.text).toBe('italic2');
        expect(line.nodes[c]?.italic).toBe(true);
        c++;

        expect(line.nodes[c]?.text).toBe(' more stuff ');
        c++;

        expect(line.nodes[c]?.text).toBe('bold1');
        expect(line.nodes[c]?.bold).toBe(true);
        c++;

        expect(line.nodes[c]?.text).toBe(' ');
        c++;

        expect(line.nodes[c]?.text).toBe('bold2');
        expect(line.nodes[c]?.bold).toBe(true);
        c++;

        expect(line.nodes[c]?.text).toBe(' ');
        c++;

        expect(line.nodes[c]?.text).toBe('address');
        expect(line.nodes[c]?.url).toBe('address');
        c++;

        expect(line.nodes[c]?.text).toBe(' ');
        c++;

        expect(line.nodes[c]?.text).toBe('some code');
        expect(line.nodes[c]?.code).toBe(true);
        c++;

        expect(line.nodes[c]?.text).toBe(' More text here');
        c++;

        expect(line.nodes[c]).toBeUndefined();

    });


    it('should parse link',()=>{

        const lines=parse(`

Take a look at this [link-name](https://example.com).

        `);


        let n=0;
        const line=lines[0];
        expect(line?.nodes).not.toBeUndefined();
        if(!line?.nodes){return;}

        expect(line.ln).toBe(1);
        n++;
        expect(lines[n]).toBeUndefined();

        let c=0;
        expect(line.nodes[c]?.text).toBe('Take a look at this ');
        c++;

        expect(line.nodes[c]?.text).toBe('link-name');
        expect(line.nodes[c]?.url).toBe('https://example.com');
        expect(line.nodes[c]?.imageUrl).toBe(undefined);
        expect(line.nodes[c]?.link).toBe(true);
        c++;

        expect(line.nodes[c]?.text).toBe('.');
        c++;


        expect(line.nodes[c]).toBeUndefined();

    });


    it('should parse image',()=>{

        const lines=parse(`

Take a look at this ![image-name](https://example.com/ricky-bobby.tiff)

        `);


        let n=0;
        const line=lines[0];
        expect(line?.nodes).not.toBeUndefined();
        if(!line?.nodes){return;}

        expect(line.ln).toBe(1);
        n++;
        expect(lines[n]).toBeUndefined();

        let c=0;
        expect(line.nodes[c]?.text).toBe('Take a look at this ');
        c++;

        expect(line.nodes[c]?.text).toBe('image-name');
        expect(line.nodes[c]?.url).toBe(undefined);
        expect(line.nodes[c]?.imageUrl).toBe('https://example.com/ricky-bobby.tiff');
        expect(line.nodes[c]?.link).toBe(undefined);
        c++;


        expect(line.nodes[c]).toBeUndefined();

    });


    it('should parse bold image',()=>{

        const lines=parse(`

Take a look at __this ![image-name](https://example.com/ricky-bobby.tiff)__

        `);


        let n=0;
        const line=lines[0];
        expect(line?.nodes).not.toBeUndefined();
        if(!line?.nodes){return;}

        expect(line.ln).toBe(1);
        n++;
        expect(lines[n]).toBeUndefined();

        let c=0;
        expect(line.nodes[c]?.text).toBe('Take a look at ');
        c++;

        expect(line.nodes[c]?.text).toBe('this ');
        expect(line.nodes[c]?.bold).toBe(true);
        c++;

        expect(line.nodes[c]?.text).toBe('image-name');
        expect(line.nodes[c]?.bold).toBe(true);
        expect(line.nodes[c]?.url).toBe(undefined);
        expect(line.nodes[c]?.imageUrl).toBe('https://example.com/ricky-bobby.tiff');
        expect(line.nodes[c]?.link).toBe(undefined);
        c++;


        expect(line.nodes[c]).toBeUndefined();

    });


    it('should parse image link',()=>{

        const lines=parse(`

Take a look at this [![Famous race car driver](https://example.com/ricky-bobby.tiff)](https://example.com/)

        `);


        let n=0;
        const line=lines[0];
        expect(line?.nodes).not.toBeUndefined();
        if(!line?.nodes){return;}

        expect(line.ln).toBe(1);
        n++;
        expect(lines[n]).toBeUndefined();

        let c=0;
        expect(line.nodes[c]?.text).toBe('Take a look at this ');
        c++;

        expect(line.nodes[c]?.text).toBe('Famous race car driver');
        expect(line.nodes[c]?.url).toBe('https://example.com/');
        expect(line.nodes[c]?.imageUrl).toBe('https://example.com/ricky-bobby.tiff');
        expect(line.nodes[c]?.link).toBe(true);
        c++;


        expect(line.nodes[c]).toBeUndefined();

    });


    it('should parse code block',()=>{

        const lines=parse(`

## Code Example

\`\`\` ts
const n:number=0;
console.log(n+1);
\`\`\`

after example

        `);


        let n=0;

        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('header'));
        expect(lines[n]?.text).toBe('Code Example');
        expect(lines[n]?.headerLevel).toBe(2);
        expect(lines[n]?.ln).toBe(1);
        n++

        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('code-block'));
        expect(lines[n]?.text).toBe(
`const n:number=0;
console.log(n+1);`
        );
        expect(lines[n]?.codeLanguage).toBe('ts');
        expect(lines[n]?.ln).toBe(3);
        n++

        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('p'));
        expect(lines[n]?.text).toBe('after example');
        expect(lines[n]?.ln).toBe(8);
        n++

    });


    it('should parse code block no language',()=>{

        const lines=parse(`

## Code Example

\`\`\`
const n:number=0;
console.log(n+1);
\`\`\`

after example

        `);


        let n=0;

        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('header'));
        expect(lines[n]?.text).toBe('Code Example');
        expect(lines[n]?.headerLevel).toBe(2);
        expect(lines[n]?.ln).toBe(1);
        n++

        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('code-block'));
        expect(lines[n]?.text).toBe(
`const n:number=0;
console.log(n+1);`
        );
        expect(lines[n]?.codeLanguage).toBe('');
        expect(lines[n]?.ln).toBe(3);
        n++

        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('p'));
        expect(lines[n]?.text).toBe('after example');
        expect(lines[n]?.ln).toBe(8);
        n++

    });


    it('should parse code block with text after end',()=>{

        const lines=parse(`

## Code Example

\`\`\` ts
const n:number=0;
console.log(n+1);
\`\`\` ending stuff

after example

        `);


        let n=0;

        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('header'));
        expect(lines[n]?.text).toBe('Code Example');
        expect(lines[n]?.headerLevel).toBe(2);
        expect(lines[n]?.ln).toBe(1);
        n++

        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('code-block'));
        expect(lines[n]?.text).toBe(
`const n:number=0;
console.log(n+1);`
        );
        expect(lines[n]?.codeLanguage).toBe('ts');
        expect(lines[n]?.ln).toBe(3);
        n++

        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('p'));
        expect(lines[n]?.text).toBe('ending stuff');
        expect(lines[n]?.ln).toBe(6);
        n++

        expect(lines[n]?.type).toBe(asType<MarkdownLineType>('p'));
        expect(lines[n]?.text).toBe('after example');
        expect(lines[n]?.ln).toBe(8);
        n++

    });

    it('should parse tags',()=>{

        const lines=parse(`

@tag1 value1
@tag2
# title

        `,{parseTags:true});


        const line=lines[0];
        if(!line){return;}

        expect(line.type).toBe('header');
        expect(line.text).toBe('title');
        expect(line.ln).toBe(3);
        expect(line.tags).toEqual([
            {name:'tag1',value:'value1'},
            {name:'tag2'}
        ])


    });

});
