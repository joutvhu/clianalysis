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
}

export interface ParamSchema {
    type: 'param';
    name: string;
    filters: string | string[];
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
                            // todo: parse value
                            result.args[c.name] = arg;
                        }
                    } else {
                        const filter = this.findFilter(arg, c.filters, c.type === 'param');
                        let value: any = undefined;

                        if (filter != null) {
                            if (c.type === 'param') {
                                value = arg.slice(filter.length);
                                // todo: parse value
                                result.args[c.name] = value;
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
