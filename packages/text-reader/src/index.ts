import { TextReaderOptions, TextReaderOptionsInput, TTokeCallback } from "./type"
import { BRACKETS, ESCAPES, QUOTES, readToken, split, splitRegExp } from "./utils"

export { MatchChain } from './chain'

export class TextReader {
    private readonly options: TextReaderOptions
    constructor(options: TextReaderOptionsInput = {}) {
        const {
            escapes = ESCAPES,
            quotes = QUOTES,
            nests = BRACKETS,
            ...rest
        } = options
        this.options = {
            escapes,
            quotes,
            nests,
            ...rest,
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