export const allTsPrimitiveTypes=[
    'string',
    'number',
    'boolean',
    'null',
    'undefined'
] as const

export type TsPrimitiveType=typeof allTsPrimitiveTypes[number];
