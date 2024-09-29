import { baseLayoutCn } from "@iyio/common";
import { createElement } from "react";
import { ViewProps } from "./View";

const cancelEventKeepDefault=(e:Partial<Event>)=>{
    try{e?.stopPropagation?.();}catch{/* */}
    try{e?.stopImmediatePropagation?.();}catch{/* */}
}
const cancelEventPreventDefault=(e:Partial<Event>)=>{
    try{e?.preventDefault?.();}catch{/* */}
    try{e?.stopPropagation?.();}catch{/* */}
    try{e?.stopImmediatePropagation?.();}catch{/* */}
}

export interface EventCaptureOptions
{
    preventDefault?:boolean;
    captureCaptureEvents?:boolean;
}

export const getEventCaptureProps=({
    preventDefault,
    captureCaptureEvents
}:EventCaptureContainerProps={})=>{
    const cancelEvent=preventDefault?cancelEventPreventDefault:cancelEventKeepDefault;
    const cancelEventCapture=captureCaptureEvents?cancelEvent:undefined;

    return {
        onCopy:cancelEvent,
        onCopyCapture:cancelEventCapture,
        onCut:cancelEvent,
        onCutCapture:cancelEventCapture,
        onPaste:cancelEvent,
        onPasteCapture:cancelEventCapture,
        onCompositionEnd:cancelEvent,
        onCompositionEndCapture:cancelEventCapture,
        onCompositionStart:cancelEvent,
        onCompositionStartCapture:cancelEventCapture,
        onCompositionUpdate:cancelEvent,
        onCompositionUpdateCapture:cancelEventCapture,
        onFocus:cancelEvent,
        onFocusCapture:cancelEventCapture,
        onBlur:cancelEvent,
        onBlurCapture:cancelEventCapture,
        onChange:cancelEvent,
        onChangeCapture:cancelEventCapture,
        onBeforeInput:cancelEvent,
        onBeforeInputCapture:cancelEventCapture,
        onInput:cancelEvent,
        onInputCapture:cancelEventCapture,
        onReset:cancelEvent,
        onResetCapture:cancelEventCapture,
        onSubmit:cancelEvent,
        onSubmitCapture:cancelEventCapture,
        onInvalid:cancelEvent,
        onInvalidCapture:cancelEventCapture,
        onLoad:cancelEvent,
        onLoadCapture:cancelEventCapture,
        onError:cancelEvent,
        onErrorCapture:cancelEventCapture,
        onKeyDown:cancelEvent,
        onKeyDownCapture:cancelEventCapture,
        onKeyPress:cancelEvent,
        onKeyPressCapture:cancelEventCapture,
        onKeyUp:cancelEvent,
        onKeyUpCapture:cancelEventCapture,
        onAbort:cancelEvent,
        onAbortCapture:cancelEventCapture,
        onCanPlay:cancelEvent,
        onCanPlayCapture:cancelEventCapture,
        onCanPlayThrough:cancelEvent,
        onCanPlayThroughCapture:cancelEventCapture,
        onDurationChange:cancelEvent,
        onDurationChangeCapture:cancelEventCapture,
        onEmptied:cancelEvent,
        onEmptiedCapture:cancelEventCapture,
        onEncrypted:cancelEvent,
        onEncryptedCapture:cancelEventCapture,
        onEnded:cancelEvent,
        onEndedCapture:cancelEventCapture,
        onLoadedData:cancelEvent,
        onLoadedDataCapture:cancelEventCapture,
        onLoadedMetadata:cancelEvent,
        onLoadedMetadataCapture:cancelEventCapture,
        onLoadStart:cancelEvent,
        onLoadStartCapture:cancelEventCapture,
        onPause:cancelEvent,
        onPauseCapture:cancelEventCapture,
        onPlay:cancelEvent,
        onPlayCapture:cancelEventCapture,
        onPlaying:cancelEvent,
        onPlayingCapture:cancelEventCapture,
        onProgress:cancelEvent,
        onProgressCapture:cancelEventCapture,
        onRateChange:cancelEvent,
        onRateChangeCapture:cancelEventCapture,
        onResize:cancelEvent,
        onResizeCapture:cancelEventCapture,
        onSeeked:cancelEvent,
        onSeekedCapture:cancelEventCapture,
        onSeeking:cancelEvent,
        onSeekingCapture:cancelEventCapture,
        onStalled:cancelEvent,
        onStalledCapture:cancelEventCapture,
        onSuspend:cancelEvent,
        onSuspendCapture:cancelEventCapture,
        onTimeUpdate:cancelEvent,
        onTimeUpdateCapture:cancelEventCapture,
        onVolumeChange:cancelEvent,
        onVolumeChangeCapture:cancelEventCapture,
        onWaiting:cancelEvent,
        onWaitingCapture:cancelEventCapture,
        onAuxClick:cancelEvent,
        onAuxClickCapture:cancelEventCapture,
        onClick:cancelEvent,
        onClickCapture:cancelEventCapture,
        onContextMenu:cancelEvent,
        onContextMenuCapture:cancelEventCapture,
        onDoubleClick:cancelEvent,
        onDoubleClickCapture:cancelEventCapture,
        onDrag:cancelEvent,
        onDragCapture:cancelEventCapture,
        onDragEnd:cancelEvent,
        onDragEndCapture:cancelEventCapture,
        onDragEnter:cancelEvent,
        onDragEnterCapture:cancelEventCapture,
        onDragExit:cancelEvent,
        onDragExitCapture:cancelEventCapture,
        onDragLeave:cancelEvent,
        onDragLeaveCapture:cancelEventCapture,
        onDragOver:cancelEvent,
        onDragOverCapture:cancelEventCapture,
        onDragStart:cancelEvent,
        onDragStartCapture:cancelEventCapture,
        onDrop:cancelEvent,
        onDropCapture:cancelEventCapture,
        onMouseDown:cancelEvent,
        onMouseDownCapture:cancelEventCapture,
        onMouseEnter:cancelEvent,
        onMouseLeave:cancelEvent,
        onMouseMove:cancelEvent,
        onMouseMoveCapture:cancelEventCapture,
        onMouseOut:cancelEvent,
        onMouseOutCapture:cancelEventCapture,
        onMouseOver:cancelEvent,
        onMouseOverCapture:cancelEventCapture,
        onMouseUp:cancelEvent,
        onMouseUpCapture:cancelEventCapture,
        onSelect:cancelEvent,
        onSelectCapture:cancelEventCapture,
        onTouchCancel:cancelEvent,
        onTouchCancelCapture:cancelEventCapture,
        onTouchEnd:cancelEvent,
        onTouchEndCapture:cancelEventCapture,
        onTouchMove:cancelEvent,
        onTouchMoveCapture:cancelEventCapture,
        onTouchStart:cancelEvent,
        onTouchStartCapture:cancelEventCapture,
        onPointerDown:cancelEvent,
        onPointerDownCapture:cancelEventCapture,
        onPointerMove:cancelEvent,
        onPointerMoveCapture:cancelEventCapture,
        onPointerUp:cancelEvent,
        onPointerUpCapture:cancelEventCapture,
        onPointerCancel:cancelEvent,
        onPointerCancelCapture:cancelEventCapture,
        onPointerEnter:cancelEvent,
        onPointerLeave:cancelEvent,
        onPointerOver:cancelEvent,
        onPointerOverCapture:cancelEventCapture,
        onPointerOut:cancelEvent,
        onPointerOutCapture:cancelEventCapture,
        onGotPointerCapture:cancelEventCapture,
        onGotPointerCaptureCapture:cancelEventCapture,
        onLostPointerCapture:cancelEventCapture,
        onLostPointerCaptureCapture:cancelEventCapture,
        onScroll:cancelEvent,
        onScrollCapture:cancelEventCapture,
        onWheel:cancelEvent,
        onWheelCapture:cancelEventCapture,
        onAnimationStart:cancelEvent,
        onAnimationStartCapture:cancelEventCapture,
        onAnimationEnd:cancelEvent,
        onAnimationEndCapture:cancelEventCapture,
        onAnimationIteration:cancelEvent,
        onAnimationIterationCapture:cancelEventCapture,
        onTransitionEnd:cancelEvent,
        onTransitionEndCapture:cancelEventCapture,
    }
}

export interface EventCaptureContainerProps extends EventCaptureOptions
{
    elem?:string;
}

/**
 * @acIgnore
 */
export function EventCaptureContainer({
    children,
    elem='div',
    elemRef,
    style,
    roleNone,
    role=roleNone?'none':undefined,
    id,
    preventDefault,
    captureCaptureEvents,
    ...props
}:EventCaptureContainerProps & ViewProps){

    const cProps:any=getEventCaptureProps({preventDefault,captureCaptureEvents});

    cProps.ref=elemRef;
    cProps.role=role;
    cProps.style=style;
    cProps.id=id;
    cProps.className=baseLayoutCn(props);

    return createElement(elem,cProps,children);

}
