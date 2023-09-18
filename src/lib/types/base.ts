export type TArrayMember<T> = T extends Array<infer P> | Readonly<Array<infer P>> ? P : never;

export type TArrayOrPrimitive<T> = T extends Array<any> | ReadonlyArray<any> ? T | TArrayMember<T> : Array<T> | T;

export type Timestamp = number;
