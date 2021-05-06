import {ExceptionHandler, ImplementFunction} from './argument';
import {Data, SingleOrList} from './basic';

export type CommandFilter = string | RegExp | ((value: string) => boolean | string);

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

export interface ValueCommandArgumentSchema extends Parsable, Data {
    id?: string;
    type: CommandType.VALUE;
    name: string;
    index?: number;
    indexedBy?: string | number;
    inheritance?: boolean;
}

export interface ParamCommandArgumentSchema extends Parsable, Data {
    id?: string;
    type: CommandType.PARAM;
    name: string;
    filters: SingleOrList<CommandFilter>;
    inheritance?: boolean;
}

export interface FlagCommandArgumentSchema extends Data {
    id?: string;
    type: CommandType.FLAG;
    name: string;
    filters: SingleOrList<CommandFilter>;
    children?: ChildCommandArgumentTypes[];
    inheritance?: boolean;
}

export interface GroupCommandArgumentSchema extends Data {
    id?: string;
    type: CommandType.GROUP;
    filters: SingleOrList<CommandFilter>;
    children: ChildCommandArgumentTypes[];
    inheritance?: boolean;
}

export type ChildCommandArgumentTypes =
    FlagCommandArgumentSchema |
    GroupCommandArgumentSchema |
    ParamCommandArgumentSchema |
    ValueCommandArgumentSchema;

export type ChildCommandTypes =
    ChildCommandArgumentTypes |
    SubCommandSchema;

export type CommandTypes =
    ChildCommandTypes |
    CommandSchema;

export interface CommandSchema extends Data {
    id?: string;
    name?: string;
    children?: ChildCommandTypes[];
    execute?: ImplementFunction;
    exception?: SingleOrList<ExceptionHandler>;
}

export interface SubCommandSchema extends CommandSchema {
    type: CommandType.TASK;
    name: string;
    filters: SingleOrList<CommandFilter>;
}

export type ArgumentParser = (config: Parsable, value: string) => any;

export interface CommandExtension {
    children?: ChildCommandTypes[];
    parser?: SingleOrList<ArgumentParser>;
    execute?: ImplementFunction;
    exception?: SingleOrList<ExceptionHandler>;
}

// export type CommandExtensionLoader = CommandExtension | (() => CommandExtension);
//
// export interface CommandSchema extends Data {
//     name?: string;
//     extends?: CommandExtensionLoader[];
//     children?: TaskChildrenSchema[];
//     parser?: SingleOrList<ArgumentParser>;
//     execute?: ImplementFunction;
//     exception?: SingleOrList<ExceptionHandler>;
// }
//
// export type CommandSchemaTypes = CommandSchema | TaskChildrenSchema;
