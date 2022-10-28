
export type TypeRef<T=any>=Readonly<{
    refId:symbol;
    _?:T;
}>;

export const isTypeRef=(value:any): value is TypeRef=>(
    typeof (value as Partial<TypeRef>)?.refId === 'symbol'
);

export const getTypeRefId=(idOrRef:TypeRef|symbol):symbol=>(
    typeof idOrRef === 'symbol'?idOrRef:idOrRef.refId
);

export const createTypeRef=<T>(name:string):TypeRef<T>=>Object.freeze({refId:Symbol(name)});
