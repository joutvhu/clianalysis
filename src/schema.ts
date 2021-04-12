import {Data, ExceptionHandler, ImplementFunction} from './argument';

export type CommandFilter = string | RegExp | ((value: string) => boolean | string);

export interface Parsable {
    format: string;
}

export interface ValueCommandSchema extends Parsable, Data {
    id?: string;
    type: 'value';
    name: string;
    index?: number;
    indexedBy?: string | number;
    inheritance?: boolean;
}

export interface ParamCommandSchema extends Parsable, Data {
    id?: string;
    type: 'param';
    name: string;
    filters: CommandFilter | CommandFilter[];
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

export type ArgumentParser = (config: Parsable, value: string) => any;

export interface CommandExtension {
    children?: TaskChildrenSchema[];
    parser?: ArgumentParser;
    execute?: ImplementFunction;
    exception?: ExceptionHandler[] | ExceptionHandler;
}

export type CommandExtensionLoader = CommandExtension | (() => CommandExtension);

export interface CommandSchema extends Data {
    name?: string;
    extends?: CommandExtensionLoader[];
    children?: TaskChildrenSchema[];
    parser?: ArgumentParser;
    execute?: ImplementFunction;
    exception?: ExceptionHandler[] | ExceptionHandler;
}

export type CommandSchemaTypes = CommandSchema | TaskChildrenSchema;
