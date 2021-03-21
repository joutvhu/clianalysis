import {CommandArgument, CommandSchema, TaskChildrenSchema} from './schema';

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
                            c.index == null && !result.hasValue(c.name)) {
                            result.setArg(c.name, this.parse(c.dataType, arg));
                            break;
                        }
                    } else {
                        const filter = this.findFilter(arg, c.filters, c.type === 'param');

                        if (filter != null) {
                            if (c.type === 'param') {
                                result.setArg(c.name, this.parse(c.dataType, arg.slice(filter.length)));
                                break;
                            } else if (['task', 'flag', 'group'].includes(c.type)) {
                                if (c.type === 'task') {
                                    result.addTask(c);
                                    result.setImpl(c.impl);
                                } else if (c.type === 'flag') {
                                    if (c.name.startsWith('!'))
                                        result.setArg(c.name.slice(1), false);
                                    else
                                        result.setArg(c.name, true);
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
        const result: CommandArgument = new CommandArgument(this.config, argv, cwd);
        if (this.config.children != null)
            this.analysis(result, 0, this.config.children);
        result.callImpl(this);
    }
}
