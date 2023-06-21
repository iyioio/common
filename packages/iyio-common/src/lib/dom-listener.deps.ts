import { DomListener } from "./DomListener";
import { defineService } from "./scope-lib";

export const domListener=defineService<DomListener>('domListener',()=>new DomListener());
