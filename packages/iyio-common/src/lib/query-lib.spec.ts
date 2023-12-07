import { HashMap } from "./common-types";
import { applyQueryShorthands } from "./query-lib";
import { isQueryCondition, isQueryGroupCondition, Query } from "./query-types";
import { buildQuery } from "./sql-query-builder";

describe('query-lib',()=>{

    it('should apply match shorthand',()=>{

        for(let propCount=0;propCount<=10;propCount++){

            const match:HashMap={}
            for(let i=0;i<propCount;i++){
                match[`prop${i}`]=`value${i}`;
            }

            const query:Query={match}

            const applied=applyQueryShorthands(query,false);

            if(applied.match){
                fail('applied.match should have been deleted');
                return;
            }

            if(propCount===0){
                if(applied.condition){
                    fail('applied.condition should not have been set');
                    return;
                }
                continue;
            }else if(propCount===1){
                if(!isQueryCondition(applied.condition)){
                    fail('applied.condition should be a column value condition');
                    return;
                }
                applied.condition={
                    op:'and',
                    conditions:[applied.condition]
                }
            }

            //console.log(JSON.stringify({applied,query},null,4))

            expect(applied).not.toBe(query);

            if(!isQueryGroupCondition(applied.condition)){
                fail('applied.condition should be a group query condition');
                return;
            }

            for(let i=0;i<propCount;i++){
                const condition=applied.condition.conditions[i];
                //console.log({condition})
                if(!isQueryCondition(condition)){
                    fail(`condition ${i} should be a column value condition`);
                    return;
                }
                expect((typeof condition.left.col !== 'string') && condition.left.col?.name).toBe(`prop${i}`);
                expect(condition.right.value).toBe(`value${i}`);
            }
        }

    })

    it('should build query with multiple funcs',()=>{

        const query:Query={
            table:'Users',
            columns:[
                {
                    col:"age",
                    name:'age',
                    func:['sum','min']
                }
            ]
        }

        expect(removeSpace(buildQuery(query))).toBe(removeSpace('select sum( min( "age" ) ) as "age" from "Users" as "_tbl_1"'))
    })

    it('should build query with args',()=>{

        const query:Query={
            table:'Users',
            columns:[
                {
                    name:'fullName',
                    func:['concat'],
                    args:[{col:'fname'},{col:'lname'}]
                }
            ]
        }

        expect(removeSpace(buildQuery(query))).toBe(removeSpace('select concat( "fname" , "lname" ) as "fullName" from "Users" as "_tbl_1"'))
    })

    it('should build query with expressions',()=>{

        const query:Query={
            table:'Users',
            columns:[
                {
                    name:'youngerAge',
                    expression:[
                        {col:'age'},
                        '-',
                        {value:5}
                    ]
                }
            ]
        }

        expect(removeSpace(buildQuery(query))).toBe(removeSpace('select ( "age" - 5 ) as "youngerAge" from "Users" as "_tbl_1"'))
    })

    it('should coalesce',()=>{

        const query:Query={
            table:'Users',
            columns:[
                {
                    name:'sum',
                    func:'sum',
                    coalesce:0
                }
            ],
            groupBy:'state',
        }

        expect(removeSpace(buildQuery(query))).toBe(removeSpace('select coalesce( sum( * ) , 0 ) as "sum" from "Users" as "_tbl_1" group by "state"'))
    })

    it('should create query with expression and group by',()=>{

        const query:Query={
            columns:[
                {
                    name:'averageDuration',
                    func:'avg',
                    col:'duration'
                }
            ],
            table:{
                table:'Event',
                groupBy:'sessionId',
                columns:[
                    {
                        name:'duration',
                        expression:[
                            '(',
                            {func:'max',col:'created'},
                            '-',
                            {func:'min',col:'created'},
                            ')',
                            '/',
                            {value:60000}

                        ]
                    }
                ]
            }
        }

        expect(removeSpace(buildQuery(query))).toBe(removeSpace('select avg( "duration" ) as "averageDuration" from ( select ( ( max( "created" ) - min( "created" ) ) / 60000 ) as "duration" from "Event" as "_tbl_2" group by "sessionId" ) as "_tbl_1"'))
    })

});

const removeSpace=(v:string)=>v.replace(/\s/g,'')
