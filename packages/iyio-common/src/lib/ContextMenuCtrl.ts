import { BehaviorSubject } from "rxjs";
import { Point } from "./common-types.js";
import { getElementOrDescendantByClassName, isDomNodeDescendantOf } from "./dom.js";
import { ReadonlySubject } from "./rxjs-types.js";

export type ContextMenuRenderer=(clientX:number,clientY:number,ctrl:ContextMenuCtrl)=>void;

export class ContextMenuCtrl
{

    private readonly _elem:BehaviorSubject<HTMLElement|null>=new BehaviorSubject<HTMLElement|null>(null);
    public get elemSubject():ReadonlySubject<HTMLElement|null>{return this._elem}
    public get elem(){return this._elem.value}
    public set elem(value:HTMLElement|null){
        if(value==this._elem.value){
            return;
        }
        this.updateElem(value,this._elem.value);
        this._elem.next(value);
    }

    private readonly _menuElem:BehaviorSubject<HTMLElement|null>=new BehaviorSubject<HTMLElement|null>(null);
    public get menuElemSubject():ReadonlySubject<HTMLElement|null>{return this._menuElem}
    public get menuElem(){return this._menuElem.value}
    public set menuElem(value:HTMLElement|null){
        if(value==this._menuElem.value){
            return;
        }
        this._menuElem.next(value);
    }

    private readonly _disabled:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get disabledSubject():ReadonlySubject<boolean>{return this._disabled}
    public get disabled(){return this._disabled.value}
    public set disabled(value:boolean){
        if(value==this._disabled.value){
            return;
        }
        this.setOpen(false,null);
        this._disabled.next(value);
    }

    private readonly _targetElem:BehaviorSubject<Element|null>=new BehaviorSubject<Element|null>(null);
    public get targetElemSubject():ReadonlySubject<Element|null>{return this._targetElem}
    public get targetElem(){return this._targetElem.value}

    private readonly _position:BehaviorSubject<Point|null>=new BehaviorSubject<Point|null>(null);
    public get positionSubject():ReadonlySubject<Point|null>{return this._position}
    public get position(){return this._position.value}
    public set position(value:Point|null){
        if(value==this._position.value){
            return;
        }
        this._position.next(value);
    }

    private readonly _open:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get openSubject():ReadonlySubject<boolean>{return this._open}
    public get open(){return this._open.value}

    private readonly _targetClassName:BehaviorSubject<string|null>=new BehaviorSubject<string|null>(null);
    public get targetClassNameSubject():ReadonlySubject<string|null>{return this._targetClassName}
    /**
     * If not null items click on must have the specified class name or a parent of the element must
     * have the specified class name
     */
    public get targetClassName(){return this._targetClassName.value}
    public set targetClassName(value:string|null){
        if(value==this._targetClassName.value){
            return;
        }
        this._targetClassName.next(value);
    }

    public renderer:ContextMenuRenderer|null=null;


    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.setOpenListeners(false);
        this.elem=null;
    }

    private setOpenListeners(open:boolean){
        if(open && !this.isDisposed){
            globalThis.window?.addEventListener('blur',this.onWindowBlur);
            globalThis.window?.addEventListener('mousedown',this.onWindowMouseDown);
            globalThis.window?.addEventListener('keydown',this.onWindowKeyPress);
        }else{
            globalThis.window?.removeEventListener('blur',this.onWindowBlur);
            globalThis.window?.removeEventListener('mousedown',this.onWindowMouseDown);
            globalThis.window?.removeEventListener('keydown',this.onWindowKeyPress);
        }
    }

    private updateElem(elem:HTMLElement|null,prev:HTMLElement|null){

        if(prev){
            prev.removeEventListener('contextmenu',this.onContextMenu);
        }

        if(this.isDisposed){
            return;
        }

        if(elem){
            elem.addEventListener('contextmenu',this.onContextMenu);
        }
    }

    private setOpen(value:boolean,target:Element|null){
        this._targetElem.next(target);

        if(value==this._open.value || this.disabled || this.isDisposed){
            return;
        }

        this.setOpenListeners(value);

        this._open.next(value);
    }

    public close(){
        this.setOpen(false,null);
    }

    private readonly onContextMenu=(e:MouseEvent)=>{

        const target=this.getTarget(e.target);

        if(!target){
            return;
        }

        e.preventDefault();
        if(this.disabled){
            return;
        }

        this.position={x:e.clientX,y:e.clientY}
        this._targetElem.next(target);
        this.setOpen(true,target);
    }

    private readonly onWindowBlur=()=>{
        this.setOpen(false,null);
    }

    private readonly onWindowMouseDown=(e:MouseEvent)=>{
        if(this.menuElem && (e.target instanceof Node) && !isDomNodeDescendantOf(e.target,this.menuElem,true)){
            this.setOpen(false,null);
        }
    }

    private readonly onWindowKeyPress=(e:KeyboardEvent)=>{
        if(e.key==='Escape'){
            this.setOpen(false,null);
        }
    }

    private getTarget(target:EventTarget|null):Element|null{
        const c=this.targetClassName;
        if(!c){
            return this.elem;
        }
        return ((target instanceof Node) && getElementOrDescendantByClassName(target,c))||this.elem;
    }

}
