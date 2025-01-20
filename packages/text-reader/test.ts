import { TextReader } from './src'

const reader = new TextReader({
    pairs: new Map([
        [/#{2,}/, /#{3,}/]
    ]),
    tokens: ['let', 'active']
})
reader.readToken('let a=0;[len>0] "123" ####v=="###"?"code":""###active', p => {
    console.log(p)
})