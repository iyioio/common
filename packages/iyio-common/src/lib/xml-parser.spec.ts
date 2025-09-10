import { parseXml, xmlTextNodeName } from "./xml-parser.js";

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

    it('should parse xml with single quotes',()=>{
        const xml=`<Climate story='{{"title":"Cincinnati&#039;s Climate Resilience: A Beacon of Hope in 2050","imageDescription":"Cincinnati skyline with lush greenery and renewable energy sources","story":"As the world hovers tantalisingly close to its climate goals in 2050, Cincinnati, OH, USA stands out as a shining example of resilience and innovation. Over the past decades, the city has transformed its urban landscape to adapt to the warming climate, integrating green infrastructure and advanced renewable energy solutions. \\n\\nThe banks of the Ohio River, once prone to destructive flooding, are now fortified with eco-friendly materials and designs that naturally absorb excess water. Cincinnati&#039;s iconic skyline gleams with the addition of solar panels and wind turbines, powering the city with clean energy. \\nThe city&#039;s green spaces have expanded, creating urban oases that not only enhance the quality of life for its residents but also serve as carbon sinks, mitigating the effects of climate change. \\n\\nDespite the global temperature increase, Cincinnati has maintained a stable climate, with reduced heatwaves and improved air quality. The city&#039;s proactive approach to climate change serves as a blueprint for other cities globally as they strive to reach their environmental targets and create a sustainable future for all."}}' />`

        const result=parseXml(xml,{parseJsonAtts:true});
        expect(result.result).not.toBeUndefined();
    })

});
