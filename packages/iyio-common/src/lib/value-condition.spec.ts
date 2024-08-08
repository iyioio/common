import { testValueCondition } from './value-condition-lib';
import { ValueCondition } from './value-condition-types';

describe('value-conditions',()=>{

    const test=(name:string,condition:ValueCondition,value:any)=>{
        const pass=testValueCondition(condition,value);
        if(!pass){
            throw new Error(`${name} failed`);
        }
    }

    it('should test conditions',()=>{

        test('eq',
            {
                op:'eq',
                value:1
            }
        ,
            1
        );

        test('not-eq',
            {
                op:'not-eq',
                value:2
            }
        ,
            1
        );

        test('lt',
            {
                op:'lt',
                value:1
            }
        ,
            2
        );

        test('not-lt',
            {
                op:'not-lt',
                value:2
            }
        ,
            1
        );

        test('lte',
            {
                op:'lte',
                value:1
            }
        ,
            1
        );

        test('lte',
            {
                op:'lte',
                value:1
            }
        ,
            2
        );

        test('not-lte',
            {
                op:'not-lte',
                value:2
            }
        ,
            1
        );




        test('gt',
            {
                op:'gt',
                value:2
            }
        ,
            1
        );

        test('not-gt',
            {
                op:'not-gt',
                value:1
            }
        ,
            2
        );

        test('gte',
            {
                op:'gte',
                value:1
            }
        ,
            1
        );

        test('gte',
            {
                op:'gte',
                value:2
            }
        ,
            1
        );

        test('not-gte',
            {
                op:'not-gte',
                value:1
            }
        ,
            2
        );

        test('not-gte',
            {
                op:'not-gte',
                value:1
            }
        ,
            2
        );

        test('in',
            {
                op:'in',
                value:1
            }
        ,
            [7,8,1]
        );

        test('not-in',
            {
                op:'not-in',
                value:9
            }
        ,
            [7,8,1]
        );

        test('in',
            {
                op:'in',
                value:"o f"
            }
        ,
            'Go fast'
        );

        test('not-in',
            {
                op:'not-in',
                value:'left'
            }
        ,
            'Go fast'
        );

        test('contains',
            {
                op:'contains',
                value:[7,8,1]
            }
        ,
            1
        );

        test('not-contains',
            {
                op:'not-contains',
                value:[7,8,1]
            }
        ,
            9
        );

        test('contains',
            {
                op:'contains',
                value:'Go fast'
            }
        ,
            'o f'
        );

        test('not-contains',
            {
                op:'not-contains',
                value:'Go fast'
            }
        ,
            'Ricky'
        );

        test('starts-with',
            {
                op:'starts-with',
                value:'Go'
            }
        ,
            'Go fast'
        );

        test('not-starts-with',
            {
                op:'not-starts-with',
                value:'Cal'
            }
        ,
            'Go fast'
        );

        test('ends-with',
            {
                op:'ends-with',
                value:'fast'
            }
        ,
            'Go fast'
        );

        test('not-ends-with',
            {
                op:'not-ends-with',
                value:'Cal'
            }
        ,
            'Go fast'
        );

        test('match',
            {
                op:'match',
                value:'^\\w+\\s+\\w+="\\w+"$'
            }
        ,
            'const name="Ricky"'
        );

        test('match',
            {
                op:'match',
                value:/^\w+\s+\w+="\w+"$/
            }
        ,
            'const name="Ricky"'
        );

        test('not-match',
            {
                op:'not-match',
                value:'^\\w+\\s+\\w+="\\w+"$'
            }
        ,
            'const turn=()=>"left"'
        );

        test('not-match',
            {
                op:'not-match',
                value:/^\w+\s+\w+="\w+"$/
            }
        ,
            'const turn=()=>"left"'
        );

        test('star-match',
            {
                op:'star-match',
                value:'/home/*/docs/*/node_modules'
            }
        ,
            '/home/ricky/docs/drunk-chicken/node_modules'
        );

        test('not-star-match',
            {
                op:'not-star-match',
                value:'/home/*/docs/*/node_modules'
            }
        ,
            'home/ricky/docs/drunk-chicken/node_modules'
        );

        test('not-star-match',
            {
                op:'not-star-match',
                value:'/home/*/docs/*/node_modules'
            }
        ,
            '/opt/go-fast'
        );

        test('obj-eq',
            {
                op:'obj-eq',
                value:{
                    garage:{
                        personal:{
                            name:'Chevelle'
                        },
                        race:{
                            name:'#26 Laughing Clown Malt Liquor'
                        },
                    }
                }
            }
        ,
            {
                garage:{
                    race:{
                        name:'#26 Laughing Clown Malt Liquor'
                    },
                    personal:{
                        name:'Chevelle'
                    },
                }
            }
        );

        test('not-obj-eq',
            {
                op:'not-obj-eq',
                value:{
                    garage:{
                        personal:{
                            name:'Chevelle'
                        },
                        race:{
                            name:'#26 Laughing Clown Malt Liquor'
                        },
                    }
                }
            }
        ,
            {
                garage:{
                    race:{
                        name:'#22 Laughing Clown Malt Liquor'
                    },
                    personal:{
                        name:'Chevelle'
                    },
                }
            }
        );

        test('obj-in',
            {
                op:'obj-in',
                value:{
                    garage:{
                        personal:{
                            name:'Chevelle'
                        },
                    }
                }
            }
        ,
            {
                garage:{
                    race:{
                        name:'#26 Laughing Clown Malt Liquor'
                    },
                    personal:{
                        name:'Chevelle'
                    },
                }
            }
        );

        test('not-obj-in',
            {
                op:'not-obj-in',
                value:{
                    garage:{
                        delivery:{
                            name:'Bicycle'
                        },
                    }
                }
            }
        ,
            {
                garage:{
                    race:{
                        name:'#26 Laughing Clown Malt Liquor'
                    },
                    personal:{
                        name:'Chevelle'
                    },
                }
            }
        );

        test('eq-path',
            {
                op:'eq',
                value:22,
                path:'person.age'
            }
        ,
            {person:{age:22}}
        );

        test('not-eq-path',
            {
                op:'not-eq',
                value:21,
                path:'person.age'
            }
        ,
            {person:{age:22}}
        );



        test('or',
            {
                op:'or',
                conditions:[
                    {
                        op:'in',
                        value:'right'
                    },
                    {
                        op:'in',
                        value:'left'
                    },
                ]
            }
        ,
            'turn left'
        );


        test('and',
            {
                op:'and',
                conditions:[
                    {
                        op:'starts-with',
                        value:'turn'
                    },
                    {
                        op:'ends-with',
                        value:'left'
                    },
                ]
            }
        ,
            'turn left'
        );


        test('and path',
            {
                op:'and',
                path:'driver.action',
                conditions:[
                    {
                        op:'starts-with',
                        value:'turn'
                    },
                    {
                        op:'ends-with',
                        value:'left'
                    },
                ]
            }
        ,
            {driver:{action:'turn left'}}
        );


    })
})
