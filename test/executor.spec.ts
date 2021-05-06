import {CommandExecutor} from '../src/executor';
import {basic} from '../src/recommend';
import {CommandType} from '../src/schema';

describe('CommandExecutor', () => {
    test('call exception handlers', () => {
        const mockExhade = jest.fn().mockImplementation(args => {
            return args.errors[0].index === 3 && args.errors[0].argument === '--name=test';
        });

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
                exception: mockExhade
            })
            .execute(['test', '-l', '--name=test']);

        expect(mockExhade).toHaveBeenCalled();
        expect(mockExhade).toHaveReturnedWith(true);
    });
});
