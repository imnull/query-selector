import { DataSelector } from './src/index'
import { selectorReader } from './src/libs/text-reader'


const tar: any = {
    arr: [1, 2, 3, { abc: 1 }],
    arr2: [7, 8, 0, 1, 5],
    obj: { a: 1, b: 2, c: 13, z: { arr: [18, 19] } },
    str: 'string',
    str2: 'number',
    number: 7
}

// console.log(PathChainPro.Parse('obj[a<=1]'))
// console.log(PathChain.Parse('obj[a >= 1]'))
// console.log(PathChain.Parse('arr[0 < 10]'))

// console.log(SelectorChain.Parse('obj[a<=1]'))
// console.log(SelectorChain.Parse('obj[a >= 1]'))
// console.log(SelectorChain.Parse('> arr[0 < 10] > arr'))

const ds = new DataSelector(tar)

const queryList = [
    // '> *[length > 0]',
    '> *[length > 3]',
    '> *.*[@>1]',
    '> *.*[@>=3]',
    '*[@>=3]',
    'obj[a<=1]',
    'obj[b<1]',
    '*[@^=str]',
    '*[@$=ber]',
    '*[@*=n]',
]
// queryList.forEach(query => {
//     console.log('-'.repeat(8) + ' ' + query + ' ' + '-'.repeat(8))
//     console.log(`    query:`, ds.query(query))
//     console.log(`query-all:`, ds.queryAll(query))
//     console.log('-'.repeat(18 + query.length))
// })

// selectorReader.readToken('> *[length > 0]".aaa bbb".123', p => {
//     console.log(p)
// })

selectorReader.update({
    pairs: new Map([
        [/#{2,}/, /#{3,}/]
    ]),
    tokens: ['let', 'active']
})
console.log('-----')
selectorReader.readToken('let a=0;[len>0] "123" ####v=="###"?"code":""###active', p => {
    console.log(p)
})