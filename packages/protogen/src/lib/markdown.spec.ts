import { mkdirSync, writeFileSync } from "fs";
import { protoMarkdownParseNodes } from "./markdown-2";
import { protoMergeNodes, protoRenderLines } from "./protogen-node";

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
                protoRenderLines({nodes:allNodes}).join('\n'),
                protoRenderLines({nodes:allNodes,maxDepth:0}).join('\n'),
                protoRenderLines({nodes:allNodes,maxDepth:1}).join('\n'),
                protoRenderLines({nodes:allNodes,maxDepth:2}).join('\n'),
            ].join(nSep).replace(/`/g,'\\`'));
        }

        expect(parsed).toMatchObject(mdParsed);
        expect(mdParsed).toMatchObject(parsed);


        const mdParts=mdTestOutput.split(nSep);
        expect(protoRenderLines({nodes:allNodes}).join('\n')).toBe(mdParts[0]);

        const render0=protoRenderLines({nodes:allNodes,maxDepth:0}).join('\n');
        expect(render0).toBe(mdParts[1]);

        const render1=protoRenderLines({nodes:allNodes,maxDepth:1}).join('\n');
        expect(render1).toBe(mdParts[2]);

        const render2=protoRenderLines({nodes:allNodes,maxDepth:2}).join('\n');
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
        "renderData": {
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
        "renderData": {
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
                "renderData": {
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
                "renderData": {
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
                "renderData": {
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
                        "renderData": {
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
                "renderData": {
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
                        "renderData": {
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
                "renderData": {
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
                        "renderData": {
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
                        "renderData": {
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
                        "renderData": {
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
                                "renderData": {
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
                                "low": false
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
                        "renderData": {
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
                                "renderData": {
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
                        "renderData": {
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
                                "renderData": {
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
                        "low": true,
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
        "renderData": {
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
                "renderData": {
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
                "renderData": {
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
                    },
                    {
                        "name": "$link",
                        "address": "SettingsView.name.$link",
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
                "renderData": {
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
                        "name": "$src",
                        "address": "UserView.age.$src",
                        "rev": true,
                        "low": true
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
                "renderData": {
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
                "renderData": {
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
                        "renderData": {
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
        "renderData": {
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
                "renderData": {
                    "input": "- model: User",
                    "depth": 1,
                    "before": "UserView"
                },
                "links": [
                    {
                        "name": "User",
                        "address": "User",
                        "low": true
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
                "renderData": {
                    "input": "- title",
                    "depth": 1,
                    "before": "UserView.model"
                },
                "children": {
                    "$src": {
                        "name": "$src",
                        "address": "UserView.title.$src",
                        "type": "model",
                        "refProp": "likes",
                        "types": [
                            {
                                "type": "model",
                                "refProp": "likes"
                            }
                        ],
                        "value": ".model.likes",
                        "renderData": {
                            "input": "  - $src: .model.likes",
                            "depth": 2,
                            "before": "UserView.title"
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
                "renderData": {
                    "input": "- age",
                    "depth": 1,
                    "before": "UserView.title.$src"
                },
                "children": {
                    "$src": {
                        "name": "$src",
                        "address": "UserView.age.$src",
                        "type": "User",
                        "refProp": "age",
                        "types": [
                            {
                                "type": "User",
                                "refProp": "age"
                            }
                        ],
                        "value": "User.age",
                        "renderData": {
                            "input": "  - $src: User.age",
                            "depth": 2,
                            "before": "UserView.age"
                        },
                        "special": true,
                        "links": [
                            {
                                "name": "User.age",
                                "address": "User.age",
                                "low": true
                            }
                        ]
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
                "renderData": {
                    "input": "- brokenPropLink",
                    "depth": 1,
                    "before": "UserView.age.$src"
                },
                "children": {
                    "$src": {
                        "name": "$src",
                        "address": "UserView.brokenPropLink.$src",
                        "type": "notAProp",
                        "refProp": "age",
                        "types": [
                            {
                                "type": "notAProp",
                                "refProp": "age"
                            }
                        ],
                        "value": ".notAProp.age",
                        "renderData": {
                            "input": "  - $src: .notAProp.age",
                            "depth": 2,
                            "before": "UserView.brokenPropLink"
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
                "renderData": {
                    "input": "- brokenTypeLink",
                    "depth": 1,
                    "before": "UserView.brokenPropLink.$src"
                },
                "children": {
                    "$src": {
                        "name": "$src",
                        "address": "UserView.brokenTypeLink.$src",
                        "type": "NotAType",
                        "refProp": "age",
                        "types": [
                            {
                                "type": "NotAType",
                                "refProp": "age"
                            }
                        ],
                        "value": "NotAType.age",
                        "renderData": {
                            "input": "  - $src: NotAType.age",
                            "depth": 2,
                            "before": "UserView.brokenTypeLink"
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
                                "renderData": {
                                    "indent": "",
                                    "input": "\n",
                                    "depth": 1,
                                    "before": "UserView.brokenTypeLink.$src"
                                },
                                "isContent": true
                            }
                        },
                        "links": [
                            {
                                "name": "NotAType.age",
                                "address": "NotAType.age",
                                "low": true,
                                "broken": true
                            }
                        ]
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
        "renderData": {
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
                "renderData": {
                    "input": "- model: User",
                    "depth": 1,
                    "before": "SettingsView"
                },
                "links": [
                    {
                        "name": "User",
                        "address": "User",
                        "low": true
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
                "renderData": {
                    "input": "- name",
                    "depth": 1,
                    "before": "SettingsView.model"
                },
                "children": {
                    "$link": {
                        "name": "$link",
                        "address": "SettingsView.name.$link",
                        "type": "User",
                        "refProp": "name",
                        "types": [
                            {
                                "type": "User",
                                "refProp": "name"
                            }
                        ],
                        "value": "User.name",
                        "renderData": {
                            "input": "  - $link: User.name",
                            "depth": 2,
                            "before": "SettingsView.name"
                        },
                        "special": true,
                        "links": [
                            {
                                "name": "User.name",
                                "address": "User.name",
                                "low": true
                            }
                        ]
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
                "renderData": {
                    "input": "- age",
                    "depth": 1,
                    "before": "SettingsView.name.$link"
                },
                "children": {
                    "$link": {
                        "name": "$link",
                        "address": "SettingsView.age.$link",
                        "type": "model",
                        "refProp": "age",
                        "types": [
                            {
                                "type": "model",
                                "refProp": "age"
                            }
                        ],
                        "value": ".model.age",
                        "renderData": {
                            "input": "  - $link: .model.age",
                            "depth": 2,
                            "before": "SettingsView.age"
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
                                "renderData": {
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
        "renderData": {
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
        "renderData": {
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
                "renderData": {
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
                        "renderData": {
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
        "renderData": {
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
                "renderData": {
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
                        "renderData": {
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
        "renderData": {
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
                "renderData": {
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
                "renderData": {
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
                "renderData": {
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
                        "renderData": {
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
        "renderData": {
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
                "renderData": {
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
                        "renderData": {
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
