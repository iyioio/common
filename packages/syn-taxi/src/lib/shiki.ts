
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
                { "include": "#interpolation"},
                { "include": "#function"},
                { "include": "#role" },
                { "include": "#functionBody"},
                { "include": "#externFunction"},
                { "include": "#embed" },
                { "include": "#comment" },
                { "include": "#tag" }
            ]
        },
        "interpolation":{
            "contentName": "meta.embedded.line.ts",
            "begin": "\\${",
            "beginCaptures": {
                "0": {
                    "name": "punctuation.definition.interpolation.begin.bracket.curly.scss punctuation.definition.template-expression.begin.js"
                }
            },
            "end": "}",
            "endCaptures": {
                "0": {
                    "name": "punctuation.definition.interpolation.end.bracket.curly.scss punctuation.definition.template-expression.end.js"
                }
            },
            "name": "variable.interpolation.scss",
            "patterns": [
                {
                    "include": "source.ts#expression"
                },
                {
                    "include": "#interpolation"
                }
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
                }
            }
        },
        "embed":{
            "begin":"\\{\\{",
            "end":"\\}\\}",
            "beginCaptures": {
                "0":{
                    "name":"entity.name.tag"
                }
            },
            "endCaptures": {
                "0":{
                    "name":"entity.name.tag"
                }
            },
            "patterns":[{"include":"#lineExpression"}]

        },
        "function":{
            "begin": "^\\s*(>)\\s*(\\w+)?\\s+(\\w+)\\s*([\\*\\?!]*)\\s*(\\()",
            "end": "\\)",
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
                {"include":"#tag"},
                {"include":"#functionReturn"},
                {"include":"#functionCall"},
                {"include":"#paramLineExpression"}
            ]
        },
        "functionBody":{
            "begin":"(->)\\s*(\\w+)?\\s*(\\()",
            "end":"\\)",
            "beginCaptures": {
                "1":{
                    "name":"keyword.operator"
                },
                "2":{
                    "name":"variable"
                },
                "3":{
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
                {"include":"#tag"},
                {"include":"#functionCall"},
                {"include":"#lineExpression"}
            ]
        },
        "externFunction":{
            "match":"(->)\\s*(extern)",
            "captures": {
                "1":{
                    "name":"keyword.operator"
                },
                "2":{
                    "name":"keyword.control"
                }
            }
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
                }
            },
            "endCaptures":{
                "0":{
                    "name":"meta.parameters"
                }
            },
            "patterns": [
                { "include": "#lineExpression" }
            ]
        },
        "comment":{
            "match":"#.*",
            "name":"comment"
        },
        "tag":{
            "match":"(@)\\s*(\\w*)\\s*=?(.*)",
            "captures":{
                "1":{
                    "name":"entity.name.tag"
                },
                "2":{
                    "name":"entity.name.tag"
                },
                "3":{
                    "name":"string"
                }
            }
        },
        "lineExpression":{
            "patterns":[
                { "include": "#comment" },
                {"include":"#tag"},
                { "include": "#stringDq" },
                { "include": "#stringSq" },
                { "include": "#functionCall" },
                {"include": "#label"},
                {"include": "#typeKeyword"},
                {"include": "#number"},
                {"include": "#constValue"},
                {"include": "#lineVar"}
            ]
        },
        "paramLineExpression":{
            "patterns":[
                { "include": "#comment" },
                {"include":"#tag"},
                { "include": "#stringDq" },
                { "include": "#stringSq" },
                { "include": "#functionCall" },
                {"include": "#paramLabel"},
                {"include": "#typeKeyword"},
                {"include": "#number"},
                {"include": "#constValue"},
                {"include": "#lineVar"}
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
        "paramLabel":{
            "match":"(\\w+)\\s*(\\?)?\\s*:",
            "captures":{
                "1":{
                    "name":"variable"
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
            "match":"\\b(string|number|int|boolean|time|void|any|map|array)\\b",
            "captures":{
                "1":{
                    "name":"entity.name.type"
                }
            }
        },
        "systemFunctions":{
            "match":"\\b(elif|if|else|while|for|in|do|then)$",
            "captures":{
                "1":{
                    "name":"keyword.control"
                }
            }
        },
        "number":{
            "match":"-?(\\d+\\.\\d+|\\.\\d+|\\d+)+",
            "name":"entity.name.type"
        },
        "constValue":{
            "match":"(true|false|null|undefined)",
            "name":"constant.language"
        }
    }

}

