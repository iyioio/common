
import { useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import { Highlighter, BundledLanguage as Lang, createHighlighter } from 'shiki';
import { bundledLanguages } from 'shiki/langs';

let defaultHighlighter:Promise<Highlighter>|null;

const loadLangMap:Record<string,Promise<void>>={};

const onLangLoad=new Subject<string>();

export const loadShikiLangAsync=(name:string)=>{
    return loadLangMap[name]??(loadLangMap[name]=_loadShikiLangAsync(0,name));
}

const langDeps:Record<string,string[]>={
    //mdx:['tsx'],
    convo:['json','xml','javascript','python'],
}

const _loadShikiLangAsync=async (
    depth:number,
    name:string,
)=>{

    if(depth>10){
        return;
    }

    const sh=await getShikiAsync();

    if(sh.getLoadedLanguages().includes(name as Lang)){
        return;
    }

    try{
        await sh.loadLanguage((name==='convo'?convo:name) as any);
        onLangLoad.next(name);
    }catch{
        //
    }

    const bundled=(await bundledLanguages[name as Lang]?.())?.default;

    const depList=langDeps[name];
    if(depList){
        for(const dep of depList){
            await _loadShikiLangAsync(depth+1,dep);
        }
    }

    if(bundled){
        for(const b of bundled){
            if(b.embeddedLangs){
                for(const e of b.embeddedLangs){
                    await _loadShikiLangAsync(depth+1,e);
                }
            }
            if(b.embeddedLangsLazy){
                for(const e of b.embeddedLangsLazy){
                    await _loadShikiLangAsync(depth+1,e);
                }
            }
        }
    }
}

export const getShikiAsync=():Promise<Highlighter>=>{
    if(!defaultHighlighter){
        defaultHighlighter=createHighlighter({
            themes:['dark-plus'],
            langs:[],
        });
    }
    return defaultHighlighter;
}

export const useShiki=(language?:string)=>{

    const [sh,setSh]=useState<Highlighter|null>(null);
    const [loadIndex,setLoadIndex]=useState(0);


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
        setLoadIndex(v=>v+1);
        if(!sh || !language){
            return;
        }
        let m=true;
        loadShikiLangAsync(language).then(()=>{
            if(m){
                setLoadIndex(v=>v+1);
            }
        })
        return ()=>{
            m=false;
        }

    },[language,sh]);

    useEffect(()=>{
        let iv:any=undefined;
        let m=true;
        const sub=onLangLoad.subscribe(()=>{
            iv=setTimeout(()=>{
                clearTimeout(iv);
                if(m){
                    setLoadIndex(v=>v+1);
                }
            },100);
        })
        return ()=>{
            sub.unsubscribe();
            m=false;
        }
    },[]);

    return {sh,loadIndex};
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
                { "include": "#topLevelStatements"},
                { "include": "#function"},
                { "include": "#role" },
                { "include": "#functionBody"},
                { "include": "#msgStringStartMsg"},
                { "include": "#msgStringBackslash"},
                { "include": "#embedEscape" },
                { "include": "#embed" },
                { "include": "#markdownLink" },
                { "include": "#comment" },
                { "include": "#tag" },
                { "include": "#fenced_code_block"}
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
        "embedEscape":{
            "match":"(\\\\){\\{",
            "captures": {
                "1":{
                    "name":"constant.character.escape"
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
        "topLevelStatements":{
            "begin": "^\\s*(>)\\s*(do|result|define|debug|end)",
            "end": "(?=\\s*>)",
            "beginCaptures": {
                "1":{
                    "name":"keyword.control"
                },
                "2":{
                    "name":"keyword.control"
                }
            },
            "patterns": [
                {"include":"#comment"},
                {"include":"#tag"},
                {"include":"#functionCall"},
                {"include":"#paramLineExpression"}
            ]
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
                {"include":"#functionCall"},
                {"include":"#paramLineExpression"}
            ]
        },
        "functionBody":{
            "begin":"(\\w+)?\\s*(->)\\s*(\\w+)?\\s*(\\()",
            "end":"\\)",
            "beginCaptures": {
                "1":{
                    "name":"entity.name.type"
                },
                "2":{
                    "name":"keyword.operator"
                },
                "3":{
                    "name":"entity.name.type"
                },
                "4":{
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
        "functionCall":{
            "begin":"(\\w+)\\s*(\\()",
            "end":"\\)",
            "beginCaptures": {
                "1":{
                    "name":"support.function",
                    "patterns":[
                        {"include":"#operators"},
                        {"include":"#typeFunctions"},
                        {"include":"#logicOperators"},
                        {"include":"#systemFunctions"}
                    ]
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
            "patterns":[
                {
                    "match":"#.*",
                    "name":"comment"
                },
                {
                    "match":"//.*",
                    "name":"emphasis",
                    "captures":{
                        "0":{"name":"comment"}
                    }
                }
            ]
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
                {"include":"#comment"},
                {"include":"#tag"},
                {"include":"#heredoc"},
                {"include":"#stringDq"},
                {"include":"#stringSq"},
                {"include":"#pipe"},
                {"include":"#functionCall"},
                {"include":"#label"},
                {"include":"#typeKeyword"},
                {"include":"#number"},
                {"include":"#constValue"},
                {"include":"#userDefinedType"},
                {"include":"#lineVar"}
            ]
        },
        "paramLineExpression":{
            "patterns":[
                {"include":"#comment"},
                {"include":"#tag"},
                {"include":"#heredoc"},
                {"include":"#stringDq"},
                {"include":"#stringSq"},
                {"include":"#pipe"},
                {"include":"#functionCall"},
                {"include":"#paramLabel"},
                {"include":"#typeKeyword"},
                {"include":"#number"},
                {"include":"#constValue"},
                {"include":"#userDefinedType"},
                {"include":"#lineVar"}
            ]
        },
        "userDefinedType":{
            "match":"\\b[A-Z]\\w*\\b",
            "captures":{
                "0":{
                    "name":"entity.name.type"
                }
            }
        },
        "lineVar":{
            "match":"\\b\\w+\\b",
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
                {"include":"#stringBackslash"},
                {
                    "match":"(\\\\)(\")",
                    "captures":{
                        "1":{"name":"constant.character.escape"},
                        "2":{"name":"string"}
                    }
                }
            ]
        },
        "stringSq":{
            "begin":"'",
            "end":"'",
            "name":"string",
            "patterns":[
                {"include":"#stringBackslash"},
                {
                    "match":"(\\\\)(')",
                    "captures":{
                        "1":{"name":"constant.character.escape"},
                        "2":{"name":"string"}
                    }
                },
                {"include":"#embedEscape"},
                {"include":"#embed"}
            ]
        },
        "markdownLink":{
            "begin":"!?\\[",
            "end":"(\\]\\()([^\\)]*)(\\))",
            "beginCaptures":{
                "0":{"name":"keyword.control"}
            },
            "endCaptures":{
                "1":{"name":"keyword.control"},
                "2":{"name":"string"},
                "3":{"name":"keyword.control"}
            },
            "contentName":"comment"
        },
        "stringBackslash":{
            "match":"(\\\\)\\\\",
            "captures":{
                "1":{"name":"constant.character.escape"}
            }
        },
        "msgStringBackslash":{
            "match":"(\\\\)\\\\(?=\\{\\{)",
            "captures":{
                "1":{"name":"constant.character.escape"}
            }
        },
        "msgStringStartMsg":{
            "match":"^[ \\t]*(\\\\)\\\\*>",
            "captures":{
                "1":{"name":"constant.character.escape"}
            }
        },
        "typeKeyword":{
            "match":"\\b(string|number|int|boolean|time|void|any|map|array|object)\\b",
            "captures":{
                "1":{
                    "name":"entity.name.type"
                }
            }
        },
        "systemFunctions":{
            "match":"\\b(elif|if|else|while|break|foreach|for|in|do|then|fn|return|case|default|switch|test)$",
            "captures":{
                "1":{
                    "name":"keyword.control"
                }
            }
        },
        "typeFunctions":{
            "match":"\\b(enum|struct|array)$",
            "captures":{
                "1":{
                    "name":"keyword.control"
                }
            }
        },
        "operators":{
            "match":"\\b(lt|lte|eq|gt|gte|is|add|sub|mul|div|not|mod|pow|inc|dec)$",
            "captures":{
                "1":{
                    "name":"keyword"
                }
            }
        },
        "logicOperators":{
            "match":"\\b(and|or)$",
            "captures":{
                "1":{
                    "name":"keyword"
                }
            }
        },
        "number":{
            "match":"-?(\\d+\\.\\d+|\\.\\d+|\\d+)+",
            "name":"entity.name.type"
        },
        "constValue":{
            "match":"\\b(true|false|null|undefined|convo|__args|__return|__error|__debug|__disableAutoComplete)\\b",
            "name":"constant.language"
        },
        "heredoc":{
            "begin":"-{3,}",
            "end":"-{3,}",
            "beginCaptures":{
                "0":{"name":"comment"}
            },
            "endCaptures":{
                "0":{"name":"comment"}
            },
            "patterns": [
                {"include":"#expression"}
            ]
        },
        "pipe":{
            "match":"<<",
            "name":"keyword.control"
        },

        "fenced_code_block": {
            "patterns": [
                {"include": "#fenced_code_block_json"},
                {"include": "#fenced_code_block_xml"},
                {"include": "#fenced_code_block_js"},
                {"include": "#fenced_code_block_python"},
            ]
        },

        "fenced_code_block_json": {
      "begin": "(^|\\G)(\\s*)(`{3,}|~{3,})\\s*(?i:(json|json5|sublime-settings|sublime-menu|sublime-keymap|sublime-mousemap|sublime-theme|sublime-build|sublime-project|sublime-completions)((\\s+|:|,|\\{|\\?)[^`]*)?$)",
      "name": "markup.fenced_code.block.markdown",
      "end": "(^|\\G)(\\2|\\s{0,3})(\\3)\\s*$",
      "beginCaptures": {
        "3": {
          "name": "punctuation.definition.markdown"
        },
        "4": {
          "name": "fenced_code.block.language.markdown"
        },
        "5": {
          "name": "fenced_code.block.language.attributes.markdown"
        }
      },
      "endCaptures": {
        "3": {
          "name": "punctuation.definition.markdown"
        }
      },
      "patterns": [
        {
          "begin": "(^|\\G)(\\s*)(.*)",
          "while": "(^|\\G)(?!\\s*([`~]{3,})\\s*$)",
          "contentName": "meta.embedded.block.json",
          "patterns": [
            {
              "include": "source.json"
            }
          ]
        }
      ]
    },

    "fenced_code_block_xml": {
      "begin": "(^|\\G)(\\s*)(`{3,}|~{3,})\\s*(?i:(xml|xsd|tld|jsp|pt|cpt|dtml|rss|opml)((\\s+|:|,|\\{|\\?)[^`]*)?$)",
      "name": "markup.fenced_code.block.markdown",
      "end": "(^|\\G)(\\2|\\s{0,3})(\\3)\\s*$",
      "beginCaptures": {
        "3": {
          "name": "punctuation.definition.markdown"
        },
        "4": {
          "name": "fenced_code.block.language.markdown"
        },
        "5": {
          "name": "fenced_code.block.language.attributes.markdown"
        }
      },
      "endCaptures": {
        "3": {
          "name": "punctuation.definition.markdown"
        }
      },
      "patterns": [
        {
          "begin": "(^|\\G)(\\s*)(.*)",
          "while": "(^|\\G)(?!\\s*([`~]{3,})\\s*$)",
          "contentName": "meta.embedded.block.xml",
          "patterns": [
            {
              "include": "text.xml"
            }
          ]
        }
      ]
    },

    "fenced_code_block_js": {
      "begin": "(^|\\G)(\\s*)(`{3,}|~{3,})\\s*(?i:(js|jsx|javascript|es6|mjs|cjs|dataviewjs|\\{\\.js.+?\\})((\\s+|:|,|\\{|\\?)[^`]*)?$)",
      "name": "markup.fenced_code.block.markdown",
      "end": "(^|\\G)(\\2|\\s{0,3})(\\3)\\s*$",
      "beginCaptures": {
        "3": {
          "name": "punctuation.definition.markdown"
        },
        "4": {
          "name": "fenced_code.block.language.markdown"
        },
        "5": {
          "name": "fenced_code.block.language.attributes.markdown"
        }
      },
      "endCaptures": {
        "3": {
          "name": "punctuation.definition.markdown"
        }
      },
      "patterns": [
        {
          "begin": "(^|\\G)(\\s*)(.*)",
          "while": "(^|\\G)(?!\\s*([`~]{3,})\\s*$)",
          "contentName": "meta.embedded.block.javascript",
          "patterns": [
            {
              "include": "source.js"
            }
          ]
        }
      ]
    },

    "fenced_code_block_python": {
      "begin": "(^|\\G)(\\s*)(`{3,}|~{3,})\\s*(?i:(python|py|py3|rpy|pyw|cpy|SConstruct|Sconstruct|sconstruct|SConscript|gyp|gypi|\\{\\.python.+?\\})((\\s+|:|,|\\{|\\?)[^`]*)?$)",
      "name": "markup.fenced_code.block.markdown",
      "end": "(^|\\G)(\\2|\\s{0,3})(\\3)\\s*$",
      "beginCaptures": {
        "3": {
          "name": "punctuation.definition.markdown"
        },
        "4": {
          "name": "fenced_code.block.language.markdown"
        },
        "5": {
          "name": "fenced_code.block.language.attributes.markdown"
        }
      },
      "endCaptures": {
        "3": {
          "name": "punctuation.definition.markdown"
        }
      },
      "patterns": [
        {
          "begin": "(^|\\G)(\\s*)(.*)",
          "while": "(^|\\G)(?!\\s*([`~]{3,})\\s*$)",
          "contentName": "meta.embedded.block.python",
          "patterns": [
            {
              "include": "source.python"
            }
          ]
        }
      ]
    },


    }

}


