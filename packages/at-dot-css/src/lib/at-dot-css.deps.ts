import { defineService } from "@iyio/common";
import { AtDotCssHeadRenderer } from "./AtDotCssHeadRenderer";
import { IAtDotCssRenderer } from "./at-dot-css-lib-types";

export const atDotCssRenderer=defineService<IAtDotCssRenderer>('atDotCssRenderer',()=>new AtDotCssHeadRenderer());
