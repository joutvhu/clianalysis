import {CommandSchemaTypes} from './schema';

export interface TraceRoute {
    id?: string;
    type?: string;
    name?: string;
}

export type ImplementFunction = (args: CommandArgument) => void;

/**
 * @return should call next handler
 */
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
    stack: CommandSchemaTypes[];
}

export interface ArgumentError {
    index: number;
    argument: string;
}

export interface CommandArgumentError extends CommandArgument {
    errors: ArgumentError[];
}
