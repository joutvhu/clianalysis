import {AbstractCommandSchema} from './schema';

export interface TraceRoute {
    id?: string;
    type?: string;
    name?: string;
}

export type ImplementFunction = (options: CommandArgument) => void;

export type ExceptionHandler = (options: CommandArgument, errors: ArgumentError[]) => boolean;

export interface Data {
    [key: string]: any;
}

export interface CommandArgument {
    argv: string[];
    cwd: string;
    args: Data;
    tasks: string[];
    trace: TraceRoute[];
    stack: AbstractCommandSchema[];
}

export interface ArgumentError {
    index: number;
    argument: string;
}
