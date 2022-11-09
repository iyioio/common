# IYIO - (a work in progress)
A TypeScript application framework that tries not to get in the way 🤓. IYIO has a heavy focus on 
convention over configuration and at the same time allows for fine tuned control over the resources
in your application.

## Core Concepts
- Scopes
- Type Definition - Provide metadata for the types in your application
- Dependency injection
- Services
- Providers
- Clients
- Observability
- Params
- Data stores

## Scopes
Scope are independent collections of resources that share a common environnement.


## Type Definitions
Type Definitions (TypeDef&lt;T&gt;) are used to define metadata for a given type in your application
and can even provide a default implementation for a type.

### Type Definition Naming Convention
- services - {name}Service
- observables - current{name}
- parameter / config - {name}Param
- factory - Name of callback function minus Callback.
  - Callback function = UserFactoryCallback
  - FactoryTypeDef = UserFactory
- setters - _set{name}
- providers - {full type name}s
- other - {full type name}Type


<br/>
<br/>
<br/>
<br/>
<br/>
<br/>
<br/>
<br/>

# OLD Below

## Type Refs
TypeRefs are a way to reference a type using a const variable and allow for fluid type inference
through out the framework.

## Dependency Injections

## Dependency Containers

## Services

Services are created using the createServiceRef function.

``` ts
import { createServiceRef } from "@iyio/common";
import { Auth } from "./Auth";

export const auth=createServiceRef<Auth>('auth',(deps)=>new Auth(deps));


```

## Subjects

Subjects are created using the createSubjectRef function.

``` ts
import { createReadonlySubjectRef } from "@iyio/common";
import { User } from "./User";
import { setUsr } from "./_internal.app-common";


export const usr=createReadonlySubjectRef<User|null>('usr',null,setUsr);
```

## Stores
It's kinda like the Unix filesystem

## App Services
- auth

## Special Filename Prefixes

Many of the libraries in the IYIO framework use a handful of special filename prefixes to make it
easy to find code of importance.

- _config.* - Used to define configuration keys and values
- _internal.* -  Used to define internal values for a library
- _ref.* - Used to define TypeRefs
- _reg.* - Used to register TypeRef implementation
- _service.* - Used to define global services and subjects

## Naming conventions
- services - {name}Service
- observables - current{name}
- parameter / config - {name}Param
- setters - _set{name}
- providers - {full type name}s
- other - {full type name}Type
