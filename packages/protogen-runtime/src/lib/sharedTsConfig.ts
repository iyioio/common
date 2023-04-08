import { z } from "zod";

export const SharedTsPluginConfigScheme=z.object(
{
    tsSchemePrefix:z.string().optional(),

    /**
     * @default Scheme
     */
    tsSchemeSuffix:z.string().optional(),
})

export type SharedTsPluginConfig=z.infer<typeof SharedTsPluginConfigScheme>;

export const defaultTsSchemePrefix='';
export const defaultTsSchemeSuffix='Scheme';

export const getTsSchemeName=(name:string,{
    tsSchemePrefix=defaultTsSchemePrefix,
    tsSchemeSuffix=defaultTsSchemeSuffix
}:SharedTsPluginConfig)=>(
    `${tsSchemePrefix}${name}${tsSchemeSuffix}`
)
