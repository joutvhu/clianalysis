export interface CommandArgument {
    config: CommandSchema;
    argv: string[];
    cwd: string;
    tasks: any[];
    args: any;
    impl?: ImplementFunction;
}

export type ImplementFunction = (option: CommandArgument) => void;

export interface ValueCommandSchema {
    type: 'value';
    name: string;
    index?: number;
    dataType: string;
}

export interface ParamCommandSchema {
    type: 'param';
    name: string;
    filters: string | string[];
    dataType: string;
}

export type GroupChildrenSchema = FlagCommandSchema | GroupCommandSchema | ParamCommandSchema | ValueCommandSchema;

export interface FlagCommandSchema {
    type: 'flag';
    name: string;
    filters: string | string[];
    children?: GroupChildrenSchema[];
}

export interface GroupCommandSchema {
    type: 'group';
    filters: string | string[];
    children: GroupChildrenSchema[];
}

export type TaskChildrenSchema =
    TaskCommandSchema
    | FlagCommandSchema
    | GroupCommandSchema
    | ParamCommandSchema
    | ValueCommandSchema;

export interface TaskCommandSchema {
    type: 'task';
    name: string;
    filters: string | string[];
    children?: TaskChildrenSchema[];
    impl?: ImplementFunction;
}

export interface CommandSchema {
    children?: TaskChildrenSchema[];
    impl?: ImplementFunction;
}
