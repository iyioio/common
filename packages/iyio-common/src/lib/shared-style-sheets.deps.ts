
import { SharedStyleSheetRenderer } from "./SharedStyleSheetRenderer";
import { defineService } from "./scope-lib";
import { ISharedStyleSheetRenderer } from "./shared-style-sheets-types";

export const styleSheetRenderer=defineService<ISharedStyleSheetRenderer>('styleSheetRenderer',()=>new SharedStyleSheetRenderer());
