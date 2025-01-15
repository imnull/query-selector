import { findPathIndex } from "./src/utils"
import { pathParse, pathStringify } from "./src/path"
import { explodeBranches, travese } from "./src/travese"
import { matchSelector, query, queryAll } from './src/query'
import { selectorParse } from './src/selector'
import { DataSelector } from './src/index'

// console.log(pathParse('.arr[3].abc["123 xyz"]'))

// console.log('findPathIndex', findPathIndex(['a', 'b', 'c', 'd'], ['c', 'd']))
// console.log('findPathIndex', findPathIndex(['a', 'b', 'c', 'd'], ['z', 'd']))

const tar: any = {
    arr: [1, 2, 3, { abc: 1 }],
    obj: { a: 1, b: 2, c: 3, z: { arr: [8, 9] } },
    str: 'string',
    number: 7
}

// travese(tar, (v, p) => {
//     console.log(v, p)
// }, [])

// const branches = explodeBranches(tar)

// console.log('branches', branches)

// console.log('query "obj.*.arr"', query(branches, 'obj.*.arr'))
// console.log('queryAll "obj.*.arr"', queryAll(branches, 'obj.*.arr'))
// console.log('queryAll "obj arr"', queryAll(branches, 'obj arr'))
// console.log('queryAll "obj > arr"', queryAll(branches, 'obj > arr'))
// console.log('queryAll "obj  arr"', queryAll(branches, 'obj  arr'))
// console.log('queryAll "obj > *"', queryAll(branches, 'obj > *'))
// console.log('queryAll "obj *"', queryAll(branches, 'obj *'))
// console.log('queryAll "arr"', queryAll(branches, 'arr'))
// console.log('queryAll "> arr"', queryAll(branches, '> arr'))


// console.log('selectorParse', selectorParse('obj arr.*'))
// console.log('selectorParse', selectorParse('obj>arr.*'))
// console.log('selectorParse', selectorParse('obj arr  *'))

const ds = new DataSelector(tar)

console.log('query "obj.*.arr"', ds.query('obj.*.arr'))
console.log('queryAll "obj.*.arr"', ds.queryAll('obj.*.arr'))
console.log('queryAll "obj arr"', ds.queryAll('obj arr'))
console.log('queryAll "obj > arr"', ds.queryAll('obj > arr'))
console.log('queryAll "obj  arr"', ds.queryAll('obj  arr'))
console.log('queryAll "obj > *"', ds.queryAll('obj > *'))
console.log('queryAll "obj *"', ds.queryAll('obj *'))
console.log('queryAll "arr"', ds.queryAll('arr'))
console.log('queryAll "> arr"', ds.queryAll('> arr'))