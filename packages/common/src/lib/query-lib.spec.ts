import { HashMap } from "./common-types";
import { applyQueryShorthands } from "./query-lib";
import { isQueryCondition, isQueryGroupCondition, Query } from "./query-types";

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
                expect(condition.left.col?.name).toBe(`prop${i}`);
                expect(condition.right.value).toBe(`value${i}`);
            }
        }

    })

});
