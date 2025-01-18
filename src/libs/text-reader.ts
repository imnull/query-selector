const ESCAPE = 92 // '\\'.charCodeAt(0)
const QUOTE_SINGLE = 39 // "'".charCodeAt(0)
const QUOTE_DOUBLE = 34 // '"'.charCodeAt(0)
const QUOTE_CARET = 96 // '`'.charCodeAt(0)
const QUOTES = [QUOTE_SINGLE, QUOTE_DOUBLE]
// const BRACKETS = ['(', ')', '[', ']', '{', '}'].map(ch => ch.charCodeAt(0))
// const BRACKETS = new Map<number, number>([
//     ['('.charCodeAt(0), ')'.charCodeAt(0)],
//     ['['.charCodeAt(0), ']'.charCodeAt(0)],
//     ['{'.charCodeAt(0), '|'.charCodeAt(0)],
// ])
const BRACKETS = new Map<number, number>([
    // ()
    [40, 41],
    // []
    [91, 93],
    // {}
    [123, 125]
])



const readTo = (s: string, endpoint: string, start: number = 0) => {
    const len = s.length - endpoint.length
    for (let i = start; i < len; i++) {
        const seg = s.substring(i, i + endpoint.length)
        if (seg.charCodeAt(0) === ESCAPE) {
            i += 1
            continue
        }
        if (seg === endpoint) {
            return i
        }
    }
    return -1
}

const readQuote = (s: string, quote: number, start: number = 0, options: {
    escape: number;
}) => {
    for (let i = start; i < s.length; i++) {
        const ch = s.charCodeAt(i)
        if (ch === options.escape) {
            i += 1
            continue
        }
        else if (ch === quote) {
            return i
        }
    }
    return -1
}

const matchTemplateStart = (s: string, start: number, templates: Record<string, string>) => {
    const keys = Object.keys(templates)
    const key = keys.find(k => k.length > 0 && s.substring(start, start + k.length) === k)
    return key ? templates[key] : ''
}

const readNest = (s: string, nest: number, start: number, options: {
    escape: number;
    quotes: number[];
    nests: Map<number, number>;
    templates?: Record<string, string>;
}) => {
    let tmp = ''
    for (let i = start; i < s.length; i++) {
        const ch = s.charCodeAt(i)
        if (ch === options.escape) {
            i += 1
            continue
        }
        else if (options.templates && (tmp = matchTemplateStart(s, i, options.templates))) {
            const end = readTo(s, tmp, i + tmp.length)
            if (end < 0) {
                return -1
            }
            i = end + tmp.length - 1
        }
        else if (ch === nest) {
            return i
        }
        else if (options.quotes.indexOf(ch) > -1) {
            const quoteEnd = readQuote(s, ch, i + 1, options)
            if (quoteEnd < 0) {
                return -1
            }
            i = quoteEnd
        }
        else if (options.nests.has(ch)) {
            const nestEnd = options.nests.get(ch)!
            const nestEndIndex = readNest(s, nestEnd, i + 1, options)
            if (nestEndIndex < 0) {
                return -1
            }
            i = nestEndIndex
        }
    }
    return -1
}
const trim = (s: unknown) => {
    return `${s}`.replace(/^\s+|\s+$/g, '')
}
export const split = (s: string, point: string | number | ((ch: number) => boolean), options: {
    escape: number;
    quotes: number[];
    nests: Map<number, number>;
}) => {
    const segments: { splitter: number; segment: string; }[] = []
    let start = 0, code = typeof point === 'string' ? point.charCodeAt(0) : 0
    const match = typeof point === 'function' ? point : typeof point === 'string' ? (ch: number) => ch === code : (ch: number) => ch === point
    let splitter = 0
    for (let i = 0; i < s.length; i++) {
        const ch = s.charCodeAt(i)
        if (ch === options.escape) {
            i += 1
            continue
        }
        else if (options.quotes.indexOf(ch) > -1) {
            const quoteEnd = readQuote(s, ch, i + 1, options)
            if (quoteEnd < 0) {
                break
            }
            i = quoteEnd
        }
        else if (options.nests.has(ch)) {
            const nestEnd = options.nests.get(ch)!
            const nestEndIndex = readNest(s, nestEnd, i + 1, options)
            if (nestEndIndex < 0) {
                break
            }
            i = nestEndIndex
        }
        else if (match(ch)) {
            segments.push({ splitter, segment: trim(s.substring(start, i)) })
            splitter = ch
            start = i + 1
        }
    }
    if (start < s.length) {
        segments.push({ splitter, segment: trim(s.substring(start)) })
    }
    return segments
}

export const splitRegExp = (s: string, regexp: RegExp, options: {
    escape: number;
    quotes: number[];
    nests: Map<number, number>;
    trimSplitter?: boolean;
}) => {
    const segments: { splitter: string; segment: string; }[] = []
    const match = (index: number) => {
        const m = s.substring(index).match(regexp)
        if (!!m && m.index === 0) {
            return m[0]
        }
        return ''
    }
    let start = 0, t = '', splitter = ''
    for (let i = 0; i < s.length; i++) {
        const ch = s.charCodeAt(i)
        if (ch === options.escape) {
            i += 1
            continue
        }
        else if (options.quotes.indexOf(ch) > -1) {
            const quoteEnd = readQuote(s, ch, i + 1, options)
            if (quoteEnd < 0) {
                break
            }
            i = quoteEnd
        }
        else if (options.nests.has(ch)) {
            const nestEnd = options.nests.get(ch)!
            const nestEndIndex = readNest(s, nestEnd, i + 1, options)
            if (nestEndIndex < 0) {
                break
            }
            i = nestEndIndex
        }
        else if (t = match(i)) {
            if (start < i) {
                segments.push({ splitter, segment: trim(s.substring(start, i)) })
            }
            splitter = t
            i = i + splitter.length
            start = i
            
            if (options.trimSplitter) {
                splitter = trim(splitter)
            }
        }
    }
    if (start < s.length) {
        segments.push({ splitter, segment: trim(s.substring(start)) })
    }
    return segments
}

type TTokenType = 'plain' | 'quote' | 'nest'
type TTokeCallback = (params: {
    token: string; 
    start: number;
    end: number;
    type: TTokenType;
}) => void

export const readToken = (s: string, callback: TTokeCallback, options: {
    escape: number;
    quotes: number[];
    nests: Map<number, number>;
    trimSplitter?: boolean;
}) => {
    let start = 0, end = start, t = '', splitter = ''
    const invoke = (type: TTokenType, i: number) => {
        end = i
        if(end > start) {
            const token = s.substring(start, end)
            callback({ token, start, end, type })
            start = end
        }
    }
    for (let i = 0; i < s.length; i++) {
        const ch = s.charCodeAt(i)
        if (ch === options.escape) {
            i += 1
            continue
        }
        else if (options.quotes.indexOf(ch) > -1) {
            invoke('plain', i)
            const quoteEnd = readQuote(s, ch, i + 1, options)
            if (quoteEnd < 0) {
                break
            }
            i = quoteEnd
            invoke('quote', i + 1)
        }
        else if (options.nests.has(ch)) {
            invoke('plain', i)
            const nestEnd = options.nests.get(ch)!
            const nestEndIndex = readNest(s, nestEnd, i + 1, options)
            if (nestEndIndex < 0) {
                break
            }
            i = nestEndIndex
            invoke('nest', i + 1)
        }
    }
    invoke('plain', s.length)
}

type TextReaderOptions = {
    escape: number;
    quotes: number[];
    nests: Map<number, number>;
}

type TextReaderOptionsInput = {
    [key in keyof TextReaderOptions]?: TextReaderOptions[key]
}

export class TextReader {
    private readonly options: TextReaderOptions
    constructor(options: TextReaderOptionsInput = {}) {
        const {
            escape = ESCAPE,
            quotes = QUOTES,
            nests = BRACKETS
        } = options
        this.options = {
            escape,
            quotes,
            nests,
        }
    }

    update(options: TextReaderOptionsInput) {
        Object.assign(this.options, options)
        return this
    }
    split(s: string, point: string | number | ((ch: number) => boolean)) {
        return split(s, point, this.options)
    }
    splitRegExp(s: string, reg: RegExp, trimSplitter: boolean = true) {
        return splitRegExp(s, reg, { ...this.options, trimSplitter })
    }
    readToken(s: string, callback: TTokeCallback) {
        return readToken(s, callback, this.options)
    }
}

export const selectorReader = new TextReader()