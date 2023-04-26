import { UiLockContainer, uiLockContainerService } from "@iyio/common";
import { LockScreenView } from "./LockScreenView";
import { useSubject } from "./rxjs-hooks";

interface LockScreenRendererProps
{
    container?:UiLockContainer
}

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
