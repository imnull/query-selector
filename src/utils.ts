import { TBranch, TSelector, TPathItem } from './type'

export const isRecord = (v: unknown): v is Record<string, unknown> => {
    return Object.prototype.toString.call(v) === '[object Object]'
}
export const isArray = (v: unknown): v is unknown[] => {
    return Array.isArray(v)
}

export const isNested = (s: string) => {
    return s.length > 2 && s[0] === '[' && s[s.length - 1] === ']'
}
export const isQuoted = (s: string) => {
    return s.length >= 2 && (s[0] === '"' && s[s.length - 1] === '"' || s[0] === "'" && s[s.length - 1] === "'")
}

export const unNested = (s: string) => {
    return s.substring(1, s.length - 1)
}

const compareItems = (template: TPathItem, value: TPathItem) => {
    return template === '*' || template === value
}

export const findPathIndex = (target: TPathItem[], b: TPathItem[], aIndex: number = 0) => {
    const a = target.slice(aIndex)
    if(a.length < 1 || b.length < 1 || a.length < b.length) {
        return -1
    }
    for(let i = 0; i <= a.length - b.length; i++) {
        if(b.every((it, idx) => compareItems(it, a[i + idx]))) {
            return aIndex + i
        }
    }
    return -1
}
