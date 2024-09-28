import { getFileExt } from "./fs";

const defaultContentType='application/octet-stream';

const extMappings={
    'aiff':'audio/aiff',
    'alac':'audio/alac',
    'mp4':'video/mp4',
    'mkv':'video/mkv',
    'mov':'video/quicktime',
    'avi':'video/x-msvideo',
    'aac':'audio/aac',
    'abw':'application/x-abiword',
    'arc':'application/x-freearc',
    'azw':'application/vnd.amazon.ebook',
    'bin':'application/octet-stream',
    'bmp':'image/bmp',
    'bz':'application/x-bzip',
    'bz2':'application/x-bzip2',
    'convo':'application/convo',
    'csh':'application/x-csh',
    'css':'text/css',
    'csv':'text/csv',
    'doc':'application/msword',
    'docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'eot':'application/vnd.ms-fontobject',
    'epub':'application/epub+zip',
    'gz':'application/gzip',
    'gif':'image/gif',
    'htm':'text/html',
    'html':'text/html',
    'ico':'image/vnd.microsoft.icon',
    'ics':'text/calendar',
    'jar':'application/java-archive',
    'jpeg':'image/jpeg',
    'jpg':'image/jpeg',
    'js':'text/javascript',
    'json':'application/json',
    'jsonld':'application/ld+json',
    'md':'text/markdown',
    'mid':'audio/midi audio/x-midi',
    'midi':'audio/midi audio/x-midi',
    'mjs':'text/javascript',
    'mp3':'audio/mpeg',
    'mpeg':'video/mpeg',
    'mpkg':'application/vnd.apple.installer+xml',
    'odp':'application/vnd.oasis.opendocument.presentation',
    'ods':'application/vnd.oasis.opendocument.spreadsheet',
    'odt':'application/vnd.oasis.opendocument.text',
    'oga':'audio/ogg',
    'ogv':'video/ogg',
    'ogx':'application/ogg',
    'opus':'audio/opus',
    'otf':'font/otf',
    'png':'image/png',
    'pdf':'application/pdf',
    'php':'application/php',
    'ppt':'application/vnd.ms-powerpoint',
    'pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'py':'application/python',
    'rar':'application/vnd.rar',
    'rtf':'application/rtf',
    'sh':'application/x-sh',
    'svg':'image/svg+xml',
    'swf':'application/x-shockwave-flash',
    'tar':'application/x-tar',
    'tif':'image/tiff',
    'tiff':'image/tiff',
    'ts':'video/mp2t',
    'ttf':'font/ttf',
    'txt':'text/plain',
    'vsd':'application/vnd.visio',
    'wav':'audio/wav',
    'weba':'audio/webm',
    'webm':'video/webm',
    'webp':'image/webp',
    'woff':'font/woff',
    'woff2':'font/woff2',
    'xhtml':'application/xhtml+xml',
    'xls':'application/vnd.ms-excel',
    'xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xml':'application/xml',
    'xul':'application/vnd.mozilla.xul+xml',
    'zip':'application/zip',
    '3gp':'video/3gpp',
    '3g2':'video/3gpp2',
    '7z':'application/x-7z-compressed',
}

export function getContentType(
    path:string|null|undefined,
    defaultType:string=defaultContentType):string
{
    if(!path){
        return defaultType;
    }
    const i=path.lastIndexOf('.');
    if(i!==-1){
        path=path.substring(i+1);
    }
    return (extMappings as any)[path.toLowerCase()]||defaultType
}

export const getContentTypeWithTextFallback=(path:string|null|undefined):string=>{
    return getContentType(path,'text/'+(getFileExt(path,false,true)||'plain'))
}
