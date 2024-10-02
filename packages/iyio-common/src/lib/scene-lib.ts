import { Scene, SceneAction, SceneDescriptor, SceneDescriptorProvider, SceneObj, SceneObjPartial, ScenePartial } from "./scene-types";

interface Ids
{
    nextSceneId:number;
    nextObjId:number;
}

export const findSceneAction=(actionId:string,scene:Scene):SceneAction|undefined=>{
    return findActionInScene(actionId,scene);
}

const findActionInScene=(actionId:string,scene:Scene):SceneAction|undefined=>{
    if(scene.actions){
        for(const a of scene.actions){
            if(a.id===actionId){
                return a;
            }
        }
    }
    if(scene.objects){
        for(const o of scene.objects){
            const r=findActionInObject(actionId,o);
            if(r){
                return r;
            }
        }
    }
    if(scene.children){
        for(const c of scene.children){
            const r=findActionInScene(actionId,c);
            if(r){
                return r;
            }
        }
    }
    return undefined;
}
const findActionInObject=(actionId:string,obj:SceneObj):SceneAction|undefined=>{
    if(obj.actions){
        for(const a of obj.actions){
            if(a.id===actionId){
                return a;
            }
        }
    }
    if(obj.children){
        for(const c of obj.children){
            const r=findActionInScene(actionId,c);
            if(r){
                return r;
            }
        }
    }
    return undefined;
}

export const buildScene=(providers:SceneDescriptorProvider[]):Scene=>
{
    const ids:Ids={
        nextSceneId:2,
        nextObjId:1,
    }
    const scene:Scene={
        id:'scene1'
    }

    for(const p of providers){
        const r=p();
        if(!r){
            continue;
        }

        if(Array.isArray(r)){
            for(const d of r){
                addDescriptor(ids,scene,d);
            }
        }else{
            addDescriptor(ids,scene,r);
        }

    }

    return scene;
}

const addDescriptor=(ids:Ids,scene:Scene,desc:SceneDescriptor)=>{
    if(desc.scene){
        addScene(ids,scene,desc.scene);
    }
    if(desc.scenes){
        for(const s of desc.scenes){
            if(s){
                addScene(ids,scene,s);
            }
        }
    }
    if(desc.obj){
        addObj(ids,scene,desc.obj);
    }
    if(desc.objs){
        for(const o of desc.objs){
            if(o){
                addObj(ids,scene,o);
            }
        }
    }
    if(desc.props){
        for(const prop of desc.props){
            if(!prop){
                continue;
            }
            if(!scene.props){
                scene.props=[]
            }
            scene.props.push(prop);
        }
    }
    if(desc.actions){
        for(const action of desc.actions){
            if(!action){
                continue;
            }
            if(!scene.actions){
                scene.actions=[]
            }
            action.id=scene.id+'_'+action.name.replace(nonWord,'_');
            scene.actions.push(action as any);
        }
    }
}

const nonWord=/\W/g;

const addScene=(ids:Ids,scene:Scene,childScene:ScenePartial)=>{
    if(!scene.children){
        scene.children=[];
    }
    scene.children.push(fillScene(ids,childScene));
}

const addObj=(ids:Ids,scene:Scene,obj:SceneObjPartial)=>{
    if(!scene.objects){
        scene.objects=[];
    }
    scene.objects.push(fillObj(ids,obj));
}

const fillObj=(ids:Ids,obj:SceneObjPartial):SceneObj=>{
    obj.id='obj'+(ids.nextObjId++);
    if(obj.children){
        for(let i=0;i<obj.children.length;i++){
            const child=obj.children[i];
            if(!child){
                obj.children.splice(i,1);
                i--;
                continue;
            }
            fillObj(ids,child);
        }
    }
    fillProps(obj);
    return obj as SceneObj;
}
const fillScene=(ids:Ids,scene:ScenePartial):Scene=>{
    scene.id='scene'+(ids.nextSceneId++);
    if(scene.objects){
        for(let i=0;i<scene.objects.length;i++){
            const obj=scene.objects[i];
            if(!obj){
                scene.objects.splice(i,1);
                i--;
                continue;
            }
            fillObj(ids,obj);

        }
    }
    if(scene.children){
        for(let i=0;i<scene.children.length;i++){
            const child=scene.children[i];
            if(!child){
                scene.children.splice(i,1);
                i--;
                continue;
            }
            fillScene(ids,child);

        }
    }
    fillProps(scene);
    return scene as Scene;
}

const fillProps=(obj:SceneObjPartial|ScenePartial)=>{
    if(obj.props){
        for(let i=0;i<obj.props.length;i++){
            const item=obj.props[i];
            if(!item){
                obj.props.splice(i,1);
                i--;
            }

        }
    }
    if(obj.actions){
        for(let i=0;i<obj.actions.length;i++){
            const action=obj.actions[i];
            if(!action){
                obj.actions.splice(i,1);
                i--;
            }else{
                action.id=obj.id+'_'+action.name.replace(nonWord,'_');
            }

        }
    }
}
