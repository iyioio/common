import { ID_Continue, ID_Start, Space_Separator } from "./unicode.js"

export const isSpaceSeparator = (c:any)=> {
    return typeof c === 'string' && Space_Separator.test(c)
}

export const isIdStartChar = (c:any)=> {
    return typeof c === 'string' && (
        (c >= 'a' && c <= 'z') ||
    (c >= 'A' && c <= 'Z') ||
    (c === '$') || (c === '_') ||
    ID_Start.test(c)
    )
}

export const isIdContinueChar = (c:any)=> {
    return typeof c === 'string' && (
        (c >= 'a' && c <= 'z') ||
    (c >= 'A' && c <= 'Z') ||
    (c >= '0' && c <= '9') ||
    (c === '$') || (c === '_') ||
    (c === '\u200C') || (c === '\u200D') ||
    ID_Continue.test(c)
    )
}

export const isDigit = (c:any)=> {
    return typeof c === 'string' && /[0-9]/.test(c)
}

export const isHexDigit = (c:any)=> {
    return typeof c === 'string' && /[0-9A-Fa-f]/.test(c)
}
