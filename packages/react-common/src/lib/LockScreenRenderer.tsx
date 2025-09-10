import { UiLockContainer, uiLockContainerService } from "@iyio/common";
import { LockScreenView } from "./LockScreenView.js";
import { useSubject } from "./rxjs-hooks.js";

interface LockScreenRendererProps
{
    container?:UiLockContainer
}

/**
 * @acIgnore
 */
export function LockScreenRenderer({
    container=uiLockContainerService()
}:LockScreenRendererProps){

    const locks=useSubject(container.locksSubject);

    return (
        <>
            {locks.map(l=>(
                <LockScreenView key={l.id} lock={l} active />
            ))}
        </>
    )

}
