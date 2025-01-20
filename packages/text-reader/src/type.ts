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
export type TMatcher = string | RegExp | ((s: string, i: number) => number)
export type TPairs = Map<TMatcher, TMatcher | TMatcher[]>
export type TextReaderOptions = TextReaderOptionsBase & {
    pairs?: TPairs;
    tokens?: TMatcher | TMatcher[];
}

export type TextReaderOptionsInput = {
    [key in keyof TextReaderOptions]?: TextReaderOptions[key]
}