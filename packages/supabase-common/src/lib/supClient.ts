import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { supabaseAnonKeyParam, supabaseApiUrlParam, supabaseServiceRoleKeyParam } from './supabase-common.deps.js';

/**
 * Returns the service client if the service role key param is defined, otherwise the user client is returned
 */
export const supClient=():SupabaseClient=>{
    return supabaseServiceRoleKeyParam.get()?supServiceClient():supUserClient();
}

let userClient:SupabaseClient|null=null;
/**
 * Returns the Supabase client for the current signed in user or the anon user
 */
export const supUserClient=():SupabaseClient=>{
    return userClient??(userClient=createClient(supabaseApiUrlParam(),supabaseAnonKeyParam()));
}

let serviceClient:SupabaseClient|null=null;
/**
 * Returns the Supabase client using the service role key
 */
export const supServiceClient=():SupabaseClient=>{
    return serviceClient??(serviceClient=createClient(supabaseApiUrlParam(),supabaseServiceRoleKeyParam()));
}
