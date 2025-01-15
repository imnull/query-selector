import { pathParse } from "./path"
import { selectorParse } from "./selector"
import { TBranch, TPathItem, TRelation, TSelector } from "./type"
import { findPathIndex } from './utils'

const getPathDistance = (path: TPathItem[], parent: TPathItem[], child: TPathItem[]) => {
    if(path.length < 2 || parent.length < 1 || child.length < 1) {
        return -1
    }
    const parentIdx = findPathIndex(path, parent)
    if(parentIdx < 0) {
        return -1
    }
    const childIdx = findPathIndex(path, child, parentIdx + parent.length)
    if(childIdx < 0) {
        return -1
    }
    if(childIdx + child.length !== path.length) {
        return -1
    }
    // console.log({ parentIdx, childIdx })
    return childIdx - (parentIdx + parent.length)
}

const isStarPath = (path: TPathItem[]) => {
    return path.length === 1 && path[0] === '*'
}

export const matchSelector = (path: TPathItem[], selector: TSelector, relation?: TRelation): boolean => {
    if(path.length < 1 || path.length < selector.path.length) {
        return false
    }
    if(isStarPath(selector.path) && (!relation || relation === 'ancestor')) {
        return path.length > 0
    }
    const idx = findPathIndex(path, selector.path)
    if(idx < 0) {
        return false
    }
    // 直接子节点查询
    else if(relation === 'direct' && idx > 0) {
        return false
    }
    if(!selector.next) {
        return idx + selector.path.length === path.length
    }
    const subMatch = matchSelector(path.slice(idx + selector.path.length), selector.next, selector.relation)
    return subMatch
}

export const query = <T = any>(branches: TBranch[], selector: string): T | undefined => {
    const s = selectorParse(selector)
    if(s.path.length < 1) {
        return undefined
    }
    const branchesMatched = branches.find(it => matchSelector(it.path, s))
    return branchesMatched ? branchesMatched.value as T : undefined
}

export const queryAll = (branches: TBranch[], selector: string): any[] => {
    const s = selectorParse(selector)
    if(s.path.length < 1) {
        return []
    }
    const branchesMatched = branches.filter(it => matchSelector(it.path, s, s.relation))
    return branchesMatched.map(it => it.value)
}