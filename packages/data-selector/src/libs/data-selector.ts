import { explodeChains } from './utils'
import { selectorReader } from './text-reader'
import { SelectorChain } from './selector-chain'
import { PathChain } from "./path-chain";

export class DataSelector {

    private readonly branches: PathChain[]
    private data: any
    constructor(data: any) {
        this.data = data
        this.branches = []
        this.init()
    }

    private init() {
        this.branches.splice(0, this.branches.length, ...explodeChains(this.data))
    }

    update(data: any) {
        this.data = data
        this.init()
        return this
    }

    query<T = any>(selector: string) {
        const ss = selectorReader.split(selector, ',').map(it => SelectorChain.Parse(it.segment)).filter(s => !s.isInvalid())
        if (ss.length < 1) {
            return undefined
        }
        const chain = this.branches.find(it => ss.some(s => s.match(it, this.data)))
        return chain ? chain.resolveValue(this.data, true) as T : undefined
    }
    
    queryAll(selector: string) {
        const ss = selectorReader.split(selector, ',').map(it => SelectorChain.Parse(it.segment)).filter(s => !s.isInvalid())
        if (ss.length < 1) {
            return []
        }
        const branchesMatched = this.branches.filter(it => ss.some(s => s.match(it, this.data)))
        return branchesMatched.map(chain => chain.resolveValue(this.data, true))
    }
}