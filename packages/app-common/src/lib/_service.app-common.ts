import { createReadonlySubjectRef, createServiceRef } from "@iyio/common";
import { Auth } from "./Auth";
import { User } from "./User";
import { setUsr } from "./_internal.app-common";

export const auth=createServiceRef<Auth>('auth',(deps)=>new Auth(deps));

export const usr=createReadonlySubjectRef<User|null>('usr',null,setUsr);
