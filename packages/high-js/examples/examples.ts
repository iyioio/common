const value='red';
/*css*/`
@.stuff.ready.freddy{
    color:@@myColor;
}
@.stuff{
    display:block;
}
@.stuff2{
    display:block;
}
@.stuff.active{
    color:red;
}
@.root.disabled{
    color:red;
}
`
const css=/*css*/`

.body{
    color:${value};
    font:@@font;
}
html{
    color:orange;
}
@desktopUp{
    @.root{
        color:@@color;
        font:var(--font-var)
    }
    @.someDiv{
        color:@@divColor;
    }
}
@media(max-width:500px){
    @.root{
        color:@@color;
        font:var(--font-var)
    }
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