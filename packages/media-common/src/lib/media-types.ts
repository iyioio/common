
export interface VideoSnapShotOptions
{
    source:CanvasImageSource;
    type?:string;
    width?:number;
    height?:number;
    viewBoxWidth?:number;
    viewBoxHeight?:number;
    flipHorizontal?:boolean;
    flipVertical?:boolean;
    includeStats?:boolean|GetImageDataStatsOptions;
}

export interface SnapShotResult
{
    dataUri?:string;
    stats?:ImageStats;
}

export interface ImageStats
{
    maxBrightness:number;
    minBrightness:number;
    averageBrightness:number;
}

export interface GetImageDataStatsOptions
{
    trueAverage?:boolean;
}
