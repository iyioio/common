const value='red';

const css=/*css*/`
.body{
    color:${value};
}
html{
    color:orange;
}
`
const css2=/*start-css*/`
.body{
    color:${value};
}
`/*end-css*/

const obj={
    css:`
        .body{
            color:${value};
        }
    `,
    someCss:`
        .body{
            color:${value};
        }
    `,
    cssNot:`
        .body{
            color:${value};
        }
    `,
}

const str=/*cxss*/`.body{asdflkjsdf}`

export interface x{}