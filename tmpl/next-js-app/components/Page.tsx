export interface PageProps
{
    children?:any;
}

export function Page({
    children
}:PageProps){

    return (
        <div className="Page">
            {children}
        </div>
    )

}
