/*
Language: ProtoMarkdown
Requires: xml.js
Author: Scott Vance <scott@iyio.io>
Website: https://github.com/iyioio/common/packages/protogen-ui
Category: p-markdown, markdown, markup, prototyping
Original Author: John Crepezzi <john.crepezzi@gmail.com>
*/

import { HLJSApi, Language, LanguageFn, Mode } from "highlight.js";

export const pMarkdown:LanguageFn=(hljs:HLJSApi):Language=>{
  const regex = hljs.regex;
  const INLINE_HTML:Mode = {
    begin: /<\/?[A-Za-z_]/,
    end: '>',
    subLanguage: 'xml',
    relevance: 0
  };
  const HORIZONTAL_RULE:Mode = {
    begin: '^[-\\*]{3,}',
    end: '$'
  };
  const CODE:Mode = {
    scope: 'code',
    begin: '```',
    end: '```+[ ]*$'
  };
  const HIDDEN:Mode = {
    scope: 'comment',
    match:'\\*hidden\\*',
    excludeEnd: true,
  };
  const tagScope='string';//string
  const TAG:Mode={
    scope:tagScope,
    match:/\([^()]+\)/
  }
  const PROP_LIST_TAG:Mode = {
    beginScope:{
        1:tagScope,
        2:tagScope
    },
    begin:[
        '^[ \\t]*-\\s+',
        /\([^()]+\)/
    ],
    contains:[
        TAG
    ],
    end:/$/
  };
  const PROP_FLAG:Mode={
    scope:'doctag',
    match:/[@>#~*?!]/
  }
  const propContains=[TAG,PROP_FLAG];
  const PROP_LIST:Mode = {
    beginScope:{
        1:'type',
    },
    begin:[
        /^-\s+\w[-\w]*/,
        /\??:/
    ],
    end:'\n',
    contains:propContains,

  };
  const SUB_PROP_LIST:Mode = {
    beginScope:{
        1:'attr',
    },
    begin:[
        /^[ \t]+-\s+\w[-\w]*/,
        /\??:/
    ],
    end:'\n',
    contains:propContains,
  };
  const SPECIAL_PROP_LIST:Mode = {
    beginScope:{
        1:'operator',
    },
    begin:[
        /^[ \t]*-\s+\$\w[-\w]*/,
        /\??:/
    ],
    end:'\n',
    contains:propContains,
  };
  const LIST:Mode = {
    scope: 'bullet',
    begin: '^[ \t]*([*+-]|(\\d+\\.))(?=\\s+)',
    end: '\\s+',
    excludeEnd: true,

  };
  const LINK_REFERENCE:Mode = {
    begin: /^\[[^\n]+\]:/,
    returnBegin: true,
    contains: [
      {
        scope: 'symbol',
        begin: /\[/,
        end: /\]/,
        excludeBegin: true,
        excludeEnd: true
      },
      {
        scope: 'link',
        begin: /:\s*/,
        end: /$/,
        excludeBegin: true
      }
    ]
  };
  const URL_SCHEME = /[A-Za-z][A-Za-z0-9+.-]*/;
  const LINK:Mode = {
    variants: [
      // too much like nested array access in so many languages
      // to have any real relevance
      {
        begin: /\[.+?\]\[.*?\]/,
        relevance: 0
      },
      // popular internet URLs
      {
        begin: /\[.+?\]\(((data|javascript|mailto):|(?:http|ftp)s?:\/\/).*?\)/,
        relevance: 2
      },
      {
        begin: regex.concat(/\[.+?\]\(/, URL_SCHEME, /:\/\/.*?\)/),
        relevance: 2
      },
      // relative urls
      {
        begin: /\[.+?\]\([./?&#].*?\)/,
        relevance: 1
      },
      // whatever else, lower relevance (might not be a link at all)
      {
        begin: /\[.*?\]\(.*?\)/,
        relevance: 0
      }
    ],
    returnBegin: true,
    contains: [
      {
        // empty strings for alt or link text
        match: /\[(?=\])/ },
      {
        scope: 'string',
        relevance: 0,
        begin: '\\[',
        end: '\\]',
        excludeBegin: true,
        returnEnd: true
      },
      {
        scope: 'link',
        relevance: 0,
        begin: '\\]\\(',
        end: '\\)',
        excludeBegin: true,
        excludeEnd: true
      },
      {
        scope: 'symbol',
        relevance: 0,
        begin: '\\]\\[',
        end: '\\]',
        excludeBegin: true,
        excludeEnd: true
      }
    ]
  };
  const BOLD:Mode = {
    scope: 'strong',
    contains: [], // defined later
    variants: [
      {
        begin: /_{2}(?!\s)/,
        end: /_{2}/
      },
      {
        begin: /\*{2}(?!\s)/,
        end: /\*{2}/
      }
    ]
  };
  const ITALIC:Mode = {
    scope: 'emphasis',
    contains: [], // defined later
    variants: [
      {
        begin: /\*(?![*\s])/,
        end: /\*/,
      },
      {
        begin: /_(?![_\s])/,
        end: /_/,
        relevance: 0
      }
    ]
  };

  // 3 level deep nesting is not allowed because it would create confusion
  // in cases like `***testing***` because where we don't know if the last
  // `***` is starting a new bold/italic or finishing the last one
  const BOLD_WITHOUT_ITALIC = hljs.inherit(BOLD, { contains: [] });
  const ITALIC_WITHOUT_BOLD = hljs.inherit(ITALIC, { contains: [] });
  BOLD.contains?.push(ITALIC_WITHOUT_BOLD);
  ITALIC.contains?.push(BOLD_WITHOUT_ITALIC);

  let CONTAINABLE:Mode[] = [
    INLINE_HTML,
    LINK
  ];

  [
    BOLD,
    ITALIC,
    BOLD_WITHOUT_ITALIC,
    ITALIC_WITHOUT_BOLD
  ].forEach(m => {
    m.contains = m.contains?.concat(CONTAINABLE);
  });

  CONTAINABLE = CONTAINABLE.concat(BOLD, ITALIC);

  const HEADER:Mode = {
    scope: 'section',
    variants: [
      {
        begin: '^#{1,6}',
        end: '$',
        contains: [TAG,...CONTAINABLE]
      },
      {
        begin: '(?=^.+?\\n[=-]{2,}$)',
        contains: [
          { begin: '^[=-]*$' },
          {
            begin: '^',
            end: "\\n",
            contains: CONTAINABLE
          }
        ]
      }
    ]
  };

  const BLOCKQUOTE:Mode = {
    scope: 'quote',
    begin: '^>\\s+',
    contains: CONTAINABLE,
    end: '$'
  };

  return {
    name: 'Proto Markdown',
    aliases: [
      'pmd',
      'md',
      'mkdown',
      'mkd'
    ],
    contains: [
      HIDDEN,
      HEADER,
      INLINE_HTML,
      SPECIAL_PROP_LIST,
      PROP_LIST,
      PROP_LIST_TAG,
      SUB_PROP_LIST,
      LIST,
      BOLD,
      ITALIC,
      BLOCKQUOTE,
      CODE,
      HORIZONTAL_RULE,
      LINK,
      LINK_REFERENCE
    ]
  };
}
