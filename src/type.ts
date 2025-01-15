export type TPathItem = string | number
export type TBranch = { value: unknown; path: TPathItem[]; }
export type TRelation = 'direct' | 'ancestor'
export type TSelector2 = { path: string; child?: string; relation?: TRelation }
export type TSelector = { path: TPathItem[]; relation?: TRelation; next?: TSelector }
