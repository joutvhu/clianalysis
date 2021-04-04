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
    trace: TraceRoute[];
    stack: CommandSchemaTypes[];

    errors?: ArgumentError[];
}

export interface CommandArgument extends AbstractCommandArgument {
    errors: undefined;
}

export interface CommandError extends AbstractCommandArgument {
    errors: ArgumentError[];
}
