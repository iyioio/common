import { MdxUiBuilder } from "@iyio/mdx-ui-builder";
import { createContext, useContext } from "react";

export const MdxUiBuilderReactContext=createContext<MdxUiBuilder|null>(null);

export const useOptionalMdxUiBuilder=():MdxUiBuilder|null=>{
    return useContext(MdxUiBuilderReactContext);
}
