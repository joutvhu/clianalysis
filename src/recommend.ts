import {AbstractCommandArgument} from './argument';
import {ArgumentParser, CommandExtension} from './schema';

function help(args: AbstractCommandArgument) {
    for (let i = args.stack.length - 1; i > -1; i--) {
        const stack = args.stack[i];
        if (i === 0 || stack.type == null || stack.type === 'task') {
            const help = stack.help;
            if (typeof help === 'string')
                console.log(help);
            else if (help instanceof Function || typeof help === 'function')
                help(args);
            else continue;
            break;
        }
    }

    return true;
}

export const helper: CommandExtension = {
    children: [
        {
            name: 'help',
            type: 'task',
            filters: ['--help', '-h'],
            execute: help
        }
    ],
    exception: help
};

const parse: ArgumentParser = (config, value) => {
    switch (config.format) {
        case 'boolean':
            return value != null && value.length > 0 &&
                !['f', 'false', 'n', 'no', 'off', '0']
                    .some(v => v === value.toLowerCase());
        case 'int':
        case 'integer':
            return parseInt(value, 10);
        case 'float':
        case 'double':
        case 'number':
            return parseFloat(value);
        default:
            return value;
    }
};

export const parser: CommandExtension = {
    parser: parse
};

export const basic: CommandExtension = {
    children: [
        {
            name: 'help',
            type: 'task',
            filters: ['--help', '-h'],
            execute: help
        }
    ],
    parser: parse,
    exception: help
};
