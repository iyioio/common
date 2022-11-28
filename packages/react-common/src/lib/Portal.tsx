import { PortalProps, usePortal } from "./portal-lib";


export function Portal(props:PortalProps){

    usePortal(props);

    return null;

}
