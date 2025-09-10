import { BehaviorSubject } from "rxjs";
import { Size } from "./common-types.js";
import { ReadonlySubject } from "./rxjs-types.js";

export class ElementSizeObserver
{

    private readonly resizeObserver:ResizeObserver|null;
    private sizeObserved=false;

    public readonly target:Element;

    private readonly _size:BehaviorSubject<Size>;
    public get sizeSubject():ReadonlySubject<Size>{return this._size}
    public get size(){return this._size.value}
    public set size(value:Size){
        if(value==this._size.value){
            return;
        }
        this._size.next(value);
    }

    public constructor(target:Element)
    {
        this.target=target;
        this._size=new BehaviorSubject<Size>({width:target.clientWidth,height:target.clientHeight});

        if(globalThis.ResizeObserver){
            this.resizeObserver=new ResizeObserver(()=>{
                if(!this.sizeObserved){
                    this.sizeObserved=true;
                    if(globalThis.window){
                        globalThis.window.removeEventListener('resize',this.onSizeChanged);
                    }
                }
                this.onSizeChanged();
            })
            this.resizeObserver.observe(target);
        }else{
            this.resizeObserver=null;
        }

        if(globalThis.window){
            globalThis.window.addEventListener('resize',this.onSizeChanged);
        }
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;

        this.resizeObserver?.unobserve(this.target);
        this.resizeObserver?.disconnect();

        if(globalThis.window){
            globalThis.window.removeEventListener('resize',this.onSizeChanged);
        }
    }

    private readonly onSizeChanged=()=>{

        if( this.target.clientWidth===this._size.value.width &&
            this.target.clientHeight===this._size.value.height)
        {
            return;
        }

        this._size.next({width:this.target.clientWidth,height:this.target.clientHeight});
    }
}
