
import { createBase64DataUrl } from '@iyio/common';
import { useEffect, useState } from 'react';
import { BUNDLED_LANGUAGES, Highlighter, Lang, getHighlighter } from 'shiki';

let defaultHighlighter:Promise<Highlighter>|null;

const loadLangMap:Record<string,Promise<void>>={};

export const loadShikiLangAsync=(name:string)=>{
    return loadLangMap[name]??(loadLangMap[name]=_loadShikiLangAsync(name));
}

const _loadShikiLangAsync=async (name:string,scope=`source.${name}`)=>{

    const sh=await getShikiAsync();

    if(sh.getLoadedLanguages().includes(name as Lang)){
        return;
    }

    if(BUNDLED_LANGUAGES.some(l=>l.id===name)){
        await sh.loadLanguage(name as Lang);
    }else{

        await sh.loadLanguage({
            id:name,
            scopeName:scope,
            displayName:name,
            path:name==='convo'?createBase64DataUrl(JSON.stringify(convo),'application/json'):`highlighting/languages/${name}.tmLanguage.json`,

        })
    }
}

export const getShikiAsync=():Promise<Highlighter>=>{
    if(!defaultHighlighter){
        defaultHighlighter=getHighlighter({
            theme:'dark-plus',
            langs:[],
            paths:{
                themes:'/highlighting/themes',
                languages:'/highlighting/languages',
                wasm:'/highlighting'
            }
        });
    }
    return defaultHighlighter;
}

export const useShiki=(language?:string)=>{

    const [sh,setSh]=useState<Highlighter|null>(null);

    const [langSh,setLangSh]=useState<Highlighter|null>(null);


    useEffect(()=>{
        let m=true;

        getShikiAsync().then(v=>{
            if(m){
                setSh(v);
            }
        })
        return ()=>{
            m=false;
        }
    },[]);

    useEffect(()=>{
        setLangSh(null);
        if(!sh || !language){
            return;
        }

        let m=true;

        loadShikiLangAsync(language).then(()=>{
            if(m){
                setLangSh(sh);
            }
        })

        return ()=>{
            m=false;
        }

    },[language,sh]);

    return language?langSh:sh;
}

const convo={
    "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
    "name":"convo",
    "scopeName": "source.convo",
    "uuid": "B7A8C571-820A-4958-A997-76DFD822B0FE",
    "fileTypes": ["convo"],
    "patterns": [
        { "include": "#expression" }
    ],
    "repository": {

        "expression": {
            "patterns": [
                { "include": "#function"},
                { "include": "#role" },
                { "include": "#embed" },
                { "include": "#comment" },
            ]
        },
        "role": {
            "match": "^\\s*(>)\\s*(\\w+)\\s*([\\*\\?!]*)",
            "captures": {
                "1":{
                    "name":"keyword.control"
                },
                "2":{
                    "name":"storage.modifier"
                },
                "3":{
                    "name":"entity.name.type"
                },
            }
        },
        "embed":{
            "begin":"\\{\\{",
            "end":"\\}\\}",
            "beginCaptures": {
                "0":{
                    "name":"entity.name.tag"
                },
            },
            "endCaptures": {
                "0":{
                    "name":"entity.name.tag"
                },
            },
            "patterns":[{"include":"#lineExpression"}]

        },
        "function":{
            "begin": "^\\s*(>)\\s*(\\w+)?\\s+(\\w+)\\s*([\\*\\?!]*)\\s*(\\()",
            "end": "\\)",
            "applyEndPatternLast": 1,
            "beginCaptures": {
                "1":{
                    "name":"keyword.control"
                },
                "2":{
                    "name":"storage.modifier"
                },
                "3":{
                    "name":"support.function"
                },
                "4":{
                    "name":"entity.name.type"
                },
                "5":{
                    "name":"keyword.control"
                }
            },
            "endCaptures": {
                "0":{
                    "name":"keyword.control"
                }
            },
            "patterns": [
                {"include":"#comment"},
                {"include":"#functionReturn"},
                {"include":"#functionCall"},
                {"include":"#lineExpression"},
            ]
        },
        "functionReturn":{
            "match":"(\\))\\s*(->)\\s*(\\w+)?\\s*(\\()",
            "captures": {
                "1":{
                    "name":"keyword.control"
                },
                "2":{
                    "name":"keyword.operator"
                },
                "3":{
                    "name":"variable"
                },
                "4":{
                    "name":"keyword.control"
                }
            }
        },
        "functionCall":{
            "begin":"(\\w+)\\s*(\\()",
            "end":"\\)",
            "beginCaptures": {
                "1":{
                    "name":"support.function",
                    "patterns":[{
                        "include":"#systemFunctions"
                    }]
                },
                "2":{
                    "name":"meta.parameters"
                },
            },
            "endCaptures":{
                "0":{
                    "name":"meta.parameters"
                }
            },
            "patterns": [
                { "include": "#lineExpression" },
            ]
        },
        "comment":{
            "match":"#.*",
            "name":"comment"
        },
        "lineExpression":{
            "patterns":[
                { "include": "#comment" },
                { "include": "#stringDq" },
                { "include": "#stringSq" },
                { "include": "#functionCall" },
                {"include": "#label"},
                {"include": "#keyword"},
                {"include": "#typeKeyword"},
                {"include": "#number"},
                {"include": "#constValue"},
                {"include": "#lineVar"},
            ]
        },
        "lineVar":{
            "match":"\\w+",
            "captures":{
                "0":{
                    "name":"variable"
                }
            }
        },
        "label":{
            "match":"(\\w+)\\s*(\\?)?\\s*:",
            "captures":{
                "1":{
                    "name":"entity.name"
                }
            }
        },
        "stringDq":{
            "begin":"\"",
            "end":"\"",
            "name":"string",
            "patterns":[
                {
                    "match":"(\\\\)(\")",
                    "captures":{
                        "1":{"name":"constant.character.escape"},
                        "2":{"name":"string"}
                    }
                },
                {"include":"#embed"}
            ]
        },
        "stringSq":{
            "begin":"'",
            "end":"'",
            "name":"string",
            "patterns":[
                {
                    "match":"(\\\\)(')",
                    "captures":{
                        "1":{"name":"constant.character.escape"},
                        "2":{"name":"string"}
                    }
                },
                {"include":"#embed"}
            ]
        },
        "typeKeyword":{
            "match":"(string|number|boolean|bool|time|void)",
            "captures":{
                "1":{
                    "name":"entity.name.type"
                }
            }
        },
        "keyword":{
            "match":"(in)",
            "captures":{
                "1":{
                    "name":"keyword.control"
                }
            }
        },
        "systemFunctions":{
            "match":"(elif|if|else|for|do|then)",
            "captures":{
                "1":{
                    "name":"keyword.control"
                }
            }
        },
        "number":{
            "match":"(\\d+\\.\\d+|\\.\\d+|\\d+)+",
            "name":"entity.name.type"
        },
        "constValue":{
            "match":"(true|false|null|undefined)",
            "name":"constant.language"
        }
    }

}