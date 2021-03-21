import {CommandArgument, CommandSchema, ImplementFunction, TaskChildrenSchema} from './schema';

export class CommandExecutor {
    private readonly config: CommandSchema = {};

    constructor(config: CommandSchema) {
        this.config = config;
    }

    static of(config: CommandSchema): CommandExecutor {
        return new CommandExecutor(config);
    }

    private findFilter(arg: string, filters: string | string[], prefix: boolean = false): string | undefined {
        if (arg != null && filters != null) {
            filters = filters instanceof Array ? filters : [filters];
            return filters.find(value =>
                prefix ? arg.startsWith(value) : arg === value
            );
        }
        return undefined;
    }

    private parse(type: string, value: string) {
        switch (type) {
            case 'boolean':
                return value != null && value.length > 0 &&
                    !['f', 'false', 'n', 'no', 'off', '0']
                        .some(v => v === value.toLowerCase());
            case 'int':
            case 'integer':
                return parseInt(value, 10);
            case 'float':
            case 'double':
            case 'number':
                return parseFloat(value);
            default:
                return value;
        }
    }

    private implementFunction(func: any): ImplementFunction | undefined {
        if (func instanceof Function || typeof func === 'function')
            return func;
        return undefined;
    }

    private analysis(
        result: CommandArgument,
        index: number,
        children?: TaskChildrenSchema[]) {
        const len = result.argv.length;
        let i = 0;

        if (children != null) {
            while (index + i < len) {
                const arg: string = result.argv[index + i];
                i++;

                for (const c of children || []) {
                    if (c.type === 'value') {
                        if (c.index === i ||
                            c.index == null && result.args[c.name] == null) {
                            result.args[c.name] = this.parse(c.dataType, arg);
                            break;
                        }
                    } else {
                        const filter = this.findFilter(arg, c.filters, c.type === 'param');

                        if (filter != null) {
                            if (c.type === 'param') {
                                result.args[c.name] = this.parse(c.dataType, arg.slice(filter.length));
                                break;
                            } else if (['task', 'flag', 'group'].includes(c.type)) {
                                if (c.type === 'task') {
                                    result.tasks.push(c.name);
                                    result.impl = this.implementFunction(c.impl);
                                } else if (c.type === 'flag') {
                                    if (c.name.startsWith('!'))
                                        result.args[c.name.slice(1)] = false;
                                    else
                                        result.args[c.name] = true;
                                }
                                i += this.analysis(result, index + i, c.children);
                                break;
                            }
                        }
                    }
                }
            }
        }

        return i;
    }

    execute(argv?: string[], cwd?: string) {
        if (argv == null) argv = process.argv.slice(2);
        if (cwd == null) cwd = process.cwd();

        const result: CommandArgument = {
            config: this.config,
            argv, cwd,
            impl: this.implementFunction(this.config.impl),
            tasks: [],
            args: {}
        };
        if (this.config.children != null)
            this.analysis(result, 0, this.config.children);

        if (result.impl != null)
            result.impl.call(this, result);
    }
}
