import { TPathItem } from "./type"
import { isNested, isQuoted, unNested } from "./utils"

export const pathStringify = (path: TPathItem[]) => {
    const segs = path.map(it => {
        if(typeof it === 'number') {
            return `[${it}]`
        }
        return `.${it}`
    }).join('')
    return segs.substring(1)
}

const PATH_REG = /(^[a-z_$][a-z0-9_\$]*|^\*|\.[a-z_$][a-z0-9_\$]*|\.\*|\[(\d+|"[^"]*"|'[^']*')\])/g
export const pathParse = (selector: string): TPathItem[] => {
    const m = selector.match(PATH_REG)
    if(!m) {
        return []
    }
    return m.map((it, idx) => {
        if(isNested(it)) {
            let key = unNested(it)
            if(isQuoted(key)) {
                return unNested(key)
            } else {
                return parseInt(key)
            }
        } else {
            if(it[0] === '.') {
                return it.substring(1)
            }
            return it
        }
    })
}