import {AbstractCommandArgument} from './argument';
import {CommandExtension} from './schema';

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
