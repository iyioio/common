import { DomListener } from "./DomListener.js";
import { defineService } from "./scope-lib.js";

export const domListener=defineService<DomListener>('domListener',()=>new DomListener());
