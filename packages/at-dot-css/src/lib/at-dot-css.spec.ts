import { atDotCss, getAtDotCtrl } from './at-dot-css';

const st={
    color:'red'
}

describe('at-css',()=>{

    it('Parse style sheet',()=>{

        const style = atDotCss({
            //namespace:'iyio',
            name:'ExampleComp',
            css:`
                @.root{

                }
                @.eggs{
                    color:green;
                }
                @.eggs.active{
                    color:#33ff33;
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

        const ctrl=getAtDotCtrl(style);
        expect(ctrl).toBeTruthy();

        expect(ctrl.isInserted).toBe(false);

        expect(style.eggs()).toBe('ExampleComp-eggs');
        expect(style.eggs({active:true})).toBe('ExampleComp-eggs active');
        expect(style.ham()).toBe('ExampleComp-ham');
        expect(style.bacon()).toBe('ExampleComp-bacon');
        expect(style.fruit()).toBe('ExampleComp-fruit');
        expect(style.root()).toBe('ExampleComp');

        expect(`${style.eggs}`).toBe('ExampleComp-eggs');
        expect(`${style.ham}`).toBe('ExampleComp-ham');
        expect(`${style.bacon}`).toBe('ExampleComp-bacon');
        expect(`${style.root}`).toBe('ExampleComp');
        expect(`${style}`).toBe('ExampleComp');

        expect(style.fruit({seeds:'yes'})).toBe('ExampleComp-fruit seeds');
        expect(style.fruit({seeds:'yes'},{classNameValues:'foo'})).toBe('ExampleComp-fruit seeds foo');
        expect(style.fruit({seeds:'yes'},{classNameValues:'foo',baseLayout:{p1:true}})).toBe('ExampleComp-fruit seeds foo ioP1');

        expect(ctrl.isInserted).toBe(true);

    })


});
