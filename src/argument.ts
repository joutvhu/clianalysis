import {CommandSchema, TaskChildrenSchema, TaskCommandSchema} from './schema';

export type ImplementFunction = (options: CommandArgument) => void;

export class CommandArgument {
    private readonly _config: CommandSchema;
    private readonly _argv: string[];
    private readonly _cwd: string;

    private _tasks: string[] = [];
    private _stack: TaskChildrenSchema[] = [];
    private _args: any = {};
    private _impl?: ImplementFunction;

    constructor(config: CommandSchema, argv?: string[], cwd?: string) {
        this._config = config;
        this._argv = argv != null ? argv : process.argv.slice(2);
        this._cwd = cwd != null ? cwd : process.cwd();
        this.setImpl(config.impl);
    }

    public get config(): CommandSchema {
        return this._config;
    }

    public get argv(): string[] {
        return this._argv;
    }

    public get cwd(): string {
        return this._cwd;
    }

    public get tasks(): string[] {
        return this._tasks;
    }

    public get stack(): TaskChildrenSchema[] {
        return this._stack;
    }

    public get args(): any {
        return this._args;
    }

    public setImpl(value: any) {
        if (value instanceof Function || typeof value === 'function')
            this._impl = value;
    }

    public addTask(task: TaskCommandSchema) {
        this._tasks.push(task.name);
        this._stack.push(task);
    }

    public hasValue(key: string): boolean {
        return this._args[key] != null;
    }

    public setArg(key: string, value: any) {
        this._args[key] = value;
    }

    public callImpl(that: any) {
        if (this._impl != null)
            this._impl.call(that, this);
    }
}
