import { VfsItem } from '@iyio/vfs';

export const getPdfSource=(source:string|File|VfsItem|null|undefined):File|string|undefined=>{
    if(!(typeof source === 'string') && !(source instanceof File)){
        source=source?.url;
    }
    return source;
}
