import {AbstractCommandArgument, ArgumentError, Data, ExceptionHandler, ImplementFunction, TraceRoute} from './argument';
import {CommandFilter, CommandSchema, CommandSchemaTypes, Parsable, TaskChildrenSchema, ValueCommandSchema} from './schema';
import {Util} from './util';

export class CommandAnalyser implements AbstractCommandArgument {
    private readonly _argv: string[];
    private readonly _cwd: string;
    private readonly _stack: CommandSchemaTypes[] = [];

    private _tasks: string[] = [];
    private _trace: TraceRoute[] = [];
    private _args: Data = {};
    private _errors: ArgumentError[] = [];
    private _impl?: ImplementFunction;
    private _exhale: ExceptionHandler[] = [];

    constructor(config: CommandSchema, argv?: string[], cwd?: string) {
        this._argv = argv != null ? argv : process.argv.slice(2);
        this._cwd = cwd != null ? cwd : process.cwd();
        this._stack = [config];
        this.setImplementFunction(config.execute);
        this.setExceptionHandler(config.exception);
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
        return this._tasks;
    }

    get trace(): TraceRoute[] {
        return this._trace;
    }

    get stack(): CommandSchemaTypes[] {
        return this._stack;
    }

    get errors(): ArgumentError[] | undefined {
        return this._errors;
    }

    public get implementFunction(): ImplementFunction | undefined {
        return this._impl;
    }

    public get exceptionHandlers(): ExceptionHandler[] {
        return this._exhale;
    }

    private setImplementFunction(value: any) {
        if (value instanceof Function || typeof value === 'function')
            this._impl = value;
    }

    private setExceptionHandler(value: any) {
        for (const v of Util.toArray(value)) {
            if (v instanceof Function || typeof v === 'function')
                this._exhale.push(v);
        }
    }

    private traceArguments(config: any) {
        this._trace.push({
            id: config.id,
            type: config.type,
            name: config.name
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
        if (this._stack[0].parser instanceof Function ||
            typeof this._stack[0].parser === 'function')
            return this._stack[0].parser(config, value);
        else return value;
    }

    private forEachChild(
        callback: (child: TaskChildrenSchema) => any,
        notfound?: () => void
    ): boolean | undefined {
        let lastTask = null;
        const max = this._stack.length - 1;
        for (let i = max; i > -1; i--) {
            const config: any = this._stack[i];
            if (lastTask == null && (i === 0 || config.type === 'task')) lastTask = i;
            if (config['children'] instanceof Array) {
                for (const child of config['children']) {
                    if (i < max && (child.type === 'task' || child.inheritance !== true))
                        continue;
                    const status = callback(child);
                    if (status) {
                        if (status.adding != null && (lastTask == null || i === lastTask)) {
                            if (status.overwrite)
                                this._stack.splice(i + 1, max - i, status.adding);
                            else if (i === max)
                                this._stack.push(status.adding);
                        }
                        if (status.action === 'break')
                            return true;
                    }
                }
            }
        }

        if (notfound != null) {
            notfound();
            return false;
        }
        return undefined;
    }

    private checkIndex(child: ValueCommandSchema, index: number): boolean {
        if (typeof child.index === 'number') {
            if (child.indexedBy != null) {
                for (let i = this._trace.length; i > 0; i--) {
                    const t: TraceRoute = this._trace[i - 1];
                    if (t.id === child.indexedBy || (t.id == null && t.name === child.indexedBy))
                        return child.index === index - i;
                }
            } else return child.index === index;
        }
        return false;
    }

    public analysis(): boolean {
        const len = this._argv.length;
        let index = 0;

        while (index < len) {
            const arg: string = this._argv[index];
            index++;

            const action = this.forEachChild(child => {
                if (child.type === 'value') {
                    if (this.checkIndex(child, index) || child.index == null && !this.hasValue(child.name)) {
                        this.setArgument(child.name, this.parse(child, arg));
                        this.traceArguments(child);
                        return {
                            action: 'break'
                        };
                    }
                } else {
                    const filter = this.findFilter(arg, child.filters, child.type === 'param');

                    if (filter != null) {
                        if (child.type === 'param') {
                            this.setArgument(child.name, this.parse(child, arg.slice(filter.length)));
                            this.traceArguments(child);
                            return {
                                action: 'break'
                            };
                        } else if (['task', 'flag', 'group'].includes(child.type)) {
                            if (child.type === 'task') {
                                this._tasks.push(child.name);
                                this.setImplementFunction(child.execute);
                                this.setExceptionHandler(child.exception);
                            } else if (child.type === 'flag') {
                                if (child.name.startsWith('!'))
                                    this.setArgument(child.name.slice(1), false);
                                else
                                    this.setArgument(child.name, true);
                            }
                            this.traceArguments(child);

                            return {
                                action: 'break',
                                overwrite: child.type !== 'task',
                                adding: child.children instanceof Array ? child : undefined
                            };
                        }
                    }
                }

                return undefined;
            }, () => this._errors.push({
                index,
                argument: arg
            }));

            if (action === false)
                return false;
        }

        return true;
    }
}
