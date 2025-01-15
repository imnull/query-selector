import { TBranch, TPathItem } from "./type";
import { isArray, isRecord } from "./utils";

export const travese = (obj: unknown, callback: (v: unknown, p: TPathItem[]) => void, path: TPathItem[], trap: { value: unknown; path: TPathItem[] }[] = []) => {
    const circular = trap.find(it => it.value === obj)
    if(circular) {
        callback(circular.value, [...path])
        return
    }
    if (isArray(obj)) {
            const p = [...path]
            callback(obj, p)
            trap.push({ path: p, value: obj })
        obj.forEach((v, i) => {
            travese(v, callback, [...path, i], trap)
        })
    } else if (isRecord(obj)) {
            const p = [...path]
            callback(obj, p)
            trap.push({ path: p, value: obj })
        Object.keys(obj).forEach(key => {
            travese(obj[key], callback, [...path, key], trap)
        })
    } else {
        if(typeof obj !== 'undefined') {
            callback(obj, path)
        }
    }
}

export const explodeBranches = (target: any): TBranch[] => {
    const branches: TBranch[] = []
    travese(target, (value, path) => {
        branches.push({ value, path })
    }, [])
    return branches
}