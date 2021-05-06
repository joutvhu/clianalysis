import {AbstractCommandArgument, ArgumentError, ArgumentStack, ArgumentTrace, CommandMethod} from './argument';
import {Data} from './basic';
import {ArgumentParser, CommandFilter, CommandSchema, CommandType, Parsable} from './schema';
import {Util} from './util';

export class CommandAnalyser implements AbstractCommandArgument {
    private readonly _argv: string[];
    private readonly _cwd: string;
    private readonly _stack: ArgumentStack;
    private readonly _trace: ArgumentTrace;
    private readonly _method: CommandMethod;
    private readonly _args: Data = {};
    private readonly _errors: ArgumentError[] = [];

    constructor(config: CommandSchema, argv?: string[], cwd?: string) {
        this._argv = argv != null ? argv : process.argv.slice(2);
        this._cwd = cwd != null ? cwd : process.cwd();

        this._args = {};
        this._errors = [];

        this._trace = new ArgumentTrace();
        this._trace.setArguments(this._argv);
        this._stack = new ArgumentStack();
        this._stack.add(config);

        this._method = new CommandMethod();
        this._method.implementation = config.execute;
        this._method.addExceptionHandler(config.exception);
    }

    get config(): CommandSchema {
        return this._stack.stack[0].node as CommandSchema;
    }

    get argv(): string[] {
        return this._argv;
    }

    get cwd(): string {
        return this._cwd;
    }

    get args(): Data {
        return this._args;
    }

    get tasks(): string[] {
        return this._stack.tasks;
    }

    get trace(): ArgumentTrace {
        return this._trace;
    }

    get stack(): ArgumentStack {
        return this._stack;
    }

    get errors(): ArgumentError[] | undefined {
        return this._errors;
    }

    get method(): CommandMethod {
        return this._method;
    }

    private updateTrace(index: number, config: any) {
        this._trace.update(index, node => {
            node.id = config.id;
            node.type = config.type;
            node.name = config.name;
        });
    }

    private hasValue(key: string): boolean {
        return this._args[key] != null;
    }

    private setArgument(key: string, value: any) {
        this._args[key] = value;
    }

    private findFilter(
        arg: string,
        filters: CommandFilter | CommandFilter[],
        prefix: boolean = false): string | undefined {
        if (arg != null) {
            filters = Util.toArray<CommandFilter>(filters);
            for (const f of filters) {
                if (typeof f === 'string') {
                    if (prefix ? arg.startsWith(f) : arg === f)
                        return f;
                } else if (f instanceof RegExp) {
                    if (f.test(arg)) {
                        const match: any = arg.match(f);
                        return Util.isNotBlank(match) ? match[0] : '';
                    }
                } else if (f instanceof Function || typeof f === 'function') {
                    const value: any = f(arg);
                    if (typeof value === 'string')
                        return value;
                    if (value === true)
                        return '';
                }
            }
            return undefined;
        }
        return undefined;
    }

    private parse(config: Parsable, value: string) {
        const parsers: ArgumentParser[] = Util.toArray<ArgumentParser>(this.config.parser);
        for (const parser of parsers) {
            const result = parser(config, value);
            if (result !== undefined)
                return result;
        }
        return value;
    }

    public analysis(): boolean {
        for (let index = 0, len = this._argv.length; index < len; index++) {
            const arg: string = this._argv[index];

            this._stack.forEach((tree, child, root) => {
                let found = false;
                if (child.type === CommandType.VALUE) {
                    if (this._trace.checkIndex(index, child.index, child.indexedBy) ||
                        child.index == null && !this.hasValue(child.name)) {
                        this.setArgument(child.name, this.parse(child, arg));
                        found = true;
                    }
                } else {
                    const filter = this.findFilter(arg, child.filters, child.type === CommandType.PARAM);

                    if (filter != null) {
                        if (child.type === CommandType.PARAM) {
                            this.setArgument(child.name, this.parse(child, arg.slice(filter.length)));
                            found = true;
                        } else if ([CommandType.TASK, CommandType.FLAG, CommandType.GROUP].includes(child.type)) {
                            if (child.type == null || child.type === CommandType.TASK) {
                                this._method.implementation = child.execute;
                                this._method.addExceptionHandler(child.exception);
                                if (root)
                                    this._stack.add(child);
                                else
                                    tree.add(child);
                            } else if (child.type === CommandType.FLAG) {
                                if (child.name.startsWith('!'))
                                    this.setArgument(child.name.slice(1), false);
                                else
                                    this.setArgument(child.name, true);
                                tree.add(child);
                            } else tree.add(child);
                            found = true;
                        }
                    }
                }

                if (found) {
                    this.updateTrace(index, child);
                    return true;
                } else return false;
            });
        }

        // TODO: validate missing arguments

        return true;
    }
}
