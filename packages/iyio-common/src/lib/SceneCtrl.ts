import { buildScene } from "./scene-lib";
import { Scene, SceneDescriptorProvider } from "./scene-types";

let defaultCtrl:SceneCtrl|null=null;
let staticIsDefault=false;
export const sceneCtrl=():SceneCtrl=>{
    if(defaultCtrl){
        return defaultCtrl;
    }
    staticIsDefault=true;
    try{
        defaultCtrl=new SceneCtrl();
    }finally{
        staticIsDefault=false;
    }
    return defaultCtrl;
}


export class SceneCtrl
{

    public readonly providers:SceneDescriptorProvider[]=[];

    public readonly isDefault:boolean;

    public constructor()
    {
        this.isDefault=staticIsDefault;
    }

    public addProvider(provider:SceneDescriptorProvider){
        this.providers.push(provider);
    }

    public removeProvider(provider:SceneDescriptorProvider){
        const i=this.providers.indexOf(provider);
        if(i===-1){
            return false;
        }
        this.providers.splice(i,1);
        return true;
    }

    public buildScene():Scene
    {
        return buildScene(this.providers);
    }
}
