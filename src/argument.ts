import {CommandSchemaTypes, CommandType, SingleOrList, TaskChildrenSchema} from './schema';
import {Util} from './util';

export type ImplementFunction = (args: CommandArgument) => void;

/**
 * @return should call next handler
 */
export type ExceptionHandler = (args: CommandError) => boolean;

export interface Data {
    [key: string]: any;
}

export interface ArgumentError {
    index: number;
    argument: string;
}

export interface AbstractCommandArgument {
    argv: string[];
    cwd: string;
    args: Data;
    tasks: string[];
    trace: ArgumentTrace;
    stack: ArgumentStack;

    errors?: ArgumentError[];
}

export interface CommandArgument extends AbstractCommandArgument {
    errors: undefined;
}

export interface CommandError extends AbstractCommandArgument {
    errors: ArgumentError[];
}

export class ArgumentTree {
    private readonly _node: CommandSchemaTypes;
    private readonly _optional: ArgumentTree[];

    constructor(node: CommandSchemaTypes) {
        this._node = node;
        this._optional = [];
    }

    get node(): CommandSchemaTypes {
        return this._node;
    }

    get optional(): ArgumentTree[] {
        return this._optional;
    }

    public add(node: CommandSchemaTypes) {
        this._optional.push(new ArgumentTree(node));
    }

    public forEach(
        callback: (
            tree: ArgumentTree,
            child: TaskChildrenSchema,
            root: boolean
        ) => boolean | undefined,
        root: boolean = true
    ) {
        if (this._node.children instanceof Array) {
            for (const child of this._node.children) {
                if (!root && (child.type === CommandType.TASK || !child.inheritance))
                    continue;
                if (callback(this, child, root))
                    return true;
            }
        }
        for (const option of this._optional) {
            if (option.forEach(callback, false))
                return true;
        }
        return false;
    }
}

export class ArgumentStack {
    private readonly _stack: ArgumentTree[];

    constructor() {
        this._stack = [];
    }

    get tasks(): string[] {
        return this._stack
            .map(value => value.node)
            .filter(value => value.type === CommandType.TASK)
            .map(value => value.name);
    }

    get stack(): ArgumentTree[] {
        return this._stack;
    }

    public add(node: ArgumentTree): void;
    public add(node: CommandSchemaTypes): void;
    public add(node: ArgumentTree | CommandSchemaTypes): void {
        if (node instanceof ArgumentTree)
            this._stack.push(node);
        else this._stack.push(new ArgumentTree(node));
    }

    public forEach(callback: (
        tree: ArgumentTree,
        child: TaskChildrenSchema,
        root: boolean
    ) => boolean | undefined): boolean {
        for (let i = this._stack.length - 1; i >= 0; i--) {
            if (this._stack[i].forEach(callback))
                return true;
        }
        return false;
    }
}

export interface ArgumentNode {
    index: number;
    arg: string;

    id?: string;
    type?: CommandType;
    name?: string;
}

export class ArgumentTrace {
    private readonly _trace: ArgumentNode[];

    constructor() {
        this._trace = [];
    }

    get trace(): ArgumentNode[] {
        return this._trace;
    }

    public get(index: number): ArgumentNode | undefined {
        return this._trace[index].index === index ? this._trace[index] : undefined;
    }

    public setArguments(argv: string[]): void {
        (argv || []).forEach((arg, index) => this.add({index, arg}));
    }

    public add(node: ArgumentNode): void {
        this._trace.push(node);
    }

    public update(index: number, callback: (node: ArgumentNode) => void): void {
        const node = this.get(index);
        if (node != null) callback(node);
    }

    public checkIndex(index: number, space?: number, from?: string | number): boolean {
        if (typeof space === 'number') {
            if (from != null) {
                for (let i = this._trace.length; i > 0; i--) {
                    const t: ArgumentNode = this._trace[i - 1];
                    if (t.id === from || (t.id == null && t.name === from))
                        return space === index - i;
                }
            } else return space === index;
        }
        return false;
    }
}

export class CommandMethod {
    private _implementFunction?: ImplementFunction;
    private _exceptionHandlers: ExceptionHandler[] = [];

    get implementation(): ImplementFunction | undefined {
        return this._implementFunction;
    }

    set implementation(value: ImplementFunction | undefined) {
        if (value instanceof Function || typeof value === 'function')
            this._implementFunction = value;
    }

    get exceptionHandlers(): ExceptionHandler[] {
        return this._exceptionHandlers;
    }

    public addExceptionHandler(value: SingleOrList<ExceptionHandler> | undefined) {
        for (const v of Util.toArray(value)) {
            if (v instanceof Function || typeof v === 'function')
                this._exceptionHandlers.push(v);
        }
    }
}
