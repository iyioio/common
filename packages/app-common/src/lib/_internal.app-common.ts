import { createSetter } from "@iyio/common";
import { User } from "./User";

export const _setUser=createSetter<User|null>();
