import {Data, ExceptionHandler, ImplementFunction} from './argument';

export type CommandFilter = string | RegExp | ((value: string) => boolean | string);

export interface ValueCommandSchema extends Data {
    id?: string;
    type: 'value';
    name: string;
    index?: number;
    indexedBy?: string | number;
    dataType: string;
    inheritance?: boolean;
}

export interface ParamCommandSchema extends Data {
    id?: string;
    type: 'param';
    name: string;
    filters: CommandFilter | CommandFilter[];
    dataType: string;
    inheritance?: boolean;
}

export type GroupChildrenSchema = FlagCommandSchema | GroupCommandSchema | ParamCommandSchema | ValueCommandSchema;

export interface FlagCommandSchema extends Data {
    id?: string;
    type: 'flag';
    name: string;
    filters: CommandFilter | CommandFilter[];
    children?: GroupChildrenSchema[];
    inheritance?: boolean;
}

export interface GroupCommandSchema extends Data {
    id?: string;
    type: 'group';
    filters: CommandFilter | CommandFilter[];
    children: GroupChildrenSchema[];
    inheritance?: boolean;
}

export type TaskChildrenSchema = TaskCommandSchema | GroupChildrenSchema;

export interface TaskCommandSchema extends Data {
    id?: string;
    type: 'task';
    name: string;
    filters: CommandFilter | CommandFilter[];
    children?: TaskChildrenSchema[];
    execute?: ImplementFunction;
    exception?: ExceptionHandler[] | ExceptionHandler;
}

export interface CommandSchema extends Data {
    name?: string;
    extends?: string | CommandSchema | (() => CommandSchema);
    children?: TaskChildrenSchema[];
    execute?: ImplementFunction;
    exception?: ExceptionHandler[] | ExceptionHandler;
}

export type CommandSchemaTypes = CommandSchema | TaskChildrenSchema;
