export interface DomKeyEvt
{
    key:string;
    /**
     * They plus modifiers. The modifiers will include, ctrl, alt and shift if pressed.
     * the value will have the following format and modifiers are always in the same order.
     * The command or meta key results in the ctrl mod being added.
     * Format examples:
     *   - ctrl+alt+shift+{key - lowercase}
     *   - ctrl+shift+{key - lowercase}
     *   - ctrl+alt+{key - lowercase}
     *   - ctrl+{key - lowercase}
     *   - alt+shift+{key - lowercase}
     *   - alt+{key - lowercase}
     *   - shift+{key - lowercase}
     *   - {key - lowercase}
     */
    keyMod:string;
    keyLowercase:string;
    keyUppercase:string;
    cancel:boolean;
    preventDefault():void;
}

export type DomKeyListener=(evt:DomKeyEvt)=>void;
