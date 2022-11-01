# IYIO Common
A framework agnostic TypeScript application framework 🤔

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
- _service.* - Used to define global services and subjects
