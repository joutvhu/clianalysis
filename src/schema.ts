import {ExceptionHandler, ImplementFunction} from './argument';

export type CommandFilter = string | RegExp | ((value: string) => boolean | string);

export interface ValueCommandSchema {
    id?: string;
    type: 'value';
    name: string;
    index?: number;
    indexedBy?: string;
    dataType: string;
    inheritance?: boolean;
}

export interface ParamCommandSchema {
    id?: string;
    type: 'param';
    name: string;
    filters: CommandFilter | CommandFilter[];
    dataType: string;
    inheritance?: boolean;
}

export type GroupChildrenSchema = FlagCommandSchema | GroupCommandSchema | ParamCommandSchema | ValueCommandSchema;

export interface FlagCommandSchema {
    id?: string;
    type: 'flag';
    name: string;
    filters: CommandFilter | CommandFilter[];
    children?: GroupChildrenSchema[];
    inheritance?: boolean;
}

export interface GroupCommandSchema {
    id?: string;
    type: 'group';
    filters: CommandFilter | CommandFilter[];
    children: GroupChildrenSchema[];
    inheritance?: boolean;
}

export type TaskChildrenSchema = TaskCommandSchema | GroupChildrenSchema;

export interface TaskCommandSchema {
    id?: string;
    type: 'task';
    name: string;
    filters: CommandFilter | CommandFilter[];
    children?: TaskChildrenSchema[];
    impl?: ImplementFunction;
    exhale?: ExceptionHandler[] | ExceptionHandler;
}

export interface CommandSchema {
    children?: TaskChildrenSchema[];
    impl?: ImplementFunction;
    exhale?: ExceptionHandler[] | ExceptionHandler;
}

export type AbstractCommandSchema = CommandSchema | TaskChildrenSchema;
