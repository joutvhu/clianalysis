export interface Data {
    [key: string]: any;
}

export type SingleOrList<T> = T[] | T;

export type Provider<T> = T | (() => T);

export function provide<T>(resolver: Provider<T>): T | undefined {
    if (resolver instanceof Function || typeof resolver === 'function')
        return (resolver as () => T)();
    else
        return resolver;
}
