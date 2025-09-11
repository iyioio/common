import { createVfsMdxUiComponentCache } from "./createVfsMdxUiComponentCache.js";
import { MdxUiComponentCache } from "./mdx-ui-builder-types.js";

let defaultCache:MdxUiComponentCache|undefined=undefined;

export const getDefaultMdxUiComponentCache=():MdxUiComponentCache=>{
    return defaultCache??(defaultCache=createVfsMdxUiComponentCache());
}
