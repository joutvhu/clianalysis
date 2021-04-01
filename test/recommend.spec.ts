import {CommandExecutor} from '../src';
import {helper} from '../src/recommend';

describe('Recommended', () => {
    test('call helper extension', () => {
        jest.spyOn(global.console, 'log');

        CommandExecutor
            .of({
                extends: [
                    helper
                ],
                name: 'unit-test',
                children: [
                    {
                        type: 'task',
                        name: 'test',
                        filters: ['test', 't'],
                        children: [
                            {
                                type: 'flag',
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
