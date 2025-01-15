import { query, queryAll } from "./query";
import { explodeBranches } from "./travese";
import { TBranch } from "./type";

export class DataSelector {
    private readonly branches: TBranch[]
    constructor(data: any) {
        this.branches = explodeBranches(data)
    }

    update(data: any) {
        this.branches.splice(0, this.branches.length, ...explodeBranches(data))
        return this
    }

    query<T = any>(selector: string) {
        return query<T>(this.branches, selector)
    }
    queryAll(selector: string) {
        return queryAll(this.branches, selector)
    }
}