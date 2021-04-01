export class Util {
    public static isBlank(value: any): boolean {
        return value === null || value === undefined || (value.length !== undefined && value.length === 0);
    }

    public static isNotBlank(value: any): boolean {
        return value !== null && value !== undefined && (value.length === undefined || value.length > 0);
    }

    public static toArray<T>(value: T | T[] | undefined | null): T[] {
        if (value == null)
            return [];
        else if (value instanceof Array)
            return value;
        else return [value];
    }
}
