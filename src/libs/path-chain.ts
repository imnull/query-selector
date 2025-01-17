import { TPathItem } from "./type"
import { isInvalid, isNested, isQuoted, parseValue, UINT_REG, unNested, getJsonHashCode } from "./utils"
import { PropChecker } from './prop-checker'

const PATH_REG = /(^[a-z_$][a-z0-9_\$]*|^\*|\.[a-z_$][a-z0-9_\$]*|\.\*|\[\s*(\d+|\*|\@|[a-zA-Z_$][0-9a-zA-Z_$]*|"[^"]*"|'[^']*')\s*(([\!\^\$\*]?\=|[\<\>]\=?|\={1,3})\s*(\d+|"[^"]*"|'[^']*'|[^\s]*))?\s*\])/g
const PROPEXP_REG = /(\d+|\*|\@|[a-zA-Z_$][0-9a-zA-Z_$]*|"[^"]*"|'[^']*')\s*([\!\^\$\*]?\=|[\<\>]\=?|\={1,3})\s*(\d+|"[^"]*"|'[^']*'|[^\s]*)/

export class Chain<T = unknown> {

    static Equal(source?: Chain, target?: Chain) {
        let a = source, b = target
        while (a && b) {
            if (!a.isInvalid() && !b.isInvalid() && (a.checkValue(b.value) || b.checkValue(a.value))) {
                a = a.next
                b = b.next
            } else {
                return false
            }
        }
        return !a && !b
    }

    static Compare(source?: Chain, target?: Chain) {
        let depth = 0, s = source, result = false
        while (s) {
            result = Chain.Equal(s, target)
            if (result) {
                break
            }
            s = s.next
            depth += 1
        }
        return { depth, result }
    }

    value?: T
    next?: Chain<T>
    previous?: Chain<T>
    constructor(value?: T) {
        this.value = value
    }
    isInvalid() {
        return typeof this.value === 'undefined'
            || this.value === null
            || (typeof this.value === 'string' && this.value.length === 0)
            || (typeof this.value === 'number' && isNaN(this.value))
    }

    checkValue(value: T) {
        if (this.isInvalid()) {
            return true
        }
        return this.value === value
    }

    compare(target: this) {
        return Chain.Compare(this, target)
    }

    create(value?: T): this {
        const C = this.constructor as any
        const chain = new C(value)
        return chain
    }

    append(value: T) {
        if (this.isInvalid()) {
            this.value = value
            return this
        } else {
            const next = this.create(value)
            this.next = next
            next.previous = this
            return next
        }
    }

    clone() {
        const chain = this.create(this.value)
        if (this.next) {
            chain.next = this.next.clone()
        }
        return chain
    }

    isFirst() {
        return !this.previous
    }
    isLast() {
        return !this.next
    }

    parseArray(arr: Iterable<T>) {
        let c = this
        for (let v of arr) {
            c = c.append(v)
        }
        return this
    }

    getDownValues() {
        let s: Chain<T> | undefined = this
        const arr: T[] = []
        while (s) {
            if (!s.isInvalid()) {
                arr.push(s.value!)
            }
            s = s.next
        }
        return arr
    }
    getUpValues() {
        let s: Chain<T> | undefined = this
        const arr: T[] = []
        while (s) {
            if (!s.isInvalid()) {
                arr.unshift(s.value!)
            }
            s = s.previous
        }
        return arr
    }

    getHashCode() {
        return getJsonHashCode(this.getDownValues())
    }

    getUpHash() {
        return getJsonHashCode(this.getUpValues())
    }
}

export class PathChain extends Chain<TPathItem> {

    static IsNil(v: unknown): v is undefined | null {
        return typeof v === 'undefined' || v === null
    }

    override next?: PathChain;
    override previous?: PathChain

    override checkValue(item: TPathItem) {
        return this.value === '*' || super.checkValue(item)
    }

    resolveValue(raw: unknown, down: boolean = false) {
        const path = !down ? this.getUpValues() : this.getDownValues()
        let v = raw as any
        while(path.length > 0 && !PathChain.IsNil(v)) {
            v = v[path.shift()!]
        }
        return v
    }
}

export class PathChainPro extends PathChain {

    static InvokeChecker = (b: PathChainPro, t: PathChain, rawData: unknown) => {
        if (b.checker) {
            const value = t.resolveValue(rawData)
            return b.checker.check(value)
        } else {
            return true
        }
    }

    static EqualPro(template: PathChainPro, target: PathChain, rawData: unknown) {
        let a: PathChain | undefined = target, b: PathChainPro | undefined = template
        while (a && b) {
            if (!a.isInvalid() && !b.isInvalid() && b.checkValue(a.value!) && PathChainPro.InvokeChecker(b, a, rawData)) {
                a = a.next
                b = b.next
            } else {
                return false
            }
        }
        return !a && !b
    }

    static ComparePro(template: PathChainPro, source: PathChain, rawData: unknown) {
        let depth = 0, s: PathChain | undefined = source, result = false
        while (s) {
            result = PathChainPro.EqualPro(template, s, rawData)
            if (result) {
                break
            }
            s = s.next
            depth += 1
        }
        return { depth, result }
    }

    override next?: PathChainPro;
    override previous?: PathChainPro;

    checker?: PropChecker

    static Parse(selector: string) {
        const root = new PathChainPro()
        const m = selector.match(PATH_REG)
        if (!m) {
            return root
        }
        let chain = root
        m.forEach(it => {
            if (isNested(it)) {
                let key = unNested(it)
                if (isQuoted(key)) {
                    chain = chain.append(unNested(key))
                } else {
                    if (UINT_REG.test(key)) {
                        chain = chain.append(parseInt(key))
                    } else {
                        const m = key.match(PROPEXP_REG)
                        if (m && !isInvalid(m[1]) && !isInvalid(m[2])) {
                            chain.checker = PathChainPro.Checker(parseValue(m[1]), m[2], parseValue(m[3]))
                        } else {
                            chain = chain.append(key)
                        }
                    }
                }
            } else {
                if (it.charAt(0) === '.') {
                    chain = chain.append(it.substring(1))
                } else {
                    chain = chain.append(it)
                }
            }
        })
        return root
    }

    static Checker(key?: string | number, op?: string, value?: unknown) {
        return new PropChecker(key, op, value)
    }

    match(target: PathChain, rawData: unknown) {
        return PathChainPro.ComparePro(this, target, rawData)
    }
}