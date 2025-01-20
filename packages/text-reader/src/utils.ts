import { TextReaderOptions, TextReaderOptionsBase, TMatcher, TTokeCallback, TTokens, TMatchResolver, TMatcherBase, TMatchTool } from "./type"
import { MatchChain } from './chain'

export const ESCAPES = [92] // '\\'.charCodeAt(0)
export const QUOTE_SINGLE = 39 // "'".charCodeAt(0)
export const QUOTE_DOUBLE = 34 // '"'.charCodeAt(0)
export const QUOTE_CARET = 96 // '`'.charCodeAt(0)
export const QUOTES = [QUOTE_SINGLE, QUOTE_DOUBLE]
// const BRACKETS = ['(', ')', '[', ']', '{', '}'].map(ch => ch.charCodeAt(0))
// const BRACKETS = new Map<number, number>([
//     ['('.charCodeAt(0), ')'.charCodeAt(0)],
//     ['['.charCodeAt(0), ']'.charCodeAt(0)],
//     ['{'.charCodeAt(0), '|'.charCodeAt(0)],
// ])
export const BRACKETS = new Map<number, number>([
    // ()
    [40, 41],
    // []
    [91, 93],
    // {}
    [123, 125]
]);

const isEscape = (ch: number, options: { escapes: number[] }) => {
    return options.escapes.includes(ch)
}
const isNestStart = (ch: number, options: { nests: Map<number, number> }) => {
    return options.nests.has(ch)
}
const isQuote = (ch: number, options: { quotes: number[] }) => {
    return options.quotes.includes(ch)
}

const isMatchResolver = (matcher: TMatcher): matcher is TMatchResolver => {
    const v = matcher as any
    return !!v
        && typeof v === 'object'
        && typeof v.resolver === 'function'
        && v.matcher && (typeof v.matcher === 'string' || v.matcher instanceof RegExp)
}

const readToQuote = (s: string, quote: number, start: number = 0, options: {
    escapes: number[];
}) => {
    for (let i = start; i < s.length; i++) {
        const ch = s.charCodeAt(i)
        if (isEscape(ch, options)) {
            i += 1
            continue
        }
        else if (ch === quote) {
            return i
        }
    }
    return -1
}

const readToNest = (s: string, nest: number, start: number, options: TextReaderOptionsBase) => {
    for (let i = start; i < s.length; i++) {
        const ch = s.charCodeAt(i)
        if (isEscape(ch, options)) {
            i += 1
            continue
        }
        else if (ch === nest) {
            return i
        }
        else if (isQuote(ch, options)) {
            const quoteEnd = readToQuote(s, ch, i + 1, options)
            if (quoteEnd < 0) {
                return -1
            }
            i = quoteEnd
        }
        else if (isNestStart(ch, options)) {
            const nestEnd = options.nests.get(ch)!
            const nestEndIndex = readToNest(s, nestEnd, i + 1, options)
            if (nestEndIndex < 0) {
                return -1
            }
            i = nestEndIndex
        }
    }
    return -1
}

const isPair = (s: string, start: number, options: TextReaderOptions) => {
    const pairs = options.pairs
    if (!pairs) {
        return void (0)
    }
    const keys = Array.from(pairs.keys())
    const leftMatcher = keys.find(k => {
        if (typeof k === 'string') {
            return k.length > 0 && s.substring(start, start + k.length) === k
        } else if (k instanceof RegExp) {
            const m = s.substring(start).match(k)
            return m && m.index === 0
        } else if (typeof k === 'function') {
            const end = k(s, start)
            return end > start
        }
    })
    if (!leftMatcher) {
        return void (0)
    }
    const matcher = genMatcher(leftMatcher)
    const leftEnd = matcher.match(s, start)
    const left = s.substring(start, leftEnd + 1)
    return {
        left,
        start: start + left.length,
        matcher: pairs.get(leftMatcher)!,
        resolver: matcher.resolver,
    }
}

const isToken = (s: string, start: number, options: TextReaderOptions) => {
    if (!options.tokens) {
        return void (0)
    }
    const matcher = genMatcher(options.tokens)
    const end = matcher.match(s, start)
    if (end > start) {
        return {
            index: end,
            match: s.substring(start, end),
            resolver: matcher.resolver,
        }
    }
    return void (0)
}

const genMatcherBase = (endpoint: TMatcherBase | MatchChain) => {
    let match: (s: string, i: number) => number
    if(endpoint instanceof MatchChain) {
        match = (s, i) => endpoint.match(s, i)
    } else if (typeof endpoint === 'string') {
        match = (s, i) => {
            if (s.substring(i, i + endpoint.length) === endpoint) {
                return i + endpoint.length - 1
            }
            return -1
        }
    } else if (endpoint instanceof RegExp) {
        match = (s, i) => {
            const sub = s.substring(i)
            const m = sub.match(endpoint)
            if (m && m.index === 0) {
                return i + m[0].length - 1
            }
            return -1
        }
    } else if (typeof endpoint === 'function') {
        match = endpoint
    } else {
        match = () => -1
    }
    return match
}

export const genMatcher = (endpoint: TMatcher | MatchChain | (TMatcher | MatchChain)[]): TMatchTool => {
    if (Array.isArray(endpoint)) {
        const ms = endpoint.map(m => genMatcher(m))
        let resolver: ((s: string) => string) | undefined = undefined
        return {
            match: (s, i) => {
                let idx = -1
                if (ms.some(m => {
                    idx = m.match(s, i)
                    if (idx > i) {
                        resolver = m.resolver
                        return true
                    }
                    return false
                })) {
                    return idx
                }
                return -1
            },
            resolver: s => {
                return resolver ? resolver(s) : s
            }
        }

    } else {
        if(endpoint instanceof MatchChain) {
            return {
                match: (s, i) => endpoint.match(s, i),
                resolver: endpoint.resolver || (s => s),
            }
        } else if (isMatchResolver(endpoint)) {
            return {
                match: genMatcherBase(endpoint.matcher),
                resolver: endpoint.resolver,
            }
        } else {
            return {
                match: genMatcherBase(endpoint),
                resolver: (s: string) => s,
            }
        }
    }
}

const readTo = (s: string, endpoint: TMatcher | MatchChain | (TMatcher | MatchChain)[], start: number, options: TextReaderOptionsBase) => {

    const match = genMatcher(endpoint);

    let endIndex = -1
    for (let i = start; i < s.length; i++) {
        const ch = s.charCodeAt(i)
        if (isEscape(ch, options)) {
            i += 1
            continue
        }
        else if (isQuote(ch, options)) {
            const quoteEnd = readToQuote(s, ch, i + 1, options)
            if (quoteEnd < 0) {
                return null
            }
            i = quoteEnd
        }
        else if (isNestStart(ch, options)) {
            const nestEnd = options.nests.get(ch)!
            const nestEndIndex = readToNest(s, nestEnd, i + 1, options)
            if (nestEndIndex < 0) {
                return null
            }
            i = nestEndIndex
        }
        else if ((endIndex = match.match(s, i)) > -1) {
            return {
                match: s.substring(i, endIndex + 1),
                index: endIndex,
                resovler: match.resolver,
            }
        }
    }
    return null
}

export const readToken = (s: string, callback: TTokeCallback, options: TextReaderOptions) => {
    let
        start = 0,
        end = start,
        tmpPair: ReturnType<typeof isPair> = undefined,
        tmpToken: ReturnType<typeof isToken> = undefined
        ;
    const invoke = (t: TTokens, i: number, resolver?: (s: string) => string) => {
        end = i
        const r = typeof resolver === 'function' ? resolver : (s: string) => s
        if (end > start) {
            const raw = s.substring(start, end)
            const base = {
                raw,
                content: raw,
                startIndex: start,
                endIndex: end,
            }
            switch (t.type) {
                case 'nest':
                case 'quote': {
                    base.content = base.raw.slice(1, -1)
                    break
                }
                case 'pair': {
                    base.content = base.raw.slice(t.left.length, -t.right.length)
                    break
                }
            }
            base.content = r(base.content)
            callback({ ...base, ...t })
            start = end
        }
    }
    for (let i = 0; i < s.length; i++) {
        const ch = s.charCodeAt(i)
        if (isEscape(ch, options)) {
            i += 1
            continue
        }
        else if (tmpToken = isToken(s, i, options)) {
            invoke({ type: 'plain' }, i)
            i = tmpToken.index
            invoke({ type: 'token' }, i + 1, tmpToken.resolver)
        }
        else if (tmpPair = isPair(s, i, options)) {
            invoke({ type: 'plain' }, i)
            const end = readTo(s, tmpPair.matcher, tmpPair.start, options)
            if (!end) {
                return -1
            }
            i = end.index
            invoke({ type: 'pair', left: tmpPair.left, right: end.match }, i + 1, tmpPair.resolver)
        }
        else if (isQuote(ch, options)) {
            invoke({ type: 'plain' }, i)
            const quoteEnd = readToQuote(s, ch, i + 1, options)
            if (quoteEnd < 0) {
                break
            }
            i = quoteEnd
            invoke({ type: 'quote', quote: String.fromCharCode(ch) }, i + 1)
        }
        else if (isNestStart(ch, options)) {
            invoke({ type: 'plain' }, i)
            const nestEnd = options.nests.get(ch)!
            const nestEndIndex = readToNest(s, nestEnd, i + 1, options)
            if (nestEndIndex < 0) {
                break
            }
            i = nestEndIndex
            invoke({ type: 'nest', left: String.fromCharCode(ch), right: String.fromCharCode(nestEnd) }, i + 1)
        }
    }
    invoke({ type: 'plain' }, s.length)
}

const trim = (s: unknown) => {
    return `${s}`.replace(/^\s+|\s+$/g, '')
}
export const split = (s: string, point: string | number | ((ch: number) => boolean), options: TextReaderOptionsBase) => {
    const segments: { splitter: number; segment: string; }[] = []
    let start = 0, code = typeof point === 'string' ? point.charCodeAt(0) : 0
    const match = typeof point === 'function' ? point : typeof point === 'string' ? (ch: number) => ch === code : (ch: number) => ch === point
    let splitter = 0
    for (let i = 0; i < s.length; i++) {
        const ch = s.charCodeAt(i)
        if (isEscape(ch, options)) {
            i += 1
            continue
        }
        else if (isQuote(ch, options)) {
            const quoteEnd = readToQuote(s, ch, i + 1, options)
            if (quoteEnd < 0) {
                break
            }
            i = quoteEnd
        }
        else if (isNestStart(ch, options)) {
            const nestEnd = options.nests.get(ch)!
            const nestEndIndex = readToNest(s, nestEnd, i + 1, options)
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

export const splitRegExp = (s: string, regexp: RegExp, options: TextReaderOptionsBase & {
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
        if (isEscape(ch, options)) {
            i += 1
            continue
        }
        else if (isQuote(ch, options)) {
            const quoteEnd = readToQuote(s, ch, i + 1, options)
            if (quoteEnd < 0) {
                break
            }
            i = quoteEnd
        }
        else if (isNestStart(ch, options)) {
            const nestEnd = options.nests.get(ch)!
            const nestEndIndex = readToNest(s, nestEnd, i + 1, options)
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
