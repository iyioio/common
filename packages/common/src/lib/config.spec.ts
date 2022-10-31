import { HashMap } from "./common-types";
import { DepConfig, EnvConfig, IConfig, parseConfigBool } from "./config";
import { createConfigKey, registerConfig } from "./config-globals";
import { DependencyContainer } from "./DependencyContainer";
import { cf } from "./_service.common";

const key1='TEST_VALUE_1';
const key2='TEST_VALUE_2';
const key3='TEST_VALUE_3';
const key4='TEST_VALUE_4'
const key5='TEST_VALUE_5';
const key6='TEST_VALUE_6'
const keyNoop='TEST_VALUE_NOOP';

const value1='value 1';
const value2='value 2';
const value3='value 3';
const value4='value 4';
const value5='5';
const value6='true'

describe('config',()=>{

    const defaultTest=(configs:(IConfig|HashMap)[],deps=new DependencyContainer())=>{

        const TEST_VALUE_4=createConfigKey(key4);

        for(const config of configs){
            registerConfig(deps,config);
        }


        //expect(getConfig(deps)).toBeTruthy();

        expect(cf(deps).get(key1)).toBe(value1);
        expect(cf(deps).get(key2)).toBe(value2);
        expect(cf(deps).get(key3)).toBe(value3);
        expect(cf(deps).get(key4)).toBe(value4);
        expect(cf(deps).get(key5)).toBe(value5);
        expect(cf(deps).get(key6)).toBe(value6);

        expect(cf(deps).getNumber(key5)).toBe(Number(value5));
        expect(cf(deps).getBool(key6)).toBe(parseConfigBool(value6));


        expect(cf(deps).require(key2)).toBe(value2);

        expect(TEST_VALUE_4.get(deps)).toBe(value4);
        expect(TEST_VALUE_4.require(deps)).toBe(value4);

        try{
            cf(deps).require(keyNoop);
            fail('requireConfigValue should have thrown');
        }catch{
            //
        }


    }

    const getHashMapConfigs=()=>[
        {
            [key1]:value1,
            [key2]:value2,
        },
        {
            [key3]:value3,
            [key4]:value4,
        },
        {
            [key5]:value5,
            [key6]:value6,
        },
    ]

    it('HashMap should get config values',()=>{

        defaultTest(getHashMapConfigs())
    })

    it('EnvConfig should get config values',()=>{

        defaultTest([
            new EnvConfig()
        ])
    })

    it('DepConfig should get config values',()=>{

        const deps=new DependencyContainer();
        const configs=getHashMapConfigs();
        for(const config of configs){
            registerConfig(deps,config);
        }

        defaultTest([
            new DepConfig(deps)
        ])
    })
})
