import { TMatcher, TMatcherBase } from "./type"
import { genMatcher } from "./utils"

export class Chain<T> {
    parent?: Chain<T> | undefined = undefined
    readonly value: T
    readonly children: this[]
    constructor(value: T, parent?: Chain<T>) {
        this.children = []
        this.value = value
        this.parent = parent
    }
    protected create(value: T, parent: this): this {
        const C = this.constructor as any
        return new C(value, parent)
    }
    append(value: T) {
        const chain = this.create(value, this)
        this.children.push(chain)
        return chain
    }
}

export class MatchChain extends Chain<TMatcherBase | TMatcherBase[]> {

    static Create(ms: TMatcherBase[], resolver?: (s: string) => string, strick?: boolean) {
        if (ms.length < 1) {
            throw 'no match item'
        }
        const matches = [...ms]
        const root = new MatchChain(matches.shift()!)
        root.strict = !!strick
        root.resolver = resolver || (s => s)
        let m = root
        while (matches.length) {
            m = m.append(matches.shift()!)
            m.strict = !!strick
            m.resolver = resolver || (s => s)
        }
        return root
    }


    resolver?: (s: string) => string
    strict: boolean = false

    match(raw: string, start: number) {
        if (!this.value) {
            return -1
        }
        const matcher = genMatcher(this.value)
        const end = matcher.match(raw, start)
        // console.log(11133333, start, end, raw.substring(start))
        if (end > start) {
            if (this.children.length < 1) {
                return end
            } else {
                let idx = -1
                if (this.children.some(chain => {
                    idx = chain.match(raw, end + 1)
                    return idx > end
                })) {
                    return idx
                } else {
                    if(this.strict) {
                        return -1
                    } else {
                        return end
                    }
                }
            }
        } else {
            return -1
        }
    }
}