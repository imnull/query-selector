import { TextReader, MatchChain } from './src'

const reader = new TextReader({
    pairs: new Map([
        [/#{2,}/, /#{3,}/]
    ]),
    tokens: ['let', 'active']
})
// reader.readToken('let a=0;[len>0] "123" ####v=="###"?"code":""###active', p => {
//     console.log(p)
// })

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

const ID = '[a-z_$][\\w\\d_$]*'
const QUOTE = '"[^"]*"|\'[^\\\']*\''
const COMPARE = '[\\!\\^\\$\\*]?\\=|[\\<\\>]\\=?|\\={1,3}'
const UINT = '[0-9]|[1-9]\\d+'
const VALUE = `${UINT}|[\\w\\d_$]+|${QUOTE}`
const PROP = `${ID}|\\*`
const PROP_NAME = `\\.?\\s*(${PROP})\\s*`
const PROP_ATTR_NAME = `${PROP}|\\@`
const PROP_VALUE = `${UINT}|${VALUE}|${QUOTE}|\\@`
const PROP_ATTR = `\\s*\\[\\s*(${PROP_ATTR_NAME})\\s*(${COMPARE})\\s*(${PROP_VALUE})\\s*\\]`

const reader2 = new TextReader({
    tokens: [
        MatchChain.Create([
            new RegExp(PROP_NAME, 'i'),
            new RegExp(PROP_ATTR, 'i')
        ], undefined, false),
        // {
        //     matcher: MatchChain.Create([/^\.?\s*([a-z_$]\w*|\*)\s*/i]),
        //     resolver: s => {
        //         s = s.replace(/^\s+|\s+$/g, '')
        //         if(s.charAt(0) === '.') {
        //             s = s.substring(1).replace(/^\s+|\s+$/g, '')
        //         }
        //         return s
        //     }
        // },
    ]
})

reader2.readToken('   global[sn=1] . *[abc] . obj [xyz>1].  arr[@<2]   [length>3][@^=str]', p => {
    console.log(`[${p.type}]`, `${p.content}`)
})