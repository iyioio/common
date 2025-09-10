import { atDotCss, getAtDotCtrl } from './at-dot-css.js';

const st={
    color:'red'
}

describe('at-css',()=>{

    it('Parse split style sheet',()=>{
        const style = atDotCss({
            name:'Example2Comp',
            css:`
                @.user{
                    color:green;
                }
                /*- split -*/
                @.admin{
                    color:green;
                }
            `
        });

        const ctrl=getAtDotCtrl(style);
        expect(ctrl).toBeTruthy();

        expect(style.user()).toBe('Example2Comp-user');
        expect(style.admin()).toBe('Example2Comp-admin');
    })

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
                @mobileUp{

                }
            `
        });

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
        expect(style.fruit({seeds:'yes'},'foo')).toBe('ExampleComp-fruit seeds foo');
        expect(style.fruit({seeds:'yes'},'foo',{p1:true})).toBe('ExampleComp-fruit seeds foo ioP1');

        expect(ctrl.isInserted).toBe(true);

    })


});
