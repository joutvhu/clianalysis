import {ArgumentError, CommandArgument, Data, ExceptionHandler, ImplementFunction, TraceRoute} from './argument';
import {AbstractCommandSchema, CommandFilter, CommandSchema, TaskChildrenSchema, TaskCommandSchema, ValueCommandSchema} from './schema';

export class CommandAnalyser {
    private readonly _argv: string[];
    private readonly _cwd: string;
    private readonly _stack: AbstractCommandSchema[] = [];

    private _tasks: string[] = [];
    private _trace: TraceRoute[] = [];
    private _args: Data = {};
    private _impl?: ImplementFunction;
    private _err: ExceptionHandler[] = [];

    constructor(config: CommandSchema, argv?: string[], cwd?: string) {
        this._argv = argv != null ? argv : process.argv.slice(2);
        this._cwd = cwd != null ? cwd : process.cwd();
        this._stack = [config];
        this.setImpl(config.impl);
        this.setErr(config.err);
    }

    public get arguments(): CommandArgument {
        return {
            argv: this._argv,
            cwd: this._cwd,
            args: this._args,
            tasks: this._tasks,
            stack: this._stack,
            trace: this._trace
        };
    }

    private setImpl(value: any) {
        if (value instanceof Function || typeof value === 'function')
            this._impl = value;
    }

    private setErr(value: any) {
        for (const v of this.toArray(value)) {
            if (v instanceof Function || typeof v === 'function')
                this._err.push(v);
        }
    }

    private trace(config: any) {
        this._trace.push({
            id: config.id,
            type: config.type,
            name: config.name
        });
    }

    private addTask(task: TaskCommandSchema) {
        this._tasks.push(task.name);
    }

    public addStack(stack: TaskChildrenSchema) {
        this._stack.push(stack);
    }

    private hasValue(key: string): boolean {
        return this._args[key] != null;
    }

    private setArg(key: string, value: any) {
        this._args[key] = value;
    }

    public callImpl() {
        if (this._impl != null)
            this._impl(this.arguments);
    }

    private toArray<T>(value: T | T[] | undefined | null): T[] {
        if (value == null)
            return [];
        else if (value instanceof Array)
            return value;
        else return [value];
    }

    private findFilter(
        arg: string,
        filters: CommandFilter | CommandFilter[],
        prefix: boolean = false): string | undefined {
        if (arg != null) {
            filters = this.toArray<CommandFilter>(filters);
            for (const f of filters) {
                if (typeof f === 'string') {
                    if (prefix ? arg.startsWith(f) : arg === f)
                        return f;
                } else if (f instanceof RegExp) {
                    if (f.test(arg)) {
                        const match = arg.match(f);
                        if (match != null && match.length > 0)
                            return match[0];
                        return '';
                    }
                } else if (f instanceof Function || typeof f === 'function') {
                    const value: any = f(arg);
                    if (typeof value === 'string')
                        return value;
                    else if (value === true)
                        return '';
                }
            }
            return undefined;
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
                            return false;
                    }
                }
            }
        }

        if (notfound != null) {
            notfound();
            return true;
        }
        return undefined;
    }

    private checkIndex(child: ValueCommandSchema, index: number): boolean {
        if (typeof child.index === 'number') {
            if (child.indexedBy != null) {
                for (let i = this._trace.length - 1; i > -1; i--) {
                    const t: TraceRoute = this._trace[i];
                    if (t.id === child.indexedBy || (t.id === null && t.name === child.indexedBy))
                        return child.index === index - i;
                }
            } else return child.index === index;
        }
        return false;
    }

    public analysis() {
        const len = this._argv.length;
        let index = 0;

        while (index < len) {
            const arg: string = this._argv[index];
            index++;

            const action = this.forEachChild(child => {
                if (child.type === 'value') {
                    if (this.checkIndex(child, index) || child.index == null && !this.hasValue(child.name)) {
                        this.setArg(child.name, this.parse(child.dataType, arg));
                        this.trace(child);
                        return {
                            action: 'break'
                        };
                    }
                } else {
                    const filter = this.findFilter(arg, child.filters, child.type === 'param');

                    if (filter != null) {
                        if (child.type === 'param') {
                            this.setArg(child.name, this.parse(child.dataType, arg.slice(filter.length)));
                            this.trace(child);
                            return true;
                        } else if (['task', 'flag', 'group'].includes(child.type)) {
                            if (child.type === 'task') {
                                this.addTask(child);
                                this.setImpl(child.impl);
                                this.setErr(child.err);
                            } else if (child.type === 'flag') {
                                if (child.name.startsWith('!'))
                                    this.setArg(child.name.slice(1), false);
                                else
                                    this.setArg(child.name, true);
                            }
                            this.trace(child);

                            return {
                                action: 'break',
                                overwrite: child.type !== 'task',
                                adding: child.children instanceof Array ? child : null
                            };
                        }
                    }
                }

                return undefined;
            }, () => {
                const errors: ArgumentError[] = [{
                    index,
                    argument: arg
                }];

                for (let i = this._err.length - 1; i > -1; i--) {
                    const exceptionHandler = this._err[i];
                    if (exceptionHandler(this.arguments, errors))
                        break;
                }
            });

            if (action) return;
        }
    }
}
