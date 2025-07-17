// to inspect grammar tokens
// open command palette (ctrl+shift+p)
// Search "Inspect Editor Tokens and Scopes"
// or (shift+alt+cmd+i)
/**
 * Convo-Lang grammar
 */
export const convoGrammar={
    "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
    "name":"convo",
    "scopeName": "source.convo",
    "autoLoadMdCodeBlocks":true,
    "embeddedLangsLazy": [
        "json","xml","javascript","python"
    ],
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
                { "include": "#controlFlowStatements"},
                { "include": "#insert"},
                { "include": "#nop"},
                { "include": "#function"},
                { "include": "#role" },
                { "include": "#functionBody"},
                { "include": "#msgStringStartMsg"},
                { "include": "#msgStringBackslash"},
                { "include": "#embedEscape" },
                { "include": "#embed" },
                { "include": "#markdownLink" },
                { "include": "#xml" },
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
            "begin": "^\\s*(>)\\s*(do|triggerResult|result|define|debug|trigger|end)",
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
                {"include":"#bodyComment"},
                {"include":"#tag"},
                {"include":"#functionCall"},
                {"include":"#paramLineExpression"}
            ]
        },
        "controlFlowStatements":{
            "match": "^\\s*(>)\\s*(parallelEnd|parallel|insertEnd|agentEnd|queue|flush)",
            "captures": {
                "1":{
                    "name":"keyword.control"
                },
                "2":{
                    "name":"keyword.control"
                }
            }
        },
        "insert":{
            "match": "^\\s*(>)\\s*(insert)\\s*((before|after)|(\\w+))\\s*(.*)",
            "captures": {
                "1":{
                    "name":"keyword.control"
                },
                "2":{
                    "name":"keyword.control"
                },
                "4":{
                    "name":"storage.modifier"
                },
                "5":{
                    "name":"invalid"
                },
                "6":{
                    "name":"string"
                }
            }
        },
        "nop":{
            "match": "^\\s*(>)\\s*(nop)(\\s*|\\s(.*))$",
            "captures": {
                "1":{
                    "name":"keyword.control"
                },
                "2":{
                    "name":"constant.character.escape"
                },
                "3":{
                    "name":"comment"
                }
            }
        },
        "function":{
            "begin": "^\\s*(>)\\s*(agent|public|local)?\\s*(\\w+)?\\s+(\\w+)\\s*([\\*\\?!]*)\\s*(\\()",
            "end": "\\)",
            "beginCaptures": {
                "1":{
                    "name":"keyword.control"
                },
                "2":{
                    "name":"keyword.control"
                },
                "3":{
                    "name":"storage.modifier"
                },
                "4":{
                    "name":"support.function"
                },
                "5":{
                    "name":"entity.name.type"
                },
                "6":{
                    "name":"keyword.control"
                }
            },
            "endCaptures": {
                "0":{
                    "name":"keyword.control"
                }
            },
            "patterns": [
                {"include":"#bodyComment"},
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
                    "name":"keyword.control"
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
                {"include":"#bodyComment"},
                {"include":"#tag"},
                {"include":"#functionCall"},
                {"include":"#lineExpression"}
            ]
        },
        "functionCall":{
            "patterns": [
                { "include": "#functionCallSystem"},
                { "include": "#functionCallOperator"},
                { "include": "#functionCallLogic"},
                { "include": "#functionCallType"},
                { "include": "#functionCallDefault"}
            ]
        },
        "functionCallSystem":{
            "begin":"(elif|if|else|while|break|foreach|for|in|do|then|fn|return|case|default|switch|test)\\s*(\\()",
            "end":"\\)",
            "beginCaptures": {
                "1":{
                    "name":"keyword.control"
                },
                "2":{
                    "name":"keyword.control"
                }
            },
            "endCaptures":{
                "0":{
                    "name":"keyword.control"
                }
            },
            "patterns": [
                { "include": "#lineExpression" }
            ]
        },
        "functionCallOperator":{
            "begin":"(lt|lte|eq|gt|gte|is|add|sub|mul|div|not|mod|pow|inc|dec)\\s*(\\()",
            "end":"\\)",
            "beginCaptures": {
                "1":{
                    "name":"constant.character.escape"
                },
                "2":{
                    "name":"constant.character.escape"
                }
            },
            "endCaptures":{
                "0":{
                    "name":"constant.character.escape"
                }
            },
            "patterns": [
                { "include": "#lineExpression" }
            ]
        },
        "functionCallType":{
            "begin":"(enum|struct|array)\\s*(\\()",
            "end":"\\)",
            "beginCaptures": {
                "1":{
                    "name":"keyword.control"
                },
                "2":{
                    "name":"keyword.control"
                }
            },
            "endCaptures":{
                "0":{
                    "name":"keyword.control"
                }
            },
            "patterns": [
                { "include": "#lineExpression" }
            ]
        },
        "functionCallLogic":{
            "begin":"(and|or)\\s*(\\()",
            "end":"\\)",
            "beginCaptures": {
                "1":{
                    "name":"keyword"
                },
                "2":{
                    "name":"keyword"
                }
            },
            "endCaptures":{
                "0":{
                    "name":"keyword"
                }
            },
            "patterns": [
                { "include": "#lineExpression" }
            ]
        },
        "functionCallDefault":{
            "begin":"(\\w+)\\s*(\\()",
            "end":"\\)",
            "beginCaptures": {
                "1":{
                    "name":"support.function"
                },
                "2":{
                    "name":"support.function"
                }
            },
            "endCaptures":{
                "0":{
                    "name":"support.function"
                }
            },
            "patterns": [
                { "include": "#lineExpression" }
            ]
        },
        "bodyComment":{
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
        "comment":{
            "patterns":[
                {
                    "match":"^\\s*#.*",
                    "name":"comment"
                },
                {
                    "match":"^\\s*//.*",
                    "name":"emphasis",
                    "captures":{
                        "0":{"name":"comment"}
                    }
                }
            ]
        },
        "tag":{
            "match":"^\\s*(@)((on\\s+(.*))|(json\\s+(.*))|((condition|disabled)\\s*(=\\s*(.*)))|((\\w+)\\s*=?\\s*(.*)))",
            "captures":{
                "1":{"name":"entity.name.tag"},
                "3":{"name":"entity.name.tag"},
                "4":{"patterns": [{"include":"#tagEvent"}]},

                "5":{"name":"entity.name.tag"},
                "6":{"name": "entity.name.type"},

                "8":{"name":"entity.name.tag"},
                "10":{"patterns": [{"include":"#lineExpression"}]},

                "12":{"name":"entity.name.tag"},
                "13":{"name":"string"}
            }
        },
        "tagEvent":{
            "match":"((user[\\s$]|assistant[\\s$])|\\w+)\\s*((=(.*))|(.*))?",
            "captures":{
                "1":{"name":"string"},
                "2":{"name":"entity.name.type"},

                "5":{"patterns": [{"include":"#lineExpression"}]},
                "6":{"name":"invalid.illegal"}
            }
        },

        "tagEventFallback":{
            "match":"(\\w+)(.*)?",
            "captures":{
                "1":{"name":"entity.name.type"},
                "2":{"name":"string"}
            }

        },
        "lineExpression":{
            "patterns":[
                {"include":"#bodyComment"},
                {"include":"#tag"},
                {"include":"#heredoc"},
                {"include":"#stringPrompt"},
                {"include":"#stringEmbed"},
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
                {"include":"#bodyComment"},
                {"include":"#tag"},
                {"include":"#heredoc"},
                {"include":"#stringPrompt"},
                {"include":"#stringEmbed"},
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
        "stringPrompt":{
            "begin":"(\\?\\?\\?)\\s*((\\()([^)]*)(\\)))?",
            "end":"\\?\\?\\?",
            "beginCaptures":{
                "1":{"name":"constant.character.escape"},
                "3":{"name":"constant.character.escape"},
                "4":{
                    "patterns": [
                        {"include":"#stringMods"}
                    ]
                },
                "5":{"name":"constant.character.escape"}
            },
            "endCaptures":{
                "0":{"name":"constant.character.escape"}
            },
            "patterns": [
                {"include":"#expression"}
            ]
        },
        "stringEmbed":{
            "begin":"(===)\\s*((\\()([^)]*)(\\)))?",
            "end":"===",
            "beginCaptures":{
                "1":{"name":"constant.character.escape"},
                "3":{"name":"constant.character.escape"},
                "4":{
                    "patterns": [
                        {"include":"#stringMods"}
                    ]
                },
                "5":{"name":"constant.character.escape"}
            },
            "endCaptures":{
                "0":{"name":"constant.character.escape"}
            },
            "patterns": [
                {"include":"#expression"}
            ]
        },
        "stringMods":{
            "match":"(((task)\\s*:(.*))|(\\+|\\*)|(system|functions|transforms|replace|replaceForModel|append|prepend|prefix|suffix|respond)|(boolean)|((\\w+)\\s*:\\s*(\\w+\\[?\\]?))|(/\\w+)|((\\w+)\\s*=)|(>>)|(!))",
            "captures":{

                "3":{"name":"variable"},
                "4":{"name":"comment"},

                "5":{"name":"keyword.control"},
                "6":{"name":"keyword.modifier"},
                "7":{"name":"keyword.modifier"},
                "9":{"name":"entity.name.type"},
                "10":{"name":"entity.name.type"},
                "11":{"name":"keyword.modifier"},
                "13":{"name":"variable"},

                "14":{"name":"keyword.control"},

                "15":{"name":"keyword.modifier"}
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
            "match":"(!?\\[)([^\\]]*)(\\])(\\()([^\\)]*)(\\))",
            "captures":{
                "1":{"name":"keyword.control"},
                "2":{"name":"comment"},
                "3":{"name":"keyword.control"},
                "4":{"name":"keyword.control"},
                "5":{"name":"string"},
                "6":{"name":"keyword.control"}
            }
        },
        "xml":{
            "match":"(</?)([\\w-]+)([^>]*?)(/?>)",
            "captures":{
                "1":{"name":"entity.name.type"},
                "2":{"name":"entity.name.type"},
                "3":{
                    "patterns": [
                        {"include": "#xmlAttDbl"},
                        {"include": "#xmlAttSingle"},
                        {"include": "#xmlAtt"}
                    ]
                },
                "4":{"name":"entity.name.type"}
            }
        },
        "xmlAtt":{
            "match":"\\w+",
            "captures":{
                "0":{"name":"variable"}
            }
        },
        "xmlAttDbl":{
            "match":"(\\w+)\\s*=\\s*(\"[^\"]*\")",
            "captures":{
                "1":{"name":"variable"},
                "2":{"name":"string"}
            }
        },
        "xmlAttSingle":{
            "match":"(\\w+)\\s*=\\s*('[^']*')",
            "captures":{
                "1":{"name":"variable"},
                "2":{"name":"string"}
            }
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
                {"include": "#fenced_code_block_python"}
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
    }


    }

}
