export type TPropChecker = { key: string | number; value: string | number; operator: string; }
export type TPathItem = string | number
export type TQueryPathItem = TPathItem | TPropChecker
export type TBranch = { value: unknown; path: TPathItem[]; }
export type TRelation = 'direct' | 'ancestor'
export type TSelector2 = { path: string; child?: string; relation?: TRelation }
export type TSelector = { path: TQueryPathItem[]; relation?: TRelation; next?: TSelector }
