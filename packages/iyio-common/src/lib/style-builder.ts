import { BehaviorSubject } from "rxjs";
import { HashMap } from "./common-types";
import { ReadonlySubject } from "./rxjs-types";


interface InternalStyleSheetContainer
{
     _sheets:BehaviorSubject<HashMap<StyleSheetCtrl>>;
}

export class StyleSheetContainer
{
    private readonly _sheets:BehaviorSubject<HashMap<StyleSheetCtrl>>=new BehaviorSubject<HashMap<StyleSheetCtrl>>({});
    public get sheetsSubject():ReadonlySubject<HashMap<StyleSheetCtrl>>{return this._sheets}
    public get sheets(){return this._sheets.value}

    /**
     * If true sheets will be rendered when they are created instead of waiting until they are used.
     */
    public renderOnCreate=false;
}

export const defaultStyleSheetContainer=new StyleSheetContainer();


export class StyleSheetCtrl
{

    private readonly _className:string;
    public get className(){
        if(!this._hasRendered){
            this.render();
        }
        return this._className;
    }

    public readonly css:string;

    public readonly container:StyleSheetContainer;

    public constructor(name:string,idSuffix:string,css:string,container=defaultStyleSheetContainer)
    {
        this._className=name+'-'+idSuffix;
        this.css=css;
        this.container=container;

        if(container.renderOnCreate){
            this.render();
        }
    }

    private _hasRendered=false;
    public render()
    {
        this._hasRendered=true;
        const sheets={...this.container.sheets,[this._className]:this};
        (this.container as any as InternalStyleSheetContainer)._sheets.next(sheets);
    }
}
