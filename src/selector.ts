import { pathParse } from "./path"
import { TSelector } from "./type"

const PATH_REG = /\s*([\|\>\,]?)\s*(\[(\d+|"[^"]*"|'[^']*')\]|[^\s\|\>\,]+)/g

export const selectorParse = (selector: string) => {
    let root: TSelector = { path: [] }, s = root
    selector.replace(PATH_REG, (_m, relation, pathStr) => {
        const path = pathParse(pathStr)
        if(relation === '>') {
            s.relation = 'direct'
        }
        if(s.path.length < 1) {
            s.path = path
        } else {
            const next: TSelector = { path }
            s.next = next
            s = next
        }
        return ''
    })
    return root
}