import {basic} from '../src/recommend';
import {CommandExecutor} from '../src';
import {CommandType} from '../src/schema';

describe('Recommended', () => {
    test('call helper extension', () => {
        jest.spyOn(global.console, 'log');

        CommandExecutor
            .use(basic)
            .config({
                name: 'unit-test',
                children: [
                    {
                        type: CommandType.TASK,
                        name: 'test',
                        filters: ['test', 't'],
                        children: [
                            {
                                type: CommandType.FLAG,
                                name: 'local',
                                filters: ['--local', '-l']
                            }
                        ]
                    }
                ],
                execute: () => {
                },
                exception: () => false,
                help: 'Display usage information'
            })
            .execute(['--help']);

        expect(console.log).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith('Display usage information');
    });
});
