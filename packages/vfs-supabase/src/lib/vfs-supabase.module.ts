import { ScopeRegistration } from "@iyio/common";
import { vfsMntPtProvider, vfsMntTypes } from "@iyio/vfs";
import { VfsSupabaseMntCtrl } from "./VfsSupabaseMntCtrl";

export const useVfsSupabase=(scope:ScopeRegistration)=>{

    scope.addProvider(vfsMntPtProvider,scope=>VfsSupabaseMntCtrl.fromScope(scope),vfsMntTypes.file);

}
