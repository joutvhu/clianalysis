import {Data, ExceptionHandler, ImplementFunction} from './argument';

export type CommandFilter = string | RegExp | ((value: string) => boolean | string);

export type SingleOrList<T> = T[] | T;

export interface Parsable {
    format: string;
}

export enum CommandType {
    TASK = 'task',
    GROUP = 'group',
    FLAG = 'flag',
    PARAM = 'param',
    VALUE = 'value'
}

export interface ValueCommandSchema extends Parsable, Data {
    id?: string;
    type: CommandType.VALUE;
    name: string;
    index?: number;
    indexedBy?: string | number;
    inheritance?: boolean;
}

export interface ParamCommandSchema extends Parsable, Data {
    id?: string;
    type: CommandType.PARAM;
    name: string;
    filters: SingleOrList<CommandFilter>;
    inheritance?: boolean;
}

export type GroupChildrenSchema = FlagCommandSchema | GroupCommandSchema | ParamCommandSchema | ValueCommandSchema;

export interface FlagCommandSchema extends Data {
    id?: string;
    type: CommandType.FLAG;
    name: string;
    filters: SingleOrList<CommandFilter>;
    children?: GroupChildrenSchema[];
    inheritance?: boolean;
}

export interface GroupCommandSchema extends Data {
    id?: string;
    type: CommandType.GROUP;
    filters: SingleOrList<CommandFilter>;
    children: GroupChildrenSchema[];
    inheritance?: boolean;
}

export type TaskChildrenSchema = TaskCommandSchema | GroupChildrenSchema;

export interface TaskCommandSchema extends Data {
    id?: string;
    type: CommandType.TASK;
    name: string;
    filters: SingleOrList<CommandFilter>;
    children?: TaskChildrenSchema[];
    execute?: ImplementFunction;
    exception?: SingleOrList<ExceptionHandler>;
}

export type ArgumentParser = (config: Parsable, value: string) => any;

export interface CommandExtension {
    children?: TaskChildrenSchema[];
    parser?: SingleOrList<ArgumentParser>;
    execute?: ImplementFunction;
    exception?: SingleOrList<ExceptionHandler>;
}

export type CommandExtensionLoader = CommandExtension | (() => CommandExtension);

export interface CommandSchema extends Data {
    name?: string;
    extends?: CommandExtensionLoader[];
    children?: TaskChildrenSchema[];
    parser?: SingleOrList<ArgumentParser>;
    execute?: ImplementFunction;
    exception?: SingleOrList<ExceptionHandler>;
}

export type CommandSchemaTypes = CommandSchema | TaskChildrenSchema;
