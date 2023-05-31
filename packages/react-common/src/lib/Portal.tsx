import { PortalProps, usePortal } from "./portal-lib";


export function Portal(props:PortalProps){

    usePortal(props);

    if(props.renderInline){
        return props.children;
    }

    return null;

}
