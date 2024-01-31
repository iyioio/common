export interface GoogleTagManagerConfig
{
    /**
     * If true localhost and 127.* will be not be disabled.
     */
    enableLocalhost?:boolean;
    /**
     * Override the domain name used to match the current measurement
     * @default location.hostname
     */
    domain?:string;
    measurements:GoogleTagManagerMeasurementConfig[];
}


export interface GoogleTagManagerMeasurementConfig
{
    id:string;
    domain?:string;
}
