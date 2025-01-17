import { TPathItem } from "./type"
import { calResult } from './utils'

const getProp = (value: unknown, key: TPathItem) => {
    if(key === '@') {
        return value
    }
    if(typeof value === 'undefined' || value === null) {
        return undefined
    }
    return (value as any)[key]
}

export class PropChecker {
    key?: TPathItem
    operator?: string
    value?: unknown
    with?: string;
    next?: PropChecker
    constructor(key?: string | number, op?: string, value?: unknown) {
        this.key = key
        this.operator = op
        this.value = value
    }
    isInvalid() {
        return typeof this.key === 'undefined' || this.key === '' || this.key === null || !this.operator
    }
    check(value: unknown) {
        if(this.isInvalid()) {
            return true
        }
        const val = getProp(value, this.key!)
        return calResult(this.operator!, val, this.value)
    }
}