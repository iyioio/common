import { parseXml, xmlTextNodeName } from "./xml-parser";

describe('xml-parser',()=>{

    it('should parse node with single text child',()=>{

        const xml=`<root-node>abc</root-node>`;
        const result=parseXml(xml);

        expect(result.error).toBeUndefined();
        expect(result.result?.length).toBe(1);
        const node=result.result?.[0];
        if(!node){
            return;
        }

        expect(node.name).toBe('root-node');
        expect(node.children?.length).toBe(1);
        expect(node.children?.[0]?.name).toBe(xmlTextNodeName);
        expect(node.children?.[0]?.text).toBe('abc');

    })


    it('should parse node with multiple children',()=>{

const xml=`<root-node>
    <a/>
    <b></b>
    <c prop1="one"/>
    <d>
        <d1/>
    </d>
    <e eProp="two">
        abc
        <e1/>
        xyz&nbsp;123
    </e>
</root-node>`;

        const result=parseXml(xml);

        expect(result.error).toBeUndefined();
        expect(result.result?.length).toBe(1);
        const node=result.result?.[0];
        if(!node){
            return;
        }

        expect(node.name).toBe('root-node');
        expect(node.children?.length).toBe(5);

        let c=-1;

        c++
        expect(node.children?.[c]?.name).toBe('a');
        expect(node.children?.[c]?.children).toBeUndefined();
        expect(node.children?.[c]?.atts).toBeUndefined();
        expect(node.children?.[c]?.text).toBeUndefined();

        c++;
        expect(node.children?.[c]?.name).toBe('b');
        expect(node.children?.[c]?.children).toBeUndefined();
        expect(node.children?.[c]?.atts).toBeUndefined();
        expect(node.children?.[c]?.text).toBeUndefined();

        c++;
        expect(node.children?.[c]?.name).toBe('c');
        expect(node.children?.[c]?.children).toBeUndefined();
        expect(node.children?.[c]?.atts).toEqual({prop1:'one'})
        expect(node.children?.[c]?.text).toBeUndefined();

        c++;
        expect(node.children?.[c]?.name).toBe('d');
        expect(node.children?.[c]?.children?.length).toBe(1);
        expect(node.children?.[c]?.children?.[0]?.name).toBe('d1');
        expect(node.children?.[c]?.atts).toBeUndefined();
        expect(node.children?.[c]?.text).toBeUndefined();

        c++;
        expect(node.children?.[c]?.name).toBe('e');
        expect(node.children?.[c]?.children?.length).toBe(3);
        expect(node.children?.[c]?.children?.[0]?.text).toBe('abc');
        expect(node.children?.[c]?.children?.[1]?.name).toBe('e1');
        expect(node.children?.[c]?.children?.[2]?.text).toBe('xyz 123');
        expect(node.children?.[c]?.atts).toEqual({eProp:'two'})
        expect(node.children?.[c]?.text).toBeUndefined();

    })

});
