# iyio-common
Common types, functions and classes used by the IYIO (eye·o) framework.

The core requirement for code to be placed in the iyio-common library is based on dependencies.
Only the following dependencies are allowed to be used in the iyio-common library:

- date-fns
- rxjs
- uuid
- zod

### Index
- [Scopes](#scopes) - Dependency injection and application configuration
- [HttpClient](#httpclient) - An http for use in Node and the browser
- [QueryObjects](#query-objects) - An interface for representing custom client SQL select queries.
- [Query Client](#query-client) - A client for retrieving data using Query Objects
- [Short UUIDs](#short-uuids) - A utility function for generating short UUIDs
- [uiRouterService](#uirouterservice) - Application and framework agnostic navigation
- [ObjWatcher](#objwatcher) - A framework agnostic signals like implementation

<br/><br/><br/>

# Scopes
Scopes provided a form of dependency injection that is used by many of the classes and service
with in iyio. Scopes can be used to define services, clients, providers and configuration values.

By default scoped objects use a shared rootScope which makes using scoped objects transparent
in most cases

### Defining scoped objects
A scoped object is a function that returns a value defined within a scope. The scope the value is
created in also contains all of its dependencies.

When defining a scoped object use can supply a default value for the object or allow a value to be
provided later during scope initialization.

Use the functions below to define scoped objects.
``` ts

/**
 * Defines a scoped provider. Providers can create a single new instances of T.
 * @param name Display name of the provider
 * @param defaultProvider The default implementation of the provider.
 */
declare function defineProvider<T>(
    name:string,
    defaultProvider?:TypeProvider<T>|TypeProviderOptions<T>
):ProviderTypeDef<T>;

/**
 * Defines a scoped factory. Factories can create many instances of T.
 * @param name Display name of the factory
 * @param defaultFactory The default implementation of the factory.
 */
declare function defineFactory<T extends AnyFunction>(
    name:string,
    defaultFactory?:T
):FactoryTypeDef<T>;

/**
 * Defines a scoped async factory. Async factories can create many instances of T. The difference
 * between a factory and an async factory is that the return value of an async factory is a promise
 * that resolves to T where a non-async factory instantly returns a new value of type T.
 * @param name Display name of the async factory
 * @param defaultFactory The default implementation of the async factory.
 */
declare function defineAsyncFactory<T extends AnyAsyncFunction>(
    name:string,
    defaultFactory?:T
):FactoryTypeDef<T>;

/**
 * Defines a scoped service. A service is a singleton instance of a type within a scope. A service
 * will typically represent a single feature within an application.
 * @param name Display name of the service
 * @param defaultProvider The default implementation of the service.
 */
declare function defineService<T>(
    name:string,
    defaultProvider?:TypeProvider<T>|TypeProviderOptions<T>
):ServiceTypeDef<T>;

/**
 * Defines a scoped client. A client is a singleton instance of a type within a scope. A client
 * will typically represent a client that mainly communicates with a service such as a REST API
 * or a database.
 * @param name Display name of the client
 * @param defaultProvider The default implementation of the client.
 */
declare function defineClient<T>(
    name:string,
    defaultProvider?:TypeProvider<T>|TypeProviderOptions<T>
):ClientTypeDef<T>;

/**
 * Defines a scoped service factory. A service factory creates many instances of its service of type T.
 * @param name Display name of the service factory
 * @param defaultProvider The default implementation of the service factory.
 */
declare function defineServiceFactory<T>(
    name:string,
    provider:TypeProvider<T>
):ServiceTypeDef<T>;

/**
 * Defines a scoped client factory. A client factory creates many instances of its client of type T.
 * @param name Display name of the client factory
 * @param defaultProvider The default implementation of the client factory.
 */
declare function defineClientFactory<T>(
    name:string,
    provider:TypeProvider<T>
):ClientTypeDef<T>;

/**
 * Defines a scoped parameter (config value).
 * Use can use the shorthand defineStringParam, defineNumberParam and defineBoolParam functions for
 * defining params of type string, number and boolean.
 * @param name Display name of the param.
 * @param valueConverter A function used to converted the provided value of the param to its intended type.
 * @param defaultValue The default value of the param.
 */
declare function defineParam<T>(
    name:string,
    valueConverter?:(str:string,scope:Scope)=>T,
    defaultValue?:T
):ParamTypeDef<T>;

/**
 * Defines a scoped string parameter (string config value).
 * @param name Display name of the param.
 * @param defaultValue THe default value of the param.
 */
declare function defineStringParam(name:string,defaultValue?:string):ParamTypeDef<string>;

/**
 * Defines a scoped number parameter (number config value).
 * @param name Display name of the param.
 * @param defaultValue THe default value of the param.
 */
declare function defineNumberParam(name:string,defaultValue?:number):ParamTypeDef<number>;

/**
 * Defines a scoped boolean parameter (boolean config value).
 * @param name Display name of the param.
 * @param defaultValue THe default value of the param.
 */
declare function defineBoolParam(name:string,defaultValue?:boolean):ParamTypeDef<boolean>;
```

### Scope initialization
During scope initialization you can provide implementations and param values for scoped objects.
Values provided during initialization will override default values.

``` ts
import {
    authModule, httpParamsModule, isServerSide,
    ScopeModulePriorities, ScopeRegistration, UserFactory
} from "@iyio/common";
import { UserCtrl } from '../lib/UserCtrl';
import { FunnyMan } from '../lib/FunnyMan';
import { jokeClient } from '../lib/scoped-types';

export const appModule=(reg:ScopeRegistration)=>{

    // Register parameter values using a dictionary
    reg.addParams({
        "apiUrl":"api.example.com",
        "primaryColor":"#00ff00",
        // funnyJoke will be used by the FunnyMan class to tell a funny joke
        "funnyJoke":"What do you call an alligator detective? An investi-gator 😂",
    })

    // Registers a client implementation for jokeClient
    reg.implementClient(jokeClient,(scope)=>new FunnyMan(scope))

    // Registers a custom UserFactory that create a UserCtrl when user sign-in
    reg.addFactory(UserFactory,options=>new UserCtrl(options));

    // Registers the default auth module
    reg.use(authModule);

    // Registers parameter provider that retrieves parameters other HTTP
    reg.use(httpParamsModule);

    // Registers an init function that can execute side effects
    reg.use({
        // The init function will be called after configuration values have be registered
        priority:ScopeModulePriorities.postConfig,
        init:scope=>{
            // do side effects here
        }
    })
}

// initialize the root scope
initRootScope(appModule);

// or create a new scope and initialize it using the appModule
const newScope=createScope(appModule);

```

### Async initialization
If a scope has any modules that use async initializers then scope initialization will be asynchronous
and should be awaited. You can use the `getInitPromise` function of a scope to get a promise
that will complete once scope initialization is finished.

``` ts
// wait for root scope to initialization
await rootScope.getInitPromise();

// or create a new scope and wait for it to initialize
const newScope=createScope(appModule);
await newScope.getInitPromise();

```

### Using scoped objects
After a scoped object is defined it can be used by calling the function returned by one of the 
define scoped object functions.

``` ts
interface IJokeClient
{
    getJoke():string;
}

const jokeClient=defineClient<IJokeClient>('jokeClient');

// else where in your code after an implementation for jokeClient has been provided
const joke=jokeClient().getJoke();

```

<br/><br/>

# HttpClient
The HttpClient class provided a set of methods for all the common HTTP methods and automatically
handles retries, deserialization, authentication and other common HTTP requirements.

IYIO defines a scoped client named `httpClient` that can be used to access the default HttpClient.

### Usage

``` ts
import { httpClient } from "@iyio/common";

interface Joke
{
    id:number;
    joke:string;
    score:number;
}


// POST an object omitting its id to https://api.exaple.com/jokes
// The endpoint returns the id of the new joke
const jokeId=await httpClient().postAsync<number,Omit<Joke,'id'>>('https://api.exaple.com/jokes',{
    joke:'What do you call an alligator detective? An investi-gator 😂',
    score:1
})


// GET the new joke by id
// The return type of getAsync is Joke|undefined
const joke=await httpClient().getAsync<Joke>(`https://api.exaple.com/jokes/${jokeId}`);

// If joke is undefined a 404 was returned.
if(!joke){
    console.log('404 joke not found');
    return;
}


console.log(`joke: ${joke.joke}\nscore: ${joke.score}`);
// joke: What do you call an alligator detective? An investi-gator 😂
// score: 1


main();
```

### HttpClient methods
``` ts

class HttpClient{


    /**
     * Sends a GET Request to the given URI
     * @param uri endpoint URI
     * @param options additional request options
     * @returns The value returned from the endpoint. Undefined is returned in the cases of a 404.
     */
    public async getAsync<TReturn>(uri:string,options?:HttpClientRequestOptions):Promise<TReturn|undefined>;

    /**
     * Sends a GET Request to the given URI and returns the result as a string instead of parsing
     * the return as a JSON object.
     * @param uri endpoint URI
     * @param options additional request options
     * @returns The value returned from the endpoint as a string. Undefined is returned in the cases of a 404.
     */
    public async getStringAsync(uri:string,options?:HttpClientRequestOptions):Promise<string|undefined>;

    /**
     * Sends a GET Request to the given URI and returns a raw Response object.
     * @param uri endpoint URI
     * @param options additional request options
     * @returns A raw Response object.
     */
    public getResponseAsync(uri:string,options?:HttpClientRequestOptions):Promise<Response|undefined>;

    /**
     * Sends a POST Request to the given URI
     * @param uri endpoint URI
     * @param body The body of the request
     * @param options additional request options
     * @returns The value returned from the endpoint. Undefined is returned in the cases of a 404.
     */
    public async postAsync<TReturn,TBody=any>(uri:string,body:TBody,options?:HttpClientRequestOptions):Promise<TReturn|undefined>;

    /**
     * Sends a PATCH Request to the given URI
     * @param uri endpoint URI
     * @param body The body of the request
     * @param options additional request options
     * @returns The value returned from the endpoint. Undefined is returned in the cases of a 404.
     */
    public async patchAsync<TReturn,TBody=any>(uri:string,body:TBody,options?:HttpClientRequestOptions):Promise<TReturn|undefined>;

    /**
     * Sends a PUT Request to the given URI
     * @param uri endpoint URI
     * @param body The body of the request
     * @param options additional request options
     * @returns The value returned from the endpoint. Undefined is returned in the cases of a 404.
     */
    public async putAsync<TReturn,TBody=any>(uri:string,body:TBody,options?:HttpClientRequestOptions):Promise<TReturn|undefined>;

    /**
     * Sends a DELETE Request to the given URI
     * @param uri endpoint URI
     * @param options additional request options
     * @returns The value returned from the endpoint. Undefined is returned in the cases of a 404.
     */
    public async deleteAsync<TReturn>(uri:string,options?:HttpClientRequestOptions):Promise<TReturn|undefined>;


    /**
     * Applies a base url to the given uri. The HttpClient can be configured to replaced URI prefixes
     * with full base URLs. For example if `@api` is configured to be replaced with `https://api.example.com/v1`
     * then passing a value of `@api/messages` to applyBaseUrl will return `https://api.example.com/v1/message`.
     * @param uri
     * @returns
     */
    public applyBaseUrl(uri:string):string;

     /**
      * Sends a request to the URL. All other request methods of the HttpClient class are shorthand
      * methods of this method.
      * @param method HTTP method of the request
      * @param uri endpoint URI
      * @param body A body to send as part of the request
      * @param options additional request options
      * @returns By default the returned value from the endpoint is parsed as a JSON object and
      *          returned. You can optionally have a raw Response object returned.
      */
    public async requestAsync<T>(
        method:HttpMethod,
        uri:string,
        body?:any,
        options?:HttpClientRequestOptions
    ):Promise<T|undefined>;
}



/**
 * Options for configuring requests sent by the HttpClient class
 */
export interface HttpClientOptions
{
    /**
     * Maps URIs prefixed to base URLs
     * @example
     * // this mapping allows URLs like `@api/messages` to be passed to the request methods of
     * // HttpClient and those request be sent to https://api.example.com/v1
     * {
     *     "api":"https://api.example.com/v1"
     * }
     */
    baseUrlMap?:HashMap<string>;

    /**
     * References to HttpRequestSigners that can sign requests. Currently used by the
     * AwsHttpRequestSigner to sign requests sent to AWS services.
     */
    signers?:TypeDef<HttpRequestSigner>;

    /**
     * References to fetchers that preference the actual HTTP request for the HttpClient class.
     * By default the global fetch function is used.
     */
    fetchers?:TypeDef<HttpFetcher>;

    /**
     * The URL prefix that a URI must start with to be remapped.
     * @default '@'
     */
    baseUrlPrefix?:string;

    /**
     * References to JwtProviders
     */
    jwtProviders?:TypeDef<JwtProvider>;

    /**
     * If true all requests are written to the console
     */
    logRequests?:boolean;

    /**
     * If true all responses are written to the console
     */
    logResponses?:boolean;

    /**
     * Max number of a request should be retired. Requests are retired in the cases of connection
     * errors or server errors (500 status codes).
     */
    maxRetries?:number;

    /**
     * Number of milliseconds to delay between request retires
     */
    retryDelay?:number;
}

```

<br/><br/>

# Query Objects
Query Objects provide a consistent interface for representing custom SQL queries that are constructed
from user input.

For example imagine a component with a dropdown menu that allows users to view different customer
profiles based on events generated by the customers. As different events are selected in the dropdown
a query object is updated to reflect the changes without the need to allow for arbitrary SQL queries
created in the frontend or the need for a dedicated api endpoint.

``` html
<select id="event-type">
    <option value="pageView">Page View</option>
    <option value="cartAdd" selected>Add to Cart</option>
    <option value="cartAbandon">Abandon Cart</option>
</select>
```

``` ts

// eventType will have a value of "cardAdd" since the "Add to Cart" option is selected
const eventType=document.querySelector('#event-type').value;

const customerQuery:Query={
    table:"Profile",
    columns:[
        {col:"id",name:"id"},
        {col:"name",name:"name"},
        {col:"email",name:"email"},
    ],
    condition:{
        left:{col:"id"},
        op:'in',
        right:{subQuery:{query:{
            table:"EventRecord",
            columns:[{col:"profileId",name:"profileId"}],
            condition:{
                op:'and',
                conditions:[
                    {
                        left:{col:"profileId"},
                        op:'=',
                        right:{col:{name:"id",target:"parent"}}
                    },
                    {
                        left:{col:"type"},
                        op:'=',
                        right:{value:eventType}
                    }
                ]
            },
            limit:1
        }}}
    },
    limit: 20,
}
```

The customerQuery Query Object can now be sent to an API endpoint to execute the query and the query
is guaranteed to be save to execute and free of and SQL injections.

The `buildQuery` function can be used to convert the Query Object into SQL. Below is the result of
passing the above customerQuery to the `buildQuery` function.

``` sql
select "id" as "id" , "name" as "name" , "email" as "email"
from "Profile" as "_tbl_1"
where (
    ( "id" ) in ( (
        select "profileId" as "profileId"
        from "EventRecord" as "_tbl_2"
        where ( ( ( "profileId" ) = ( "_tbl_1"."id" ) ) and ( ( "type" ) = ( 'cartAdd' ) ) )
        limit 1
    ) )
) limit 20
```

The SQL generated by `buildQuery` is a little on the verbose side but insures proper order of
operations in all situations.

### Query Object interfaces
``` ts
/**
 * An SQL select query represented in object form.
 */
interface Query
{
    /**
     * An optional id that can be used for any purpose
     */
    id?:string;

    /**
     * The columns or values to select. If not defined all columns are selected using the * operator
     */
    columns?:NamedQueryValue[];

    /**
     * Name of table to select or a query to use for projection
     */
    table?:string|Query;

    /**
     * A name to define the table as in the query. If not defined a unique name will be generated.
     */
    tableAs?:string;

    /**
     * Tables or projections to join to the query
     */
    join?:QueryJoin|QueryJoin[];

    /**
     * A where condition or a group of where conditions
     */
    condition?:QueryConditionOrGroup;

    /**
     * Is converted into a condition where the keys of the match are columns that should equal their
     * corresponding values.
     */
    match?:HashMap;

    /**
     * Columns to order by results by
     */
    orderBy?:OrderCol|OrderCol[];

    /**
     * A column or columns to group the group by
     */
    groupBy?:string|string[];

    /**
     * Limits the number of results returned
     */
    limit?:number;

    /**
     * Skips the specified number of rows returned
     */
    offset?:number;


    /**
     * If true the user should not be allowed to order the query
     */
    disableUserOrderBy?:boolean;

    isUserReadonly?:boolean;

    /**
     * If true debug information about the query should be printed
     */
    debug?:boolean;

    /**
     * A display label
     */
    label?:string;

    /**
     * If defined the query defined by passthrough should be used in-place of this query.
     */
    passthrough?:Query;

    metadata?:Record<string,any>;
}

interface SubQuery
{
    /**
     * This condition is used to limit the selected item to the scope of the parent query. In most
     * cases the condition will match the primary key of the parent query to a foreign key of the
     * sub-query. This condition will be added the sub-query using a "AND" group condition.
     */
    condition?:QueryConditionOrGroup;

    /**
     * The query to execute
     */
    query:Query;
}

interface QueryJoin
{
    /**
     * Name of table to join
     */
    table:string;

    /**
     * A name to define the table as in the query. If not defined a unique name will be generated.
     */
    tableAs?:string;

    /**
     * This condition used to join the table
     */
    condition:QueryConditionOrGroup;

    /**
     * If required then joined rows must have a match. For SQL queries non-required joins
     * as performed as left or outer joins.
     */
    required?:boolean;
}


/**
 * Represents a query to be ran on a static set of data
 */
interface QueryWithData<T=any> extends Omit<Query,'table'>
{
    table:T[];
}

type QueryOrQueryWithData<T=any>=Query|QueryWithData<T>;

/**
 * Operators to combine multiple query conditions, either `and` or `or`
 */
type QueryGroupConditionOp='and'|'or';

/**
 * Groups conditions with an AND or an OR operator
 */
interface QueryGroupCondition
{
    /**
     * The operation used to combined the conditions
     */
    op:QueryGroupConditionOp;

    /**
     * The condition to combined
     */
    conditions:QueryConditionOrGroup[];

    /**
     * A display label
     */
    label?:string;

    /**
     * Metadata to attach to the condition. Mainly used to bind UI interfaces to query conditions
     */
    metadata?:Record<string,any>;

}

/**
 * Operators allowed to be used in query conditions
 */
type QueryConditionOp='='|'!='|'>'|'<'|'>='|'<='|'like'|'is'|'in'

interface QueryCondition
{
    /**
     * The left side of the condition
     */
    left:QueryValue;

    /**
     * The operator used for comparison
     */
    op:QueryConditionOp;

    /**
     * Inverts the logic of the operator (op prop)
     */
    not?:boolean;

    /**
     * The right side of the condition
     */
    right:QueryValue;

    /**
     * A display label
     */
    label?:string;

    /**
     * Metadata to attach to the condition. Mainly used to bind UI interfaces to query conditions
     */
    metadata?:Record<string,any>;

}

type QueryConditionOrGroup=QueryCondition|QueryGroupCondition;

/**
 * All allowed functions 
 */
type QueryFunction=(
    'count'|'sum'|'avg'|'min'|'max'|'round'|
    'lower'|'upper'|'len'|'trim'|'ltrim'|'rtrim'|'concat'|'replace'|'strcmp'|
    'reverse'|'coalesce'
)

/**
 * All operators allowed as part of a query expression
 */
type QueryExpressionOperator=(
    '('|')'|'-'|'+'|'/'|'*'|'%'|'&'|'|'|'^'|'='|'>'|'<'|'>='|'>='|'<>'|
    'all'|'and'|'any'|'between'|'exists'|'in'|'like'|'not'|'or'|'some'
)

/**
 * QueryGeneratedValues are values that are evaluated during the conversion of a query object into
 * sql. For example the timeMs generated value will insert the current date and time as a timestamp
 * using the Date.now() javascript function.
 */
type QueryGeneratedValue={
    type:'timeMs';
    offset?:number;
}|{
    type:'timeSec';
    offset?:number;
}

/**
 * Represents any of the possible value types that can be used. Only one property of the QueryValue
 * should be defined at a time. Defining more that one property at a time can result in undefined
 * behaviour.
 */
interface QueryValue
{
    /**
     * A sub-query to use as the value
     */
    subQuery?:SubQuery;

    /**
     * A column to use a the value
     */
    col?:QueryCol|string;

    /**
     * A literal value to use as the value
     */
    value?:string|number|boolean|null|((string|number|boolean|null)[]);

    /**
     * A value that is generated at the time the query is built
     */
    generatedValue?:QueryGeneratedValue;

    /**
     * A predefined function to use as a value
     */
    func?:QueryFunction|QueryFunction[];

    /**
     * Function arguments. If args undefined the the other properties of the QueryValue will be used
     * as the first argument of the called function
     */
    args?:QueryValue[];

    /**
     * When defined the value will be wrapped in a coalesce function call with the second argument
     * being the value of the coalesce prop.
     */
    coalesce?:string|number|boolean|((string|number|boolean)[]);

    /**
     * An array of query values and expression operators that can be used to express complex
     * query operators.
     */
    expression?:(OptionalNamedQueryValue|QueryExpressionOperator)[];
}

interface OptionalNamedQueryValue extends QueryValue
{
    /**
     * the (as) part of a column select - select tableB.price as {name}
     */
    name?:string;
}

interface NamedQueryValue extends QueryValue
{
    /**
     * the (as) part of a column select - select tableB.price as {name}
     */
    name:string;
}

/**
 * Represents a table in a table stack as a query is being built. As sub-queries are constructed
 * the sub-queries are pushed onto the stack and popped off once built. Numeric values represent
 * an index within the stack and can be a negative value. Negative values are calculated by
 * subtracting the target numeric value from the size of the stack, so -1 is the top table on
 * the stack.
 * - none = no target table, the table will be determined by context during sql execution.
 * - current = the top most table in the stack. Represents index -1
 * - parent = the table above the current table. Represents index -2
 */
type QueryTargetTable=number|'none'|'current'|'parent';

/**
 * Represents a column to select or use in an operation
 */
interface QueryCol
{
    /**
     * The name of the column
     */
    name:string;

    /**
     * The table the column belongs to
     */
    table?:string;

    /**
     * The target table the column belongs to.
     * @see QueryTargetTable
     */
    target?:QueryTargetTable;
}

/**
 * A column with order defined
 */
interface OrderCol extends QueryCol
{
    desc?:boolean;
}
```

## Query Client
The `queryClient()` scoped object provides a uniform interface for fetching data based on Query
Objects and is primarily intended to be used on the frontend as a secure way of allowing user input
to form SQL queries to select data.

``` ts
import { Query, queryClient } from "@iyio/common";

interface MediaItem
{
    id:number;
    name:string;
    contentType:string;
    url:string
    size:number;
}

// Selects the 20 largest images from a table named MediaItems
const mediaQuery:Query={
    table:"MediaItems",
    condition:{
        left:{col:"contentType"},
        op:"like",
        right:{value:"image/%"}
    },
    limit:20,
    orderBy:{name:"size",desc:true}
}

const mediaItems=await queryClient().selectQueryItemsAsync(mediaQuery);

```

There is not default implementation for `queryClient()`, one must be registered during scope
initialization. Is most cases a queryClient implementation will forward Query Objects to an api
endpoint for execution. queryClient implementations must implement the IQueryClient interface

``` ts
interface IQueryClient
{
    selectQueryItemsAsync<T=any>(query:Query):Promise<T[]>;
}
```

<br/><br/>

## Short UUIDs
You can use the `shortUuid()` function to generate URL friendly base64 encoded UUIDs. The base64
encoded UUIDs have the same uniqueness but are shorted since they are base64 encoded instead of
HEX encoded. The `=` padding characters are removed and the `+` and `/` characters are replaced
with `-` and `_` so that the generated UUIDs are still valid URI components and file names.

Below are the characters used when generating short UUIDs
``` text 
ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_
```

``` ts
import { shortUuid } from "@iyio/common";

console.log(shortUuid())
// aqTtvtcYQyWMrf3XlVgv1w
```


<br/><br/>

## uiRouterService
The `uiRouterService()` scoped service is an application and framework agnostic service that allows
a uniform interface for handing navigation in applications. It is roughly models around the browser
history api. The default implementation of `uiRouterService()` uses the browser history api to 
implement navigation. IYIO also offers an NextJS uiRouterService implementation called `NextJsUiRouter`.

``` ts
import { uiRouterService } from "@iyio/common";

// goto /example-page
uiRouterService().push('/example-page');

// go back to previous page
uiRouterService().pop();

```

### Use with NextJS
To use `uiRouterService()` with NextJS register the `nextJsModule` during scope initialization.

``` ts
import { nextJsModule, NextJsUiRouter } from "@iyio/nextjs-common";

initRootScope(scope=>{
    // The nextJsModule registers the NextJsUiRouter service.
    scope.use(nextJsModule);

    // alternatively use can directly register the NextJsUiRouter service.
    scope.implementService(uiRouterService,()=>new NextJsUiRouter());
})
```

<br/><br/>

## ObjWatcher
ObjWatcher is a set of functions and classes that implement a signals like api that allow for 
mutations of plain javascript objects to be observed and reacted to. This allows you to define
simple state objects for a complex components and allow child components can observe and make
changes to state.

``` ts
import { wAryPush, wSetProp, watchObj } from "@iyio/common";

const person={
    name:'Jeff',
    age:45,
    jobs:[
        {position:'Cook',annualIncome:60000},
        {position:'Janitor',annualIncome:55000}
    ],
    hobby:{
        name:'RC Car Racing',
        hoursPerWeek:8,
    }
}

const watcher=watchObj(person);

// triggered when person.name is changed
watcher.watchPath('name',()=>{
    console.log(`Name set to ${person.name}`);
})

// triggered when person.hobby or person.hobby.name is changed
watcher.watchPath('hobby.name',()=>{
    console.log(`Hobby set to ${person.hobby.name}`)
})

// triggered when jobs or any descendent of jobs is changed.
watcher.watchDeepPath('jobs',()=>{
    console.log(`Jobs updated. count - ${person.jobs.length}`)
})


wSetProp(person,'name','Mark');
wSetProp(person.hobby,'name','Riding horses');
wSetProp(person,'hobby',{name:'Watching birds',hoursPerWeek:5});
wSetProp(person.jobs[0],'annualIncome',64000);
wAryPush(person.jobs,{position:'Car Sales',annualIncome:70000});

// use the stopWatchingObj function to remove all listeners and stop watching the person object
stopWatchingObj(person);

// console logs:
// Name set to Mark
// Hobby set to Riding horses
// Hobby set to Watching birds
// Jobs updated. - count 2
// Jobs updated. - count 3
```

### Watch Functions
Use the following functions to watch for changes to objects.
``` ts
/**
 * Gets or creates a object watcher for the given object and increments the watchers ref count
 */
const watchObj=<T extends Watchable>(obj:T):ObjWatcher<T>;

/**
 * Decrements the ref count of the given objects watcher. If the ref count is zero or less the
 * watcher is removed
 */
const stopWatchingObj=<T>(obj:T):ObjWatcher<T>|undefined;

/**
 * Get the watcher of the given object and optionally creates the watcher if it does not exist
 */
const getObjWatcher=<T>(obj:T,autoCreate:boolean):ObjWatcher<T>|undefined;

/**
 * Watches an object and all of its descendants 
 */
const watchObjDeep=<T extends Watchable>(
    obj:T,
    listener:ObjRecursiveListenerOptionalEvt,
    options?:PathWatchOptions
):WatchedPath;

/**
 * Watches an object at the given path
 */
const watchObjAtPath=<T extends Watchable>(
    obj:T,
    path:RecursiveKeyOf<T>,
    listener:ObjRecursiveListenerOptionalEvt,
    options?:PathWatchOptions
):WatchedPath;

/**
 * Watches an object and all of its descendants based on a filter. The filter allows for specifying
 * multiple branching paths. 
 */
const watchObjWithFilter=<T extends Watchable>(
    obj:T,
    filter:ObjWatchFilter<T>,
    listener:ObjRecursiveListenerOptionalEvt,
    options?:PathWatchOptions
):WatchedPath;
```

### Mutate Functions
Use the following functions to mutate objects and allow the mutations to be watched.
``` ts
/**
 * Sets a value at the given path.
 */
const wSetProp=<T,P extends keyof T>(obj:T|null|undefined,prop:P,value:T[P],source?:any):T[P];

/**
 * Sets a value at the given path. If an object already exists at the path the existing and new value
 * are merged together. The existing value will be mutated.
 */
const wSetOrMergeProp=<T,P extends keyof T>(obj:T|null|undefined,prop:P,value:T[P],source?:any):T[P];

/**
 * Sets a value at the given path using the current value and apply the not operator. This is
 * equivalent to `obj[prop]=!obj[prop]`
 */
const wToggleProp=<T,P extends keyof T>(obj:T|null|undefined,prop:P,source?:any):boolean;

/**
 * Sets or deletes the value at the given path. If the `value` is falsy then the value at the path is
 * deleted otherwise the value is set.
 */
const wSetPropOrDeleteFalsy=<T,P extends keyof T>(obj:T|null|undefined,prop:P,value:T[P]):T[P];

/**
 * Sets or deletes the value at the given path. If the `value` equals `deleteWhen` then the value at the path is
 * deleted otherwise the value is set.
 */
const wSetPropOrDeleteWhen=<T,P extends keyof T>(obj:T|null|undefined,prop:P,value:T[P],deleteWhen:T[P]):T[P];

/**
 * Deletes the value at the given path.
 */
const wDeleteProp=<T,P extends keyof T>(obj:T|null|undefined,prop:P,source?:any):void;


/**
 * Deletes all properties of an object
 */
const wDeleteAllObjProps=(obj:any);

/**
 * Pushes a value onto an array
 */
const wAryPush=<T extends Array<any>>(obj:T|null|undefined,...values:T[number][]);

/**
 * Splices an array
 */
const wArySplice=<T extends Array<any>>(
    obj:T|null|undefined,index:number,deleteCount:number,...values:T[number][]
):boolean;

/**
 * Splices an array and relays information about the source that triggered the change.
 */
const wArySpliceWithSource=<T extends Array<any>>(
    source:any,obj:T|null|undefined,index:number,deleteCount:number,values:T[number][]
):boolean;

/**
 * Removes the given value from an array
 */
const wAryRemove=<T extends Array<any>>(obj:T|null|undefined,value:any):boolean;

/**
 * Removes a value from an array at the given index
 */
const wAryRemoveAt=<T extends Array<any>>(obj:T|null|undefined,index:number,count=1):boolean;

/**
 * Moves items in an array
 */
const wAryMove=<T extends Array<any>>(obj:T|null|undefined,fromIndex:number,toIndex:number,count=1,source?:any):boolean;

/**
 * Triggers an event on the given object. Event triggering allows objects to act as channels for events
 * without the actual object having any knowledge of the events.
 */
const wTriggerEvent=<T>(obj:T|null|undefined,type:string|symbol,value?:any,source?:any):void;

/**
 * Triggers a change event for the given object.
 */
const wTriggerChange=<T>(obj:T|null|undefined,source?:any):void;

/**
 * Triggers the `load` event for the given object.
 */
const wTriggerLoad=<T>(obj:T|null|undefined,prop?:keyof T,source?:any):void;
```
