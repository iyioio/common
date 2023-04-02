import { mkdirSync, writeFileSync } from "fs";
import { protoMarkdownParseNodes, protoMarkdownRenderLines } from "./markdown-2";
import { protoMergeNodes } from "./protogen-node";

// update mdTestOutputs and mdParsed by setting NX_WRITE_PROTOGEN_TEST_OUTPUT to true
// then copying and passing the test output files. Update mdParsed first, run the test
// again then update mdTestOutput. After updating tests should pass.
//
// .protogen-testing/parsed.json -> mdParsed
// .protogen-testing/mdTestOutput.md -> mdTestOutput

const nSep='\n\n+++++++++++++++++++++++++++++\n\n';

const writeTestOutput=process.env['NX_WRITE_PROTOGEN_TEST_OUTPUT']==='true';

describe('markdown',()=>{

    it('should parse markdown',()=>{

        if(writeTestOutput){
            mkdirSync('./.protogen-testing',{recursive:true});
        }

        const {rootNodes:parsed,allNodes}=protoMarkdownParseNodes(mdSource);
        //console.log(parsed);
        if(writeTestOutput){
            writeFileSync('.protogen-testing/parsed.json',JSON.stringify(parsed,null,4));
            writeFileSync('.protogen-testing/allNodes.json',JSON.stringify(allNodes,null,4));
            writeFileSync('.protogen-testing/short-allNodes.json',JSON.stringify(allNodes.map(n=>({address:n.address,name:n.name})),null,4));
            writeFileSync('.protogen-testing/mdTestOutput.md',[
                protoMarkdownRenderLines(allNodes).join('\n'),
                protoMarkdownRenderLines(allNodes,0).join('\n'),
                protoMarkdownRenderLines(allNodes,1).join('\n'),
                protoMarkdownRenderLines(allNodes,2).join('\n'),
            ].join(nSep).replace(/`/g,'\\`'));
        }

        expect(parsed).toMatchObject(mdParsed);
        expect(mdParsed).toMatchObject(parsed);


        const mdParts=mdTestOutput.split(nSep);
        expect(protoMarkdownRenderLines(allNodes).join('\n')).toBe(mdParts[0]);

        const render0=protoMarkdownRenderLines(allNodes,0).join('\n');
        expect(render0).toBe(mdParts[1]);

        const render1=protoMarkdownRenderLines(allNodes,1).join('\n');
        expect(render1).toBe(mdParts[2]);

        const render2=protoMarkdownRenderLines(allNodes,2).join('\n');
        expect(render2).toBe(mdParts[3]);

        const nodes0=protoMarkdownParseNodes(render0);
        if(writeTestOutput){
            writeFileSync('.protogen-testing/allNodes-before-merge.json',JSON.stringify(nodes0.allNodes,null,4));
            writeFileSync('.protogen-testing/short-allNodes-before-merge.json',JSON.stringify(nodes0.allNodes.map(n=>({address:n.address,name:n.name})),null,4));
        }
        protoMergeNodes(nodes0.allNodes,allNodes);

        if(writeTestOutput){
            writeFileSync('.protogen-testing/allNodes-merged.json',JSON.stringify(nodes0.allNodes,null,4));
            writeFileSync('.protogen-testing/short-allNodes-merged.json',JSON.stringify(nodes0.allNodes.map(n=>({address:n.address,name:n.name})),null,4));
        }
        expect(nodes0.allNodes).toMatchObject(allNodes);
        expect(allNodes).toMatchObject(nodes0.allNodes);



    });
});

///////////////////////////
// mdSource              //
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////

const mdSource=
`Ungrouped content here
+ list item 2
+ content 2

## Thread: struct
A collection of Posts that can be displayed
as a space, session, chat or any other view
that represents a time series of events
and content.

- id string (key)
- uv number
  Used to sync access
  Add 1 to uv each time updating
  Other uses
    + deny out of sync writes
    + track number of changes

- $trigger: abc

- post Post[]
  - name: string
  - name: number
  - ownerId: string :User * (fon)
    - (managed)
  - tracker
  \`\`\` ts
  - invalid ts here
  getTrackers().find(t=>t.ready)
  \`\`\`

  - weight: number
    - [User weight](User.weight)


## User (dude)
- id: string
- name: string
- age: int
- weight: number
- likes: number

## UserView: comp (ui)
- model: User
- title
  - $src: .model.likes
- age
  - $src: User.age
- brokenPropLink
  - $src: .notAProp.age
- brokenTypeLink
  - $src: NotAType.age


## SettingsView: comp
- model: User
- name
  - $link: User.name
- age
  - $link: .model.age

----

Unattached comments

## CopyType
- name: string

## CopyType
- age: string
  [Check age]($1)



###### $1
Is older that 21?
- yes
- no

###### OtherType
- prop1: string
`;

///////////////////////////
// mdTestOutput          //
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////

const mdTestOutput=`Ungrouped content here
+ list item 2
+ content 2

## Thread: struct
A collection of Posts that can be displayed
as a space, session, chat or any other view
that represents a time series of events
and content.

- id string (key)
- uv number
  Used to sync access
  Add 1 to uv each time updating
  Other uses
    + deny out of sync writes
    + track number of changes

- $trigger: abc

- post Post[]
  - name: string
  - name: number
  - ownerId: string :User * (fon)
    - (managed)
  - tracker
  \`\`\` ts
  - invalid ts here
  getTrackers().find(t=>t.ready)
  \`\`\`

  - weight: number
    - [User weight](User.weight)


## User (dude)
- id: string
- name: string
- age: int
- weight: number
- likes: number

## UserView: comp (ui)
- model: User
- title
  - $src: .model.likes
- age
  - $src: User.age
- brokenPropLink
  - $src: .notAProp.age
- brokenTypeLink
  - $src: NotAType.age


## SettingsView: comp
- model: User
- name
  - $link: User.name
- age
  - $link: .model.age

----

Unattached comments

## CopyType
- name: string

## CopyType
- age: string
  [Check age]($1)



###### $1
Is older that 21?
- yes
- no

###### OtherType
- prop1: string


+++++++++++++++++++++++++++++

## Thread: struct
## User (dude)
## UserView: comp (ui)
## SettingsView: comp
## CopyType
## CopyType
###### $1
Is older that 21?
- yes
- no
###### OtherType

+++++++++++++++++++++++++++++

Ungrouped content here
+ list item 2
+ content 2

## Thread: struct
A collection of Posts that can be displayed
as a space, session, chat or any other view
that represents a time series of events
and content.

- id string (key)
- uv number
- $trigger: abc
- post Post[]
## User (dude)
- id: string
- name: string
- age: int
- weight: number
- likes: number
## UserView: comp (ui)
- model: User
- title
- age
- brokenPropLink
- brokenTypeLink


## SettingsView: comp
- model: User
- name
- age
----

Unattached comments

## CopyType
- name: string
## CopyType
- age: string
###### $1
Is older that 21?
- yes
- no
###### OtherType
- prop1: string

+++++++++++++++++++++++++++++

Ungrouped content here
+ list item 2
+ content 2

## Thread: struct
A collection of Posts that can be displayed
as a space, session, chat or any other view
that represents a time series of events
and content.

- id string (key)
- uv number
  Used to sync access
  Add 1 to uv each time updating
  Other uses
    + deny out of sync writes
    + track number of changes

- $trigger: abc
- post Post[]
  - name: string
  - name: number
  - ownerId: string :User * (fon)
  - tracker
  \`\`\` ts
  - invalid ts here
  getTrackers().find(t=>t.ready)
  \`\`\`

  - weight: number
## User (dude)
- id: string
- name: string
- age: int
- weight: number
- likes: number
## UserView: comp (ui)
- model: User
- title
  - $src: .model.likes
- age
  - $src: User.age
- brokenPropLink
  - $src: .notAProp.age
- brokenTypeLink
  - $src: NotAType.age


## SettingsView: comp
- model: User
- name
  - $link: User.name
- age
  - $link: .model.age
----

Unattached comments

## CopyType
- name: string
## CopyType
- age: string
  [Check age]($1)



###### $1
Is older that 21?
- yes
- no
###### OtherType
- prop1: string`




///////////////////////////
// mdParsed              //
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////

const mdParsed=[
    {
        "name": "#",
        "address": "#",
        "type": "",
        "types": [
            {
                "type": ""
            }
        ],
        "value": "Ungrouped content here\n+ list item 2\n+ content 2\n",
        "parserMetadata": {
            "indent": "",
            "input": "Ungrouped content here\n+ list item 2\n+ content 2\n",
            "depth": 1
        },
        "isContent": true
    },
    {
        "name": "Thread",
        "address": "Thread",
        "type": "struct",
        "types": [
            {
                "type": "struct"
            }
        ],
        "value": "struct",
        "parserMetadata": {
            "input": "## Thread: struct",
            "depth": 0,
            "before": "#"
        },
        "children": {
            "#": {
                "name": "#",
                "address": "Thread.#",
                "type": "",
                "types": [
                    {
                        "type": ""
                    }
                ],
                "value": "A collection of Posts that can be displayed\nas a space, session, chat or any other view\nthat represents a time series of events\nand content.\n",
                "parserMetadata": {
                    "indent": "",
                    "input": "A collection of Posts that can be displayed\nas a space, session, chat or any other view\nthat represents a time series of events\nand content.\n",
                    "depth": 1,
                    "before": "Thread"
                },
                "isContent": true
            },
            "id": {
                "name": "id",
                "address": "Thread.id",
                "type": "string",
                "types": [
                    {
                        "type": "string"
                    }
                ],
                "value": "string (key)",
                "parserMetadata": {
                    "input": "- id string (key)",
                    "depth": 1,
                    "before": "Thread.#"
                },
                "tags": [
                    "key"
                ]
            },
            "uv": {
                "name": "uv",
                "address": "Thread.uv",
                "type": "number",
                "types": [
                    {
                        "type": "number"
                    }
                ],
                "value": "number",
                "parserMetadata": {
                    "input": "- uv number",
                    "depth": 1,
                    "before": "Thread.id"
                },
                "children": {
                    "#": {
                        "name": "#",
                        "address": "Thread.uv.#",
                        "type": "",
                        "types": [
                            {
                                "type": ""
                            }
                        ],
                        "value": "Used to sync access\nAdd 1 to uv each time updating\nOther uses\n  + deny out of sync writes\n  + track number of changes\n",
                        "parserMetadata": {
                            "indent": "  ",
                            "input": "  Used to sync access\n  Add 1 to uv each time updating\n  Other uses\n    + deny out of sync writes\n    + track number of changes\n",
                            "depth": 2,
                            "before": "Thread.uv"
                        },
                        "isContent": true
                    }
                }
            },
            "$trigger": {
                "name": "$trigger",
                "address": "Thread.$trigger",
                "type": "abc",
                "types": [
                    {
                        "type": "abc"
                    }
                ],
                "value": "abc",
                "parserMetadata": {
                    "input": "- $trigger: abc",
                    "depth": 1,
                    "before": "Thread.uv.#"
                },
                "special": true,
                "children": {
                    "#": {
                        "name": "#",
                        "address": "Thread.$trigger.#",
                        "type": "",
                        "types": [
                            {
                                "type": ""
                            }
                        ],
                        "value": "",
                        "parserMetadata": {
                            "indent": "",
                            "input": "",
                            "depth": 1,
                            "before": "Thread.$trigger"
                        },
                        "isContent": true
                    }
                }
            },
            "post": {
                "name": "post",
                "address": "Thread.post",
                "type": "Post",
                "isArray": true,
                "types": [
                    {
                        "type": "Post",
                        "isArray": true
                    }
                ],
                "value": "Post[]",
                "parserMetadata": {
                    "input": "- post Post[]",
                    "depth": 1,
                    "before": "Thread.$trigger.#"
                },
                "children": {
                    "name": {
                        "name": "name",
                        "address": "Thread.post.name",
                        "type": "string",
                        "types": [
                            {
                                "type": "string"
                            }
                        ],
                        "value": "string",
                        "parserMetadata": {
                            "input": "  - name: string",
                            "depth": 2,
                            "before": "Thread.post"
                        }
                    },
                    "name#2": {
                        "name": "name",
                        "address": "Thread.post.name#2",
                        "type": "number",
                        "types": [
                            {
                                "type": "number"
                            }
                        ],
                        "value": "number",
                        "parserMetadata": {
                            "input": "  - name: number",
                            "depth": 2,
                            "before": "Thread.post.name"
                        }
                    },
                    "ownerId": {
                        "name": "ownerId",
                        "address": "Thread.post.ownerId",
                        "type": "string",
                        "types": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "User",
                                "flags": [
                                    "*"
                                ]
                            }
                        ],
                        "value": "string :User * (fon)",
                        "parserMetadata": {
                            "input": "  - ownerId: string :User * (fon)",
                            "depth": 2,
                            "before": "Thread.post.name#2"
                        },
                        "refType": {
                            "type": "User",
                            "flags": [
                                "*"
                            ]
                        },
                        "tags": [
                            "fon",
                            "managed"
                        ],
                        "children": {
                            "#": {
                                "name": "#",
                                "address": "Thread.post.ownerId.#",
                                "type": "",
                                "types": [
                                    {
                                        "type": ""
                                    }
                                ],
                                "value": "(managed)",
                                "parserMetadata": {
                                    "indent": "    ",
                                    "input": "    - (managed)",
                                    "depth": 3,
                                    "before": "Thread.post.ownerId"
                                },
                                "isContent": true
                            }
                        },
                        "links": [
                            {
                                "name": "User",
                                "address": "User",
                                "low": true
                            }
                        ]
                    },
                    "tracker": {
                        "name": "tracker",
                        "address": "Thread.post.tracker",
                        "type": "",
                        "types": [
                            {
                                "type": ""
                            }
                        ],
                        "value": "",
                        "parserMetadata": {
                            "input": "  - tracker",
                            "depth": 2,
                            "before": "Thread.post.ownerId.#"
                        },
                        "children": {
                            "#": {
                                "name": "#",
                                "address": "Thread.post.tracker.#",
                                "type": "",
                                "types": [
                                    {
                                        "type": ""
                                    }
                                ],
                                "value": "``` ts\ninvalid ts here\ngetTrackers().find(t=>t.ready)\n```\n",
                                "parserMetadata": {
                                    "indent": "  ",
                                    "input": "  ``` ts\n  - invalid ts here\n  getTrackers().find(t=>t.ready)\n  ```\n",
                                    "depth": 2,
                                    "before": "Thread.post.tracker"
                                },
                                "isContent": true
                            }
                        }
                    },
                    "weight": {
                        "name": "weight",
                        "address": "Thread.post.weight",
                        "type": "number",
                        "types": [
                            {
                                "type": "number"
                            }
                        ],
                        "value": "number",
                        "parserMetadata": {
                            "input": "  - weight: number",
                            "depth": 2,
                            "before": "Thread.post.tracker.#"
                        },
                        "children": {
                            "#": {
                                "name": "#",
                                "address": "Thread.post.weight.#",
                                "type": "",
                                "types": [
                                    {
                                        "type": ""
                                    }
                                ],
                                "value": "[User weight](User.weight)\n\n",
                                "parserMetadata": {
                                    "indent": "    ",
                                    "input": "    - [User weight](User.weight)\n\n",
                                    "depth": 3,
                                    "before": "Thread.post.weight"
                                },
                                "isContent": true
                            }
                        },
                        "links": [
                            {
                                "name": "User weight",
                                "address": "User.weight"
                            }
                        ]
                    }
                },
                "links": [
                    {
                        "name": "Post",
                        "address": "Post",
                        "broken": true
                    }
                ]
            }
        }
    },
    {
        "name": "User",
        "address": "User",
        "type": "",
        "types": [
            {
                "type": ""
            }
        ],
        "value": "(dude)",
        "parserMetadata": {
            "input": "## User (dude)",
            "depth": 0,
            "before": "Thread.post.weight.#"
        },
        "tags": [
            "dude"
        ],
        "children": {
            "id": {
                "name": "id",
                "address": "User.id",
                "type": "string",
                "types": [
                    {
                        "type": "string"
                    }
                ],
                "value": "string",
                "parserMetadata": {
                    "input": "- id: string",
                    "depth": 1,
                    "before": "User"
                }
            },
            "name": {
                "name": "name",
                "address": "User.name",
                "type": "string",
                "types": [
                    {
                        "type": "string"
                    }
                ],
                "value": "string",
                "parserMetadata": {
                    "input": "- name: string",
                    "depth": 1,
                    "before": "User.id"
                },
                "links": [
                    {
                        "name": "name",
                        "address": "SettingsView.name",
                        "rev": true,
                        "low": true
                    }
                ]
            },
            "age": {
                "name": "age",
                "address": "User.age",
                "type": "int",
                "types": [
                    {
                        "type": "int"
                    }
                ],
                "value": "int",
                "parserMetadata": {
                    "input": "- age: int",
                    "depth": 1,
                    "before": "User.name"
                },
                "links": [
                    {
                        "name": "age",
                        "address": "UserView.age",
                        "rev": true,
                        "low": true,
                        "src": true
                    },
                    {
                        "name": "age",
                        "address": "SettingsView.age",
                        "rev": true,
                        "low": true
                    }
                ]
            },
            "weight": {
                "name": "weight",
                "address": "User.weight",
                "type": "number",
                "types": [
                    {
                        "type": "number"
                    }
                ],
                "value": "number",
                "parserMetadata": {
                    "input": "- weight: number",
                    "depth": 1,
                    "before": "User.age"
                },
                "links": [
                    {
                        "name": "weight",
                        "address": "Thread.post.weight",
                        "rev": true,
                        "low": true
                    }
                ]
            },
            "likes": {
                "name": "likes",
                "address": "User.likes",
                "type": "number",
                "types": [
                    {
                        "type": "number"
                    }
                ],
                "value": "number",
                "parserMetadata": {
                    "input": "- likes: number",
                    "depth": 1,
                    "before": "User.weight"
                },
                "children": {
                    "#": {
                        "name": "#",
                        "address": "User.likes.#",
                        "type": "",
                        "types": [
                            {
                                "type": ""
                            }
                        ],
                        "value": "",
                        "parserMetadata": {
                            "indent": "",
                            "input": "",
                            "depth": 1,
                            "before": "User.likes"
                        },
                        "isContent": true
                    }
                },
                "links": [
                    {
                        "name": "title",
                        "address": "UserView.title",
                        "rev": true,
                        "low": true,
                        "src": true
                    }
                ]
            }
        },
        "links": [
            {
                "name": "ownerId",
                "address": "Thread.post.ownerId",
                "rev": true,
                "low": true
            },
            {
                "name": "model",
                "address": "UserView.model",
                "rev": true,
                "low": true
            },
            {
                "name": "model",
                "address": "SettingsView.model",
                "rev": true,
                "low": true
            }
        ]
    },
    {
        "name": "UserView",
        "address": "UserView",
        "type": "comp",
        "types": [
            {
                "type": "comp"
            }
        ],
        "value": "comp (ui)",
        "parserMetadata": {
            "input": "## UserView: comp (ui)",
            "depth": 0,
            "before": "User.likes.#"
        },
        "tags": [
            "ui"
        ],
        "children": {
            "model": {
                "name": "model",
                "address": "UserView.model",
                "type": "User",
                "types": [
                    {
                        "type": "User"
                    }
                ],
                "value": "User",
                "parserMetadata": {
                    "input": "- model: User",
                    "depth": 1,
                    "before": "UserView"
                },
                "links": [
                    {
                        "name": "User",
                        "address": "User"
                    }
                ]
            },
            "title": {
                "name": "title",
                "address": "UserView.title",
                "type": "",
                "types": [
                    {
                        "type": ""
                    }
                ],
                "value": "",
                "parserMetadata": {
                    "input": "- title",
                    "depth": 1,
                    "before": "UserView.model"
                },
                "children": {
                    "$src": {
                        "name": "$src",
                        "address": "UserView.title.$src",
                        "type": "model",
                        "types": [
                            {
                                "type": "model"
                            },
                            {
                                "type": "likes"
                            }
                        ],
                        "value": ".model.likes",
                        "parserMetadata": {
                            "input": "  - $src: .model.likes",
                            "depth": 2,
                            "before": "UserView.title"
                        },
                        "refType": {
                            "type": "likes"
                        },
                        "special": true
                    }
                },
                "sourceAddress": "User.likes",
                "sourceLinked": true,
                "links": [
                    {
                        "name": "User.likes",
                        "address": "User.likes",
                        "low": true,
                        "src": true
                    }
                ]
            },
            "age": {
                "name": "age",
                "address": "UserView.age",
                "type": "",
                "types": [
                    {
                        "type": ""
                    }
                ],
                "value": "",
                "parserMetadata": {
                    "input": "- age",
                    "depth": 1,
                    "before": "UserView.title.$src"
                },
                "children": {
                    "$src": {
                        "name": "$src",
                        "address": "UserView.age.$src",
                        "type": "User",
                        "types": [
                            {
                                "type": "User"
                            },
                            {
                                "type": "age"
                            }
                        ],
                        "value": "User.age",
                        "parserMetadata": {
                            "input": "  - $src: User.age",
                            "depth": 2,
                            "before": "UserView.age"
                        },
                        "refType": {
                            "type": "age"
                        },
                        "special": true
                    }
                },
                "sourceAddress": "User.age",
                "sourceLinked": true,
                "links": [
                    {
                        "name": "User.age",
                        "address": "User.age",
                        "low": true,
                        "src": true
                    }
                ]
            },
            "brokenPropLink": {
                "name": "brokenPropLink",
                "address": "UserView.brokenPropLink",
                "type": "",
                "types": [
                    {
                        "type": ""
                    }
                ],
                "value": "",
                "parserMetadata": {
                    "input": "- brokenPropLink",
                    "depth": 1,
                    "before": "UserView.age.$src"
                },
                "children": {
                    "$src": {
                        "name": "$src",
                        "address": "UserView.brokenPropLink.$src",
                        "type": "notAProp",
                        "types": [
                            {
                                "type": "notAProp"
                            },
                            {
                                "type": "age"
                            }
                        ],
                        "value": ".notAProp.age",
                        "parserMetadata": {
                            "input": "  - $src: .notAProp.age",
                            "depth": 2,
                            "before": "UserView.brokenPropLink"
                        },
                        "refType": {
                            "type": "age"
                        },
                        "special": true
                    }
                },
                "sourceAddress": ".notAProp.age",
                "sourceLinked": false,
                "links": [
                    {
                        "name": ".notAProp.age",
                        "address": ".notAProp.age",
                        "low": true,
                        "src": true,
                        "broken": true
                    }
                ]
            },
            "brokenTypeLink": {
                "name": "brokenTypeLink",
                "address": "UserView.brokenTypeLink",
                "type": "",
                "types": [
                    {
                        "type": ""
                    }
                ],
                "value": "",
                "parserMetadata": {
                    "input": "- brokenTypeLink",
                    "depth": 1,
                    "before": "UserView.brokenPropLink.$src"
                },
                "children": {
                    "$src": {
                        "name": "$src",
                        "address": "UserView.brokenTypeLink.$src",
                        "type": "NotAType",
                        "types": [
                            {
                                "type": "NotAType"
                            },
                            {
                                "type": "age"
                            }
                        ],
                        "value": "NotAType.age",
                        "parserMetadata": {
                            "input": "  - $src: NotAType.age",
                            "depth": 2,
                            "before": "UserView.brokenTypeLink"
                        },
                        "refType": {
                            "type": "age"
                        },
                        "special": true,
                        "children": {
                            "#": {
                                "name": "#",
                                "address": "UserView.brokenTypeLink.$src.#",
                                "type": "",
                                "types": [
                                    {
                                        "type": ""
                                    }
                                ],
                                "value": "\n",
                                "parserMetadata": {
                                    "indent": "",
                                    "input": "\n",
                                    "depth": 1,
                                    "before": "UserView.brokenTypeLink.$src"
                                },
                                "isContent": true
                            }
                        }
                    }
                },
                "sourceAddress": "NotAType.age",
                "sourceLinked": false,
                "links": [
                    {
                        "name": "NotAType.age",
                        "address": "NotAType.age",
                        "low": true,
                        "src": true,
                        "broken": true
                    }
                ]
            }
        }
    },
    {
        "name": "SettingsView",
        "address": "SettingsView",
        "type": "comp",
        "types": [
            {
                "type": "comp"
            }
        ],
        "value": "comp",
        "parserMetadata": {
            "input": "## SettingsView: comp",
            "depth": 0,
            "before": "UserView.brokenTypeLink.$src.#"
        },
        "children": {
            "model": {
                "name": "model",
                "address": "SettingsView.model",
                "type": "User",
                "types": [
                    {
                        "type": "User"
                    }
                ],
                "value": "User",
                "parserMetadata": {
                    "input": "- model: User",
                    "depth": 1,
                    "before": "SettingsView"
                },
                "links": [
                    {
                        "name": "User",
                        "address": "User"
                    }
                ]
            },
            "name": {
                "name": "name",
                "address": "SettingsView.name",
                "type": "",
                "types": [
                    {
                        "type": ""
                    }
                ],
                "value": "",
                "parserMetadata": {
                    "input": "- name",
                    "depth": 1,
                    "before": "SettingsView.model"
                },
                "children": {
                    "$link": {
                        "name": "$link",
                        "address": "SettingsView.name.$link",
                        "type": "User",
                        "types": [
                            {
                                "type": "User"
                            },
                            {
                                "type": "name"
                            }
                        ],
                        "value": "User.name",
                        "parserMetadata": {
                            "input": "  - $link: User.name",
                            "depth": 2,
                            "before": "SettingsView.name"
                        },
                        "refType": {
                            "type": "name"
                        },
                        "special": true
                    }
                },
                "links": [
                    {
                        "name": "User.name",
                        "address": "User.name"
                    }
                ]
            },
            "age": {
                "name": "age",
                "address": "SettingsView.age",
                "type": "",
                "types": [
                    {
                        "type": ""
                    }
                ],
                "value": "",
                "parserMetadata": {
                    "input": "- age",
                    "depth": 1,
                    "before": "SettingsView.name.$link"
                },
                "children": {
                    "$link": {
                        "name": "$link",
                        "address": "SettingsView.age.$link",
                        "type": "model",
                        "types": [
                            {
                                "type": "model"
                            },
                            {
                                "type": "age"
                            }
                        ],
                        "value": ".model.age",
                        "parserMetadata": {
                            "input": "  - $link: .model.age",
                            "depth": 2,
                            "before": "SettingsView.age"
                        },
                        "refType": {
                            "type": "age"
                        },
                        "special": true,
                        "children": {
                            "#": {
                                "name": "#",
                                "address": "SettingsView.age.$link.#",
                                "type": "",
                                "types": [
                                    {
                                        "type": ""
                                    }
                                ],
                                "value": "",
                                "parserMetadata": {
                                    "indent": "",
                                    "input": "",
                                    "depth": 1,
                                    "before": "SettingsView.age.$link"
                                },
                                "isContent": true
                            }
                        }
                    }
                },
                "links": [
                    {
                        "name": "User.age",
                        "address": "User.age"
                    }
                ]
            }
        }
    },
    {
        "name": "#",
        "address": "#2",
        "type": "",
        "types": [
            {
                "type": ""
            }
        ],
        "value": "---\n\nUnattached comments\n",
        "parserMetadata": {
            "indent": "",
            "input": "----\n\nUnattached comments\n",
            "depth": 1,
            "before": "SettingsView.age.$link.#"
        },
        "isContent": true
    },
    {
        "name": "CopyType",
        "address": "CopyType",
        "type": "",
        "types": [
            {
                "type": ""
            }
        ],
        "value": "",
        "parserMetadata": {
            "input": "## CopyType",
            "depth": 0,
            "before": "#2"
        },
        "children": {
            "name": {
                "name": "name",
                "address": "CopyType.name",
                "type": "string",
                "types": [
                    {
                        "type": "string"
                    }
                ],
                "value": "string",
                "parserMetadata": {
                    "input": "- name: string",
                    "depth": 1,
                    "before": "CopyType"
                },
                "children": {
                    "#": {
                        "name": "#",
                        "address": "CopyType.name.#",
                        "type": "",
                        "types": [
                            {
                                "type": ""
                            }
                        ],
                        "value": "",
                        "parserMetadata": {
                            "indent": "",
                            "input": "",
                            "depth": 1,
                            "before": "CopyType.name"
                        },
                        "isContent": true
                    }
                }
            }
        }
    },
    {
        "name": "CopyType",
        "address": "CopyType#2",
        "type": "",
        "types": [
            {
                "type": ""
            }
        ],
        "value": "",
        "parserMetadata": {
            "input": "## CopyType",
            "depth": 0,
            "before": "CopyType.name.#"
        },
        "children": {
            "age": {
                "name": "age",
                "address": "CopyType#2.age",
                "type": "string",
                "types": [
                    {
                        "type": "string"
                    }
                ],
                "value": "string",
                "parserMetadata": {
                    "input": "- age: string",
                    "depth": 1,
                    "before": "CopyType#2"
                },
                "children": {
                    "#": {
                        "name": "#",
                        "address": "CopyType#2.age.#",
                        "type": "",
                        "types": [
                            {
                                "type": ""
                            }
                        ],
                        "value": "[Check age]($1)\n\n\n",
                        "parserMetadata": {
                            "indent": "  ",
                            "input": "  [Check age]($1)\n\n\n",
                            "depth": 2,
                            "before": "CopyType#2.age"
                        },
                        "isContent": true
                    }
                },
                "links": [
                    {
                        "name": "Check age",
                        "address": "$1"
                    }
                ]
            }
        }
    },
    {
        "name": "$1",
        "address": "$1",
        "type": "",
        "types": [
            {
                "type": ""
            }
        ],
        "value": "",
        "parserMetadata": {
            "input": "###### $1",
            "depth": 0,
            "before": "CopyType#2.age.#"
        },
        "contentFocused": true,
        "special": true,
        "children": {
            "#": {
                "name": "#",
                "address": "$1.#",
                "type": "",
                "types": [
                    {
                        "type": ""
                    }
                ],
                "value": "Is older that 21?",
                "parserMetadata": {
                    "indent": "",
                    "input": "Is older that 21?",
                    "depth": 1,
                    "before": "$1"
                },
                "isContent": true,
                "importantContent": true
            },
            "yes": {
                "name": "yes",
                "address": "$1.yes",
                "type": "",
                "types": [
                    {
                        "type": ""
                    }
                ],
                "value": "",
                "parserMetadata": {
                    "input": "- yes",
                    "depth": 1,
                    "before": "$1.#"
                },
                "importantContent": true
            },
            "no": {
                "name": "no",
                "address": "$1.no",
                "type": "",
                "types": [
                    {
                        "type": ""
                    }
                ],
                "value": "",
                "parserMetadata": {
                    "input": "- no",
                    "depth": 1,
                    "before": "$1.yes"
                },
                "importantContent": true,
                "children": {
                    "#": {
                        "name": "#",
                        "address": "$1.no.#",
                        "type": "",
                        "types": [
                            {
                                "type": ""
                            }
                        ],
                        "value": "",
                        "parserMetadata": {
                            "indent": "",
                            "input": "",
                            "depth": 1,
                            "before": "$1.no"
                        },
                        "isContent": true
                    }
                }
            }
        },
        "links": [
            {
                "name": "age",
                "address": "CopyType#2.age",
                "rev": true,
                "low": true
            }
        ]
    },
    {
        "name": "OtherType",
        "address": "OtherType",
        "type": "",
        "types": [
            {
                "type": ""
            }
        ],
        "value": "",
        "parserMetadata": {
            "input": "###### OtherType",
            "depth": 0,
            "before": "$1.no.#"
        },
        "children": {
            "prop1": {
                "name": "prop1",
                "address": "OtherType.prop1",
                "type": "string",
                "types": [
                    {
                        "type": "string"
                    }
                ],
                "value": "string",
                "parserMetadata": {
                    "input": "- prop1: string",
                    "depth": 1,
                    "before": "OtherType"
                },
                "children": {
                    "#": {
                        "name": "#",
                        "address": "OtherType.prop1.#",
                        "type": "",
                        "types": [
                            {
                                "type": ""
                            }
                        ],
                        "value": "",
                        "parserMetadata": {
                            "indent": "",
                            "input": "",
                            "depth": 1,
                            "before": "OtherType.prop1"
                        },
                        "isContent": true
                    }
                }
            }
        }
    }
]
