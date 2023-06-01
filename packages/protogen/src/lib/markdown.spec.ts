import { mkdirSync, writeFileSync } from "fs";
import { protoMarkdownParseNodes } from "./markdown";
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

- id: string (key)
- uv: number
  Used to sync access
  Add 1 to uv each time updating
  Other uses
    - deny out of sync writes
    - track number of changes

- $trigger: abc

- post: Post[]
  - name: string
  - name: number
  - ownerId: string *User (fon)
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

- id: string (key)
- uv: number
  Used to sync access
  Add 1 to uv each time updating
  Other uses
    - deny out of sync writes
    - track number of changes

- $trigger: abc

- post: Post[]
  - name: string
  - name: number
  - ownerId: string *User (fon)
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

- id: string (key)
- uv: number
- $trigger: abc
- post: Post[]
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

- id: string (key)
- uv: number
  Used to sync access
  Add 1 to uv each time updating
  Other uses
    - deny out of sync writes
    - track number of changes

- $trigger: abc
- post: Post[]
  - name: string
  - name: number
  - ownerId: string *User (fon)
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
                "type": "",
                "path": []
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
                "type": "struct",
                "isRefType": false,
                "path": [
                    "struct"
                ]
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
                        "type": "",
                        "path": []
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
                        "type": "string",
                        "isRefType": false,
                        "path": [
                            "string"
                        ]
                    }
                ],
                "value": "string",
                "renderData": {
                    "input": "- id: string (key)",
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
                        "type": "number",
                        "isRefType": false,
                        "path": [
                            "number"
                        ]
                    }
                ],
                "value": "number",
                "renderData": {
                    "input": "- uv: number",
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
                                "type": "",
                                "path": []
                            }
                        ],
                        "value": "Used to sync access\nAdd 1 to uv each time updating\nOther uses\n  deny out of sync writes\n  track number of changes\n",
                        "renderData": {
                            "indent": "  ",
                            "input": "  Used to sync access\n  Add 1 to uv each time updating\n  Other uses\n    - deny out of sync writes\n    - track number of changes\n",
                            "depth": 2,
                            "before": "Thread.uv"
                        },
                        "isContent": true
                    }
                },
                "comment": "Used to sync access\nAdd 1 to uv each time updating\nOther uses\n  deny out of sync writes\n  track number of changes"
            },
            "$trigger": {
                "name": "$trigger",
                "address": "Thread.$trigger",
                "type": "abc",
                "types": [
                    {
                        "type": "abc",
                        "isRefType": false,
                        "path": [
                            "abc"
                        ]
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
                                "type": "",
                                "path": []
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
                },
                "comment": ""
            },
            "post": {
                "name": "post",
                "address": "Thread.post",
                "type": "Post",
                "types": [
                    {
                        "type": "Post",
                        "isRefType": true,
                        "path": [
                            "Post"
                        ],
                        "isArray": true
                    }
                ],
                "value": "Post[]",
                "renderData": {
                    "input": "- post: Post[]",
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
                                "type": "string",
                                "isRefType": false,
                                "path": [
                                    "string"
                                ]
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
                                "type": "number",
                                "isRefType": false,
                                "path": [
                                    "number"
                                ]
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
                                "type": "string",
                                "isRefType": false,
                                "path": [
                                    "string"
                                ]
                            },
                            {
                                "type": "User",
                                "isRefType": true,
                                "path": [
                                    "User"
                                ],
                                "important": true
                            }
                        ],
                        "value": "string *User",
                        "renderData": {
                            "input": "  - ownerId: string *User (fon)",
                            "depth": 2,
                            "before": "Thread.post.name#2"
                        },
                        "refType": {
                            "type": "User",
                            "isRefType": true,
                            "path": [
                                "User"
                            ],
                            "important": true
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
                                        "type": "",
                                        "path": []
                                    }
                                ],
                                "value": "(managed)\n  tracker\n  ``` ts\n  invalid ts here\n  getTrackers().find(t=>t.ready)\n  ```\n",
                                "renderData": {
                                    "indent": "    ",
                                    "input": "    - (managed)\n      - tracker\n      ``` ts\n      - invalid ts here\n      getTrackers().find(t=>t.ready)\n      ```\n",
                                    "depth": 3,
                                    "before": "Thread.post.ownerId"
                                },
                                "isContent": true
                            }
                        },
                        "comment": "(managed)\n  tracker\n  ``` ts\n  invalid ts here\n  getTrackers().find(t=>t.ready)\n  ```",
                        "links": [
                            {
                                "name": "User",
                                "address": "User",
                                "priority": "high"
                            }
                        ]
                    },
                    "weight": {
                        "name": "weight",
                        "address": "Thread.post.weight",
                        "type": "number",
                        "types": [
                            {
                                "type": "number",
                                "isRefType": false,
                                "path": [
                                    "number"
                                ]
                            }
                        ],
                        "value": "number",
                        "renderData": {
                            "input": "  - weight: number",
                            "depth": 2,
                            "before": "Thread.post.ownerId.#"
                        },
                        "children": {
                            "#": {
                                "name": "#",
                                "address": "Thread.post.weight.#",
                                "type": "",
                                "types": [
                                    {
                                        "type": "",
                                        "path": []
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
                        ],
                        "comment": "[User weight](User.weight)"
                    }
                },
                "links": [
                    {
                        "name": "Post",
                        "address": "Post",
                        "priority": "low"
                    }
                ]
            }
        },
        "comment": "A collection of Posts that can be displayed\nas a space, session, chat or any other view\nthat represents a time series of events\nand content."
    },
    {
        "name": "User",
        "address": "User",
        "type": "",
        "types": [
            {
                "type": "",
                "path": []
            }
        ],
        "value": "",
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
                        "type": "string",
                        "isRefType": false,
                        "path": [
                            "string"
                        ]
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
                        "type": "string",
                        "isRefType": false,
                        "path": [
                            "string"
                        ]
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
                        "name": "model",
                        "address": "SettingsView.model",
                        "rev": true,
                        "priority": "med"
                    }
                ]
            },
            "age": {
                "name": "age",
                "address": "User.age",
                "type": "int",
                "types": [
                    {
                        "type": "int",
                        "isRefType": false,
                        "path": [
                            "int"
                        ]
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
                        "name": "model",
                        "address": "UserView.model",
                        "rev": true,
                        "priority": "med",
                        "src": true
                    }
                ]
            },
            "weight": {
                "name": "weight",
                "address": "User.weight",
                "type": "number",
                "types": [
                    {
                        "type": "number",
                        "isRefType": false,
                        "path": [
                            "number"
                        ]
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
                        "priority": "med"
                    }
                ]
            },
            "likes": {
                "name": "likes",
                "address": "User.likes",
                "type": "number",
                "types": [
                    {
                        "type": "number",
                        "isRefType": false,
                        "path": [
                            "number"
                        ]
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
                                "type": "",
                                "path": []
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
                "comment": ""
            }
        },
        "links": [
            {
                "name": "ownerId",
                "address": "Thread.post.ownerId",
                "rev": true,
                "priority": "med"
            },
            {
                "name": "model",
                "address": "UserView.model",
                "rev": true,
                "priority": "med"
            },
            {
                "name": "model",
                "address": "SettingsView.model",
                "rev": true,
                "priority": "med"
            }
        ]
    },
    {
        "name": "UserView",
        "address": "UserView",
        "type": "comp",
        "types": [
            {
                "type": "comp",
                "isRefType": false,
                "path": [
                    "comp"
                ]
            }
        ],
        "value": "comp",
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
                        "type": "User",
                        "isRefType": true,
                        "path": [
                            "User"
                        ]
                    }
                ],
                "value": "User",
                "renderData": {
                    "input": "- model: User",
                    "depth": 1,
                    "before": "UserView"
                },
                "children": {
                    "#": {
                        "name": "#",
                        "address": "UserView.model.#",
                        "type": "",
                        "types": [
                            {
                                "type": "",
                                "path": []
                            }
                        ],
                        "value": "title",
                        "renderData": {
                            "indent": "",
                            "input": "- title",
                            "depth": 1,
                            "before": "UserView.model"
                        },
                        "isContent": true
                    },
                    "$src": {
                        "name": "$src",
                        "address": "UserView.model.$src",
                        "type": "UserView",
                        "types": [
                            {
                                "type": "UserView",
                                "isRefType": true,
                                "path": [
                                    "UserView",
                                    "model",
                                    "likes"
                                ],
                                "dot": true
                            }
                        ],
                        "value": ".model.likes",
                        "renderData": {
                            "input": "  - $src: .model.likes",
                            "depth": 2,
                            "before": "UserView.model.#"
                        },
                        "special": true,
                        "children": {
                            "#": {
                                "name": "#",
                                "address": "UserView.model.$src.#",
                                "type": "",
                                "types": [
                                    {
                                        "type": "",
                                        "path": []
                                    }
                                ],
                                "value": "age",
                                "renderData": {
                                    "indent": "",
                                    "input": "- age",
                                    "depth": 1,
                                    "before": "UserView.model.$src"
                                },
                                "isContent": true
                            }
                        },
                        "comment": "age"
                    },
                    "$src#2": {
                        "name": "$src",
                        "address": "UserView.model.$src#2",
                        "type": "User",
                        "types": [
                            {
                                "type": "User",
                                "isRefType": true,
                                "path": [
                                    "User",
                                    "age"
                                ]
                            }
                        ],
                        "value": "User.age",
                        "renderData": {
                            "input": "  - $src: User.age",
                            "depth": 2,
                            "before": "UserView.model.$src.#"
                        },
                        "special": true,
                        "children": {
                            "#": {
                                "name": "#",
                                "address": "UserView.model.$src#2.#",
                                "type": "",
                                "types": [
                                    {
                                        "type": "",
                                        "path": []
                                    }
                                ],
                                "value": "brokenPropLink",
                                "renderData": {
                                    "indent": "",
                                    "input": "- brokenPropLink",
                                    "depth": 1,
                                    "before": "UserView.model.$src#2"
                                },
                                "isContent": true
                            }
                        },
                        "comment": "brokenPropLink"
                    },
                    "$src#3": {
                        "name": "$src",
                        "address": "UserView.model.$src#3",
                        "type": "UserView",
                        "types": [
                            {
                                "type": "UserView",
                                "isRefType": true,
                                "path": [
                                    "UserView",
                                    "notAProp",
                                    "age"
                                ],
                                "dot": true
                            }
                        ],
                        "value": ".notAProp.age",
                        "renderData": {
                            "input": "  - $src: .notAProp.age",
                            "depth": 2,
                            "before": "UserView.model.$src#2.#"
                        },
                        "special": true,
                        "children": {
                            "#": {
                                "name": "#",
                                "address": "UserView.model.$src#3.#",
                                "type": "",
                                "types": [
                                    {
                                        "type": "",
                                        "path": []
                                    }
                                ],
                                "value": "brokenTypeLink",
                                "renderData": {
                                    "indent": "",
                                    "input": "- brokenTypeLink",
                                    "depth": 1,
                                    "before": "UserView.model.$src#3"
                                },
                                "isContent": true
                            }
                        },
                        "comment": "brokenTypeLink"
                    },
                    "$src#4": {
                        "name": "$src",
                        "address": "UserView.model.$src#4",
                        "type": "NotAType",
                        "types": [
                            {
                                "type": "NotAType",
                                "isRefType": true,
                                "path": [
                                    "NotAType",
                                    "age"
                                ]
                            }
                        ],
                        "value": "NotAType.age",
                        "renderData": {
                            "input": "  - $src: NotAType.age",
                            "depth": 2,
                            "before": "UserView.model.$src#3.#"
                        },
                        "special": true,
                        "children": {
                            "#": {
                                "name": "#",
                                "address": "UserView.model.$src#4.#",
                                "type": "",
                                "types": [
                                    {
                                        "type": "",
                                        "path": []
                                    }
                                ],
                                "value": "\n",
                                "renderData": {
                                    "indent": "",
                                    "input": "\n",
                                    "depth": 1,
                                    "before": "UserView.model.$src#4"
                                },
                                "isContent": true
                            }
                        },
                        "comment": ""
                    }
                },
                "comment": "title",
                "links": [
                    {
                        "name": "User",
                        "address": "User",
                        "priority": "low"
                    },
                    {
                        "name": ".model.likes",
                        "address": ".model.likes",
                        "priority": "med",
                        "src": true
                    },
                    {
                        "name": "User.age",
                        "address": "User.age",
                        "priority": "med",
                        "src": true
                    },
                    {
                        "name": ".notAProp.age",
                        "address": ".notAProp.age",
                        "priority": "med",
                        "src": true
                    },
                    {
                        "name": "NotAType.age",
                        "address": "NotAType.age",
                        "priority": "med",
                        "src": true
                    }
                ],
                "sourceAddress": "NotAType.age",
                "sourceLinked": false
            }
        }
    },
    {
        "name": "SettingsView",
        "address": "SettingsView",
        "type": "comp",
        "types": [
            {
                "type": "comp",
                "isRefType": false,
                "path": [
                    "comp"
                ]
            }
        ],
        "value": "comp",
        "renderData": {
            "input": "## SettingsView: comp",
            "depth": 0,
            "before": "UserView.model.$src#4.#"
        },
        "children": {
            "model": {
                "name": "model",
                "address": "SettingsView.model",
                "type": "User",
                "types": [
                    {
                        "type": "User",
                        "isRefType": true,
                        "path": [
                            "User"
                        ]
                    }
                ],
                "value": "User",
                "renderData": {
                    "input": "- model: User",
                    "depth": 1,
                    "before": "SettingsView"
                },
                "children": {
                    "#": {
                        "name": "#",
                        "address": "SettingsView.model.#",
                        "type": "",
                        "types": [
                            {
                                "type": "",
                                "path": []
                            }
                        ],
                        "value": "name",
                        "renderData": {
                            "indent": "",
                            "input": "- name",
                            "depth": 1,
                            "before": "SettingsView.model"
                        },
                        "isContent": true
                    },
                    "$link": {
                        "name": "$link",
                        "address": "SettingsView.model.$link",
                        "type": "User",
                        "types": [
                            {
                                "type": "User",
                                "isRefType": true,
                                "path": [
                                    "User",
                                    "name"
                                ]
                            }
                        ],
                        "value": "User.name",
                        "renderData": {
                            "input": "  - $link: User.name",
                            "depth": 2,
                            "before": "SettingsView.model.#"
                        },
                        "special": true,
                        "children": {
                            "#": {
                                "name": "#",
                                "address": "SettingsView.model.$link.#",
                                "type": "",
                                "types": [
                                    {
                                        "type": "",
                                        "path": []
                                    }
                                ],
                                "value": "age",
                                "renderData": {
                                    "indent": "",
                                    "input": "- age",
                                    "depth": 1,
                                    "before": "SettingsView.model.$link"
                                },
                                "isContent": true
                            }
                        },
                        "comment": "age"
                    },
                    "$link#2": {
                        "name": "$link",
                        "address": "SettingsView.model.$link#2",
                        "type": "SettingsView",
                        "types": [
                            {
                                "type": "SettingsView",
                                "isRefType": true,
                                "path": [
                                    "SettingsView",
                                    "model",
                                    "age"
                                ],
                                "dot": true
                            }
                        ],
                        "value": ".model.age",
                        "renderData": {
                            "input": "  - $link: .model.age",
                            "depth": 2,
                            "before": "SettingsView.model.$link.#"
                        },
                        "special": true,
                        "children": {
                            "#": {
                                "name": "#",
                                "address": "SettingsView.model.$link#2.#",
                                "type": "",
                                "types": [
                                    {
                                        "type": "",
                                        "path": []
                                    }
                                ],
                                "value": "",
                                "renderData": {
                                    "indent": "",
                                    "input": "",
                                    "depth": 1,
                                    "before": "SettingsView.model.$link#2"
                                },
                                "isContent": true
                            }
                        },
                        "comment": ""
                    }
                },
                "comment": "name",
                "links": [
                    {
                        "name": "User",
                        "address": "User",
                        "priority": "low"
                    },
                    {
                        "name": "User.name",
                        "address": "User.name"
                    },
                    {
                        "name": ".model.age",
                        "address": ".model.age"
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
                "type": "",
                "path": []
            }
        ],
        "value": "---\n\nUnattached comments\n",
        "renderData": {
            "indent": "",
            "input": "----\n\nUnattached comments\n",
            "depth": 1,
            "before": "SettingsView.model.$link#2.#"
        },
        "isContent": true
    },
    {
        "name": "CopyType",
        "address": "CopyType",
        "type": "",
        "types": [
            {
                "type": "",
                "path": []
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
                        "type": "string",
                        "isRefType": false,
                        "path": [
                            "string"
                        ]
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
                                "type": "",
                                "path": []
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
                },
                "comment": ""
            }
        }
    },
    {
        "name": "CopyType",
        "address": "CopyType#2",
        "type": "",
        "types": [
            {
                "type": "",
                "path": []
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
                        "type": "string",
                        "isRefType": false,
                        "path": [
                            "string"
                        ]
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
                                "type": "",
                                "path": []
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
                ],
                "comment": "[Check age]($1)"
            }
        }
    },
    {
        "name": "$1",
        "address": "$1",
        "type": "",
        "types": [
            {
                "type": "",
                "path": []
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
                        "type": "",
                        "path": []
                    }
                ],
                "value": "Is older that 21?\nyes\nno\n",
                "renderData": {
                    "indent": "",
                    "input": "Is older that 21?\n- yes\n- no\n",
                    "depth": 1,
                    "before": "$1"
                },
                "isContent": true,
                "importantContent": true
            }
        },
        "comment": "Is older that 21?\nyes\nno",
        "links": [
            {
                "name": "age",
                "address": "CopyType#2.age",
                "rev": true,
                "priority": "med"
            }
        ]
    },
    {
        "name": "OtherType",
        "address": "OtherType",
        "type": "",
        "types": [
            {
                "type": "",
                "path": []
            }
        ],
        "value": "",
        "renderData": {
            "input": "###### OtherType",
            "depth": 0,
            "before": "$1.#"
        },
        "children": {
            "prop1": {
                "name": "prop1",
                "address": "OtherType.prop1",
                "type": "string",
                "types": [
                    {
                        "type": "string",
                        "isRefType": false,
                        "path": [
                            "string"
                        ]
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
                                "type": "",
                                "path": []
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
                },
                "comment": ""
            }
        }
    }
]
