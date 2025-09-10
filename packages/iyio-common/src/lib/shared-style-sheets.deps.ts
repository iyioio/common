
import { SharedStyleSheetRenderer } from "./SharedStyleSheetRenderer.js";
import { defineService } from "./scope-lib.js";
import { ISharedStyleSheetRenderer } from "./shared-style-sheets-types.js";

export const styleSheetRenderer=defineService<ISharedStyleSheetRenderer>('styleSheetRenderer',()=>new SharedStyleSheetRenderer());
