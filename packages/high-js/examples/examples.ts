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

@keyframes @@@mover{
    0%{
        opacity:1;
    }
}

.body{
    color:${value};
    font:@@font;
    animation:@@@mover;
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

/*css*/`
@keyframes @@@frames{

}
@.root{
    color:@@color;
    display:flex;
    flex-direction:column;
    gap:1rem;
    animation:@@@frames;
}
@tabletDown{
    @.root{
        color:@@mobileColor;
    }
}`;


/*convo*/`
# Returns a header system message
> local getHeader( age:number ) -> (
    return("James is a funky monkey {{age}} years old")
)

> dude
I'm okxc

> system
You are a friendly ghost. {{getHeader()}}

> user
My name is {{name}}

${(async ()=>{
    const x=55;
    return x;
})()}

> call gradePaper(
    score: 1
    email: 'bob@tom.com'
    job:map( name: 'salad fingers' )
)
`;