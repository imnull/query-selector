import { PathChain, PathChainPro } from "./path-chain"
import { selectorReader } from './text-reader'

const parseRelation = (ch: number | string) => {
    if(typeof ch === 'number') {
        switch(ch) {
            // >
            case 62: return 'direct'
        }
        return ''
    } else if(typeof ch === 'string') {
        switch(ch) {
            case '>': return 'direct'
        }
    }
    return ''
}

const parsePath = (path: PathChainPro | string) => {
    if(typeof path === 'string') {
        return PathChainPro.Parse(path)
    }
    return path
}

export class SelectorChain {

    static Parse(selector: string) {
        const segments = selectorReader.splitRegExp(selector, /\s*[\>]?\s*/)
        const root = new SelectorChain()
        let chain = root
        segments.forEach(seg => {
            chain = chain.append(seg.splitter, seg.segment)
        })
        return root
    }

    relation?: string
    path?: PathChainPro
    next?: SelectorChain

    constructor(relation?: string, path?: PathChainPro) {
        this.relation = relation
        this.path = path
    }

    isInvalid() {
        return !this.path || this.path.isInvalid()
    }
    append(relation: string | number, path: PathChainPro | string) {
        const p = parsePath(path)
        const r = parseRelation(relation)

        if(this.isInvalid()) {
            this.path = p
            this.relation = r
            return this
        } else {
            const next = new SelectorChain(r, p)
            this.next = next
            return next
        }
    }
    match(path: PathChain, rawData: unknown) {
        if(path.isInvalid() || !this.path || this.path.isInvalid()) {
            return false
        }
        const res = this.path.match(path, rawData)
        if(this.relation === 'direct') {
            return res.result && res.depth === 0
        }
        return res.result
    }
}