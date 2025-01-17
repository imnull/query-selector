import { TBranch, TPathItem, TPropChecker, TQueryPathItem } from './type'
import { PathChain } from './path-chain'

export const isRecord = (v: unknown): v is Record<string, unknown> => {
    return Object.prototype.toString.call(v) === '[object Object]'
}
export const isArray = (v: unknown): v is unknown[] => {
    return Array.isArray(v)
}

export const isPropChecker = (v: unknown): v is TPropChecker => {
    if (!v) {
        return false
    }
    const c = v as TPropChecker
    const keyType = typeof c.key
    const opType = typeof c.operator
    const valType = typeof c.value
    return (keyType === 'string' || keyType === 'number') && (opType === 'string') && (valType === 'string' || valType === 'number')
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



const findBranch = (branches: TBranch[], path: TPathItem[]) => {
    return branches.find(branch => {
        return branch.path.length === path.length && branch.path.every((v, i) => v === path[i])
    })
}

const NUM_OP = ['>', '>=', '<', '<=']
const STR_OP = ['^=', '*=', '$=']
const UNK_OP = ['=', '==', '===', '!=', '!==']
export const calResult = (op: string, left: unknown, right: unknown) => {
    if (NUM_OP.includes(op)) {
        const L = Number(left)
        const R = Number(right)
        if (isNaN(L) || isNaN(R)) {
            return false
        }
        switch (op) {
            case '>': return L > R
            case '>=': return L >= R
            case '<': return L < R
            case '<=':
            default: return L <= R
        }
    } else if (STR_OP.includes(op)) {
        const L = `${left}`
        const R = `${right}`
        switch (op) {
            case '^=': return L.substring(0, R.length) === R
            case '$=': return L.substring(L.length - R.length) === R
            case '*=':
            default: return L.indexOf(R) > -1
        }
    } else if (UNK_OP.includes(op)) {
        switch (op) {
            case '=':
            case '==': return left == right
            case '===': return left === right
            case '!=': return left != right
            case '!==':
            default: return left !== right
        }
    } else {
        console.log('unknown op:', op)
        return false
    }
}

const check = (key: TPathItem, checker: TPropChecker, value: unknown) => {
    const res = key === checker.key && calResult(checker.operator, value, checker.value)
    // console.log(8888, {key, value}, checker, res)
    return res
}

export const UINT_REG = /^(0|[1-9]\d*)$/

export const parseValue = (s: string) => {
    if (UINT_REG.test(s)) {
        return parseInt(s)
    }
    return s
}

export const isInvalid = (v: unknown) => {
    return typeof v === 'undefined' || v === null || v === '' || (typeof v === 'number' && isNaN(v))
}

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

export const explodeChains = (target: any) => {
    const chains: PathChain[] = []
    travese(target, (value, path) => {
        chains.push(new PathChain().parseArray(path))
    }, [])
    return chains
}

export const getJsonHashCode = (values: unknown[]) => {
    return values.map(v => `[${JSON.stringify(v)}]`).join('')
}