export interface MarkdownImage
{
    url:string;
    description?:string;
}

export interface MarkdownImageParsingItem
{
    text?:string;
    image?:MarkdownImage;
}
