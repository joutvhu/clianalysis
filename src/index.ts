export interface CommandArgument {
    argv: string[];
    cwd: string;
    tasks: any[];
    args: any;
    impl?: ImplementFunction;
}

declare interface ImplementFunction {
    (option: CommandArgument): void;
}

export interface ValueSchema {
    type: 'value';
    name: string;
    index?: number;
    dataType: string;
}

export interface ParamSchema {
    type: 'param';
    name: string;
    filters: string | string[];
    dataType: string;
}

declare type FlagChildSchema = FlagSchema | DetectSchema | ParamSchema | ValueSchema;

export interface FlagSchema {
    type: 'flag';
    name: string;
    filters: string | string[];
    children?: FlagChildSchema[];
}

export interface DetectSchema {
    type: 'detect';
    filters: string | string[];
    children: FlagChildSchema[];
}

declare type TaskChildSchema = TaskSchema | FlagSchema | DetectSchema | ParamSchema | ValueSchema;

export interface TaskSchema {
    type: 'task';
    name: string;
    filters: string | string[];
    children?: TaskChildSchema[];
    impl?: ImplementFunction;
}

export interface CommandSchema {
    children?: TaskChildSchema[];
    impl?: ImplementFunction;
}

export class CommandRunner {
    private readonly config: CommandSchema = {};

    constructor(config: CommandSchema) {
        this.config = config;
    }

    static of(config: CommandSchema): CommandRunner {
        return new CommandRunner(config);
    }

    findFilter(arg: string, filters: string | string[], prefix: boolean = false): string | undefined {
        if (arg != null && filters != null) {
            filters = filters instanceof Array ? filters : [filters];
            return filters.find(value =>
                prefix ? arg.startsWith(value) : arg === value
            );
        }
        return undefined;
    }

    parse(type: string, value: string) {
        if (type === 'boolean') {
            return value != null && ['t', 'true', 'y', 'yes', 'on']
                .some(v => v === value.toLowerCase());
        }
        if (type === 'integer') {
            return parseInt(value, 10);
        }
        if (type === 'number') {
            return parseFloat(value);
        }
        return value;
    }

    analysis(
        result: CommandArgument,
        index: number,
        children?: TaskChildSchema[]) {
        const len = result.argv.length;
        let i = 0;

        if (children != null) {
            while (index + i < len) {
                const arg: string = result.argv[index + i];
                i++;

                for (const c of children || []) {
                    if (c.type === 'value') {
                        if (c.index == null || c.index === i) {
                            result.args[c.name] = this.parse(c.dataType, arg);
                        }
                    } else {
                        const filter = this.findFilter(arg, c.filters, c.type === 'param');

                        if (filter != null) {
                            if (c.type === 'param') {
                                result.args[c.name] = this.parse(c.dataType, arg.slice(filter.length));
                            } else if (['task', 'flag', 'detect'].includes(c.type)) {
                                if (c.type === 'task') {
                                    result.tasks.push(c.name);
                                    if (c.impl instanceof Function)
                                        result.impl = c.impl;
                                } else if (c.type === 'flag') {
                                    if (c.name.startsWith('!'))
                                        result.args[c.name.slice(1)] = false;
                                    else
                                        result.args[c.name] = true;
                                }
                                i += this.analysis(result, index + i, c.children);
                            }
                        }
                    }
                }
            }
        }

        return i;
    }

    execute(argv: string[] = process.argv.slice(2), cwd: string = process.cwd()) {
        const result: CommandArgument = {
            argv: argv != null ? argv : process.argv.slice(2),
            cwd: cwd != null ? cwd : process.cwd(),
            impl: this.config.impl,
            tasks: [],
            args: {}
        };
        if (this.config.children != null)
            this.analysis(result, 0, this.config.children);

        if (result.impl instanceof Function)
            result.impl(result);
    }
}
