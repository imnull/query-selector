import type { MatchChain } from './chain'
export type TTokenBase = {
    raw: string;
    content: string;
    startIndex: number;
    endIndex: number;
}
export type TTokens = {
    type: 'plain';
} | {
    type: 'token';
} | {
    type: 'nest' | 'pair';
    left: string;
    right: string;
} | {
    type: 'quote';
    quote: string;
}
export type TToken = TTokenBase & TTokens

export type TTokeCallback = (token: TToken) => void

export type TextReaderOptionsBase = {
    escapes: number[];
    quotes: number[];
    nests: Map<number, number>;
}
export type TMatcherBase = string | RegExp | ((s: string, i: number) => number)
export type TMatchResolver = { matcher: TMatcherBase | MatchChain; resolver: (content: string) => string }
export type TMatcher = TMatcherBase | TMatchResolver

export type TMatchTool = {
    match: (s: string, i: number) => number;
    resolver: (s: string) => string;
}

export type TPairs = Map<TMatcher, TMatcher | MatchChain | (TMatcher | MatchChain)[]>
export type TextReaderOptions = TextReaderOptionsBase & {
    pairs?: TPairs;
    tokens?: TMatcher | MatchChain | (TMatcher | MatchChain)[];
}

export type TextReaderOptionsInput = {
    [key in keyof TextReaderOptions]?: TextReaderOptions[key]
}
