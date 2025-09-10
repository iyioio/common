import { ScopeRegistration } from "@iyio/common";
import { vfsMntPtProvider, vfsMntTypes } from "@iyio/vfs";
import { VfsDiskMntCtrl } from "./VfsDiskMntCtrl.js";

export const useVfsNode=(scope:ScopeRegistration)=>{

    scope.addProvider(vfsMntPtProvider,()=>new VfsDiskMntCtrl(),vfsMntTypes.file);

}
