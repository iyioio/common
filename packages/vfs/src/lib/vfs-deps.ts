import { defineProvider, defineService } from "@iyio/common";
import { VfsCtrl } from "./VfsCtrl";
import { VfsMntCtrl } from "./VfsMntCtrl";

export const vfs=defineService<VfsCtrl>('vfs',()=>new VfsCtrl());

export const vfsMntPtProvider=defineProvider<VfsMntCtrl>('vfsMntPtProvider');
