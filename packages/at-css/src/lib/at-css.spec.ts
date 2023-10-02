import { atCss } from './at-css';

const st={
    color:'red'
}

describe('at-css',()=>{

    it('Parse style sheet',()=>{

        const cl = atCss({
            //namespace:'iyio',
            name:'ExampleComp',
            css:`
                @.root{

                }
                @.eggs{
                    color:green;
                }

                @.ham, @.bacon{
                    color:pink;
                    bg:${st.color};
                }

                @.fruit.seeds{
                    color:red;
                }
            `
        });

        //console.log('hio 👋 👋 👋',cl);

        expect(cl.isStyleSheetInserted()).toBe(false);

        expect(cl.eggs()).toBe('ExampleComp-eggs');
        expect(cl.ham()).toBe('ExampleComp-ham');
        expect(cl.bacon()).toBe('ExampleComp-bacon');
        expect(cl.fruit()).toBe('ExampleComp-fruit');
        expect(cl.root()).toBe('ExampleComp');
        expect(cl()).toBe('ExampleComp');

        expect(`${cl.eggs}`).toBe('ExampleComp-eggs');
        expect(`${cl.ham}`).toBe('ExampleComp-ham');
        expect(`${cl.bacon}`).toBe('ExampleComp-bacon');
        expect(`${cl.root}`).toBe('ExampleComp');
        expect(`${cl}`).toBe('ExampleComp');

        expect(cl.fruit({seeds:'yes'})).toBe('ExampleComp-fruit seeds');
        expect(cl.fruit({seeds:'yes'},{classNameValues:'foo'})).toBe('ExampleComp-fruit seeds foo');
        expect(cl.fruit({seeds:'yes'},{classNameValues:'foo',baseLayout:{p1:true}})).toBe('ExampleComp-fruit seeds foo ioP1');

        expect(cl.isStyleSheetInserted()).toBe(true);

    })


});
