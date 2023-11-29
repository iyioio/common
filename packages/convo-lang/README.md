# convo-lang
A conversational prompting and programming language. Convo aims to simplify complex prompts and
provide a programming language that can natively communicate LLMs function calling.
Convo consists of a series of messages. A message can be a block of text, a block of code or a 
function definition.


![convo](assets/code-example-1.png)

## Configuration
To allow convo to access OpenAI, create a JSON file called ~/.config/convo/convo.json and add the
following contents. Remember to replace the API key with your OpenAI api key.

``` json
{
    "env":{
        "openAiApiKey":"YOUR_OPEN_AI_KEY",
        "openAiChatModel":"gpt-4",
        "openAiAudioModel":"whisper-1",
        "openAiImageModel":"dall-e-3"

    }
}
```

## Using the extension
With the convo vscode extension install you can execute convo scripts directly in vscode. Just
press __(CMD+R)__ to run a script.

You can also run snippets of convo scripts that are embedded in other
document types. Just highlight the convo code you want to run and open the command pallet and
search for "Complete Convo Conversation" and press enter, then the snippet will be opened in a new
convo file and completed. This is great for quick prototyping and testing prompts in your application
without having to start you full application.

## Using the CLI
The convo CLI can be used to execute convo scripts from the command line

``` sh
# install the convo cli
npm install -g @iyio/convo-cli

# Results will be printed to stdout
convo talky-time.convo

# Results will be written to a new file named something-happened.convo
convo talky-time.convo --out something.convo

# Result will be written to the source input file. This allows you to have a continuous conversation
convo talky-time.convo --out .
```

There is currently only one way to configure the convo cli and vscode extension. This will be extended
soon to include reading configuration files from your current workspace. 

## Comments
Comments start with either a pound character or 2 forwards slashes. Comments starting with a pound
symbol are captured and available at run time as part of type definitions. Comments starting with
2 forward slashes are non capturing.

``` convo

// This is a non documenting comment and will not be available at run time

# This is a documenting comment and will be available at run time and will be used as the 
# description for the function below
> meFunc() -> (
    print('👋')
)
```

## Typing
Convo support simple duck typing and allows for user defined types. Custom types are created using
the struct function. Each labeled parameter passed to the struct function will define a property.
At runtime types are validated using the [Zod](https://github.com/colinhacks/zod). User defined
types must start with an uppercase letter.

``` convo
Car = struct(
    color: string
    engine: struct(
        hp: number
        torque: number
        fuel: enum( "gas" "diesel" "jp-7" )
    )
    owners: array(struct(
        name: string
        // address is optional
        address?: string
    ))
)
```


## Variable scoping
Variables are either scoped to the function they are defined in or shared. Shared variables are 
visible to all functions and top level statements. Top level statements can only define shared
variables. To define a shared variable in a function tag an assignment statement with the @shared
tag.

## JSON support
JSON style values can be used in place of the map and array functions.
``` convo
// obj1 and obj2 are the same

obj1 = map(
    go: "fast"
    turn: "left"
    times: 1000
)

obj2 = {
    "go": "fast",
    "turn": "left",
    "times" 1000
}
```


## Markdown support
Text based messages in convo support a subset of the markdown syntax and the markdown structure
is available at compile time.



## Keywords

- string - String type object
- number - Number type object
- int - Integer type object
- time - Time type object. The time type is represented as an integer timestamp
- void - Void type object.
- boolean - Boolean type object.
- any - Any time object
- true - True constant
- false - False constant
- null - Null constant
- undefined - Undefined constant
- convo - A reference to the current conversation. This is equivalent to window in Javascript.
- __args - A reference to the parameters passed the the current function as any object.
- __return - A reference to the last return value of a function called by a call message
- __error - A reference to the last error

## System Functions

### pipe( ...values: any )
Pipes the value of each argument received to the argument to its right.

### struct( ...properties: any )
Defines a user defined type

``` convo
Car = struct(
    color: string
    engine: struct(
        hp: number
        torque: number
        fuel: enum( "gas" "diesel" "jp-7" )
    )
    owners: array(struct(
        name: string
        // address is optional
        address?: string
    ))
)
```

## enum( ...values: any )
Defines an enumeration
``` convo
Size = enum( "sm" "md" "lg" )
```

## is( ...value:any type:any )
Checks if all of the parameters left of the last parameter are of the type of the last parameter
``` convo
num = 7

// true
is(num number)

// false
is(num string)

str = "lo"

// true
is(str string)

// false
is(str number)

// false
is(str num number)

// true
is(str num any)

Person = struct(
    name: string
    age: number
)

user1 = map(
    name: "Jeff"
    age: 22
)

user2 = map(
    name: "Max"
    age: 12
)

// true
is(user1 Person)

// true
is(user1 user2 Person)

// false
is(user1 user2 num Person)

```

### map( ...properties: any )
Creates an object

``` convo
// meObj has 2 properties, name and age
meObj = map(
    name: "Jeff"
    age: 22
)
```

### array( ...values: any )
Creates an array

``` convo
meAry = array( 1 2 3 "a" "b" "c" )
```


### jsonMap( ...properties: any )
Used internally to implement JSON object syntax support. At compile time JSON objects are converted
to standard convo function calls.

``` convo
jsonStyle = {
    "go": "fast",
    "turn": "left",
    "times" 1000
}

convoStyle = obj1 = jsonMap(
    go: "fast"
    turn: "left"
    times: 1000
)
```

### jsonMap( ...properties: any )
Used internally to implement JSON array syntax support. At compile time JSON arrays are converted
to standard convo function calls.

``` convo
jsonStyle = [ 1, 2, 3, "a", "b", "c" ]

convoStyle = array( 1 2 3 "a" "b" "c" )
```

### and( ...values: any )
Returns true if all given arguments are truthy.

``` convo

// true
and( 1 )

// false
and( 0 )

// true
and( 1 2 )

// false
and( 0 1 )

// true
and( eq(1 1) eq(2 2) )

// false
and( eq(1 1) eq(2 1) )


```

### and( ...values: any )
Returns true if any given arguments are truthy.

``` convo

// true
or( 1 )

// false
or( 0 )

// true
or( 1 2 )

// true
or( 0 1 )

// true
or( eq(1 1) eq(2 2) )

// true
or( eq(1 1) eq(2 1) )

// false
or( eq(1 3) eq(2 1) )

```

### not( ...values: any )
Returns true if all given arguments are falsy.

``` convo

// false
or( true )

// true
or( false )

// false
or( 1 )

// true
or( 0 )

// false
or( 1 2 )

// false
or( 0 1 )

// true
or( 0 false )

// false
or( eq(1 1))

// true
or( eq(1 2) )

```





## Control flow functions

### if( condition:any ), elif( condition: any ), then( ...statements )
If condition is truthy then the statement directly after the if statement will be executed otherwise
the statement directly after if is skipped

``` convo

age = 36

if( gte( age 21 ) ) then (
    print( "You can buy beer in the US" )
) elif (lt( age 16 )) then(
    print( "You're not even close" )
) else (
    print( '{{sub(21 age)}} years until you can buy beer in the US' )
)

```



### while( condition:any )
While condition is truthy then the statement directly after the while statement will be executed
otherwise the statement directly after if is skipped and the while loop will exit.

``` convo

lap = 0

while( lt( lap 500 ) ) do (
    print("go fast")
    print("turn left")

    // increment by 1
    inc(lap)
)

```

### foreach( iterator:any )
Executes the next statement for each item returned by the passed in iterator.
``` convo
total = 0
foreach( num=in(array(1 2 3 4 )) ) do (
    total = add( num total )
)

// 10
print(total)
```

### in( value: array(any) )
Iterates of the values of an array


### break( ...values: any )
Breaks out of loops either not arguments are passed or if any of the passed arguments are truthy

``` convo
lap = 0

while( true ) do (
    print("go fast")
    print("turn left")

    // increment by 1
    inc(lap)

    if( eq( lap 500 ) ) then (
        break()
    )
)
```

### do( ...statements: any)
Executes all given statements and returns the value of the last statement. Do is commonly used with
loop statements, but it can also be useful in other situations on its own such as doing inline
calculations. 
(note) The do keyword is also used to define top level statement when do is used as a message name.

``` convo
n = 0
while( lt( n 10 ) ) do (
    // increment by 1
    inc(lap)
)

// 22
print( add( 5 do(
    sum = mul(n 2)
    sum = sub( sum 3 )
)) )

```

### return( value:any )
Returns a value from the current function

``` convo

> customMath(
    a: number
    b: number
) -> (
    return mul( add(a b) b )
)

> do

value = customMath(a:4 b:3)

// 21
print(value)

```

### eq( ...values:any )
Returns true if all given values are equal. Object equality is checked by by reference. Values must
be of the same type to be equal. ( a === b )

``` convo
// true
eq( 1 1 )

// false
eq( 1 "1" )
```

### gt( a:number b:number)
Returns true if a is grater then b. ( a > b )

### gte( a:number b:number)
Returns true if a is grater then or equal to b. ( a >= b )

### lt( a:number b:number)
Returns true if a is less then b. ( a < b )

### lte( a:number b:number)
Returns true if a is less then or equal to b. ( a <= b )

### add( ...values:any )
Adds all arguments together and returns the result. Strings are concatenated. (a + b )

### sub( a:number b:number )
Subtracts a from b and returns the result.  (a - b )

### sub( a:number b:number )
Multiplies a and b and returns the result.  (a * b )

### div( a:number b:number )
Divides a and b and returns the result.  (a / b )

### pow( a:number b:number )
Raises a by b and returns the result.  Math.pow(a, b )

### inc( *a:number byValue?:number )
Increments the value of the given variable by 1 or the value of the second argument. ( a++ ) or ( a+= byValue )

### dec( *a:number byValue?:number )
Decrements the value of the given variable by 1 or the value of the second argument. ( a-- ) or ( a-= byValue )

### print( ...values:any )
Prints all values to stdout

### switch( value:any ...valueOrCase:any ), case( value:any ), test( condition:any ), default()
Switch can be used as either and switch statement or a ternary. When the switch function has exactly
3 arguments and non of the is a case or default statement then switch acts as a ternary. 

``` convo

// can be 0 to 9
value = rand(9)

// can be 20 to 29
value2 = add(20 rand(9))


switch(

    // Sets the current match value of the switch. The match value of a switch statement can be
    // changed further down the switch
    value

    case(0) print("Lowest")

    case(1) do(
        print("Value is 1")
    )

    case(2) do(
        print("Number two")
    )

    case(3) do(
        print("Tree or three")
    )

    // change the value to a value in ary
    value2

    case(20) do(
        print("2 zero")
    )

    test(lt(value2 28)) do(
        print("less than 28")
    )

    default() print("Fall back to default")

)


// values matched by switches are returned and the value can be assigned to a variable
str = "two"
value = switch(
    str

    case("one") 1
    case("two") 2
    case("three") 3
)

// 2
print(value)


// switches can also be used as a ternary

// yes
print( switch(true "yes" "no") )

// no
print( switch(false "yes" "no") )
```


### sleep( milliseconds:number )
Suspends execution for the given number of milliseconds


### rand( max?:int )
Returns a random number. Is the max parameters is passed then a random whole number with a
maximum of max will be returned otherwise a random number from 0 to 1 will be returned.



## Examples

### Calling Shell Scripts
``` convo
// (Caution) this script is capable to running shell command on you machine.
// (Note) Before commands are ran you will be prompted to allow access to run the command and
//        be given a preview of the command

> define
computerType="MacBook pro"

# Runs a command in a bash shell
> runCommand(
    # the command to run
    command:string
) -> (
    __cwd="/Users/scott/docs/iyio-common/packages"
    print('running...' command)
    return(exec(command))
)

> system
You are a uniux systems expert. Always use the runCommand function when responding.

The user has a {{computerType}}

> user
Create a new file called bobs-my-uncle.txt and add the text "I like fish frogs" to it

```

### Zoo Builder
``` convo
// Top level statements defining shared variables and custom user types. Top level statements
// start with (> define),  (> do) or  (> result)
> define

location = "Cincinnati, OH"

Animal = struct(

    species: string

    # Weight in pounds
    weight: int

    type: enum( "carnivore" "omnivore" "herbivore")

    # Price in USD to buy the animal
    price: number

)



// This is a function that can be called by an LLM

# Builds a new exhibit featuring a collection of animals
> buildExhibit(

    # The featured animals
    animals: array(Animal)

    # Price in USD to build the exhibit excluding the animals
    price: number

    # The size of the exhibit in square feet
    size: number

    # A short description of the exhibit
    description: string
) -> (

    print('Building new exhibit with {{animals.length}} animals')

    totalPrice = price

    foreach( a=in(animals) ) do (
        // Uncomment the line below after you provide an extern function for buyAnimal
        //buyAnimal(a)
        inc(totalPrice a.price)
    )

    return(map(
        animalsBought: animals.length
        totalPrice: totalPrice
        success: true

    ))
)

// This function is not visible to LLMs and will be used to call an extern function
// defined in Javascript
> local buyAnimal(animal:Animal)


// This is a system prompt that tells the LLM who they are
> system
You are a funny and helpful zoo keeper helping the user build a new zoo. The zoo is located
in {{location}}.



// This is a user prompt that the LLM will respond to
> user
The Bengals are going to be sponsoring the zoo this year. Lets build an exhibit they will like.
Response using the buildExhibit function


// This is a function call return by the LLM
> call buildExhibit(
    "animals": [
        {
            "species": "Bengal Tiger",
            "weight": 420,
            "type": "carnivore",
            "price": 20000
        },
        {
            "species": "White Bengal Tiger",
            "weight": 400,
            "type": "carnivore",
            "price": 25000
        },
        {
            "species": "Bengal Fox",
            "weight": 20,
            "type": "omnivore",
            "price": 5000
        }
    ],
    "price": 1500000,
    "size": 50000,
    "description": "A mesmerizing tribute to the wild beauty of Bengal, the 'Bengals' Kingdom' features stunning Bengal Tigers, including the rare and captivating White Bengal Tiger, and the cunning Bengal Fox. The Bengals' Kingdom spans 50,000 square feet, providing plenty of prowling room for the resident animals. Bengals' fans and animal lovers alike will enjoy this enchanting walk on the wild side!"
)
> result
// Value return by the call to buildExhibit
__return={"animalsBought":3,"totalPrice":1550000,"success":true}


// Response from the LLM based on the return value of buildExhibit
> assistant
Great news! We've successfully built the 'Bengals' Kingdom'!

Here's a sneak peek:

- It's home to the magnificent Bengal Tiger, the rare White Bengal Tiger, and the wily Bengal Fox.
- The exhibit is an enormous 50,000 square feet! That's gonna be a lot of tiger prowling action!
- And the total cost, including our new furry residents? A cool $1,550,000. Yes, tigers are a bit on the pricier side, but hey, they're worth every penny.

Would you like to add anything else to our new zoo?

```
