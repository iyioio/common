import { createSetter } from "@iyio/common";
import { User } from "./User";

export const setUsr=createSetter<User|null>();
