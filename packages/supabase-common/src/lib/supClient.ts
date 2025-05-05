import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { supabaseAnonKeyParam, supabaseApiUrlParam } from './supabase-common.deps';

let client:SupabaseClient|null=null;
export const supClient=():SupabaseClient=>{
    return client??(client=createClient(supabaseApiUrlParam(),supabaseAnonKeyParam()));
}
