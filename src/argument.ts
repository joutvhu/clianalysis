import {AbstractCommandSchema} from './schema';

export interface TraceRoute {
    id?: string;
    type?: string;
    name?: string;
}

export type ImplementFunction = (args: CommandArgument) => void;

export type ExceptionHandler = (args: CommandArgumentError) => boolean;

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

export interface CommandArgumentError extends CommandArgument {
    errors: ArgumentError[];
}

export interface ArgumentError {
    index: number;
    argument: string;
}
