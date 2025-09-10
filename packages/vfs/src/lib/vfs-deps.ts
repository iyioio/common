import { defineProvider, defineService } from "@iyio/common";
import { VfsCtrl } from "./VfsCtrl.js";
import { VfsMntCtrl } from "./VfsMntCtrl.js";

export const vfs=defineService<VfsCtrl>('vfs',()=>new VfsCtrl());

export const vfsMntPtProvider=defineProvider<VfsMntCtrl>('vfsMntPtProvider');
