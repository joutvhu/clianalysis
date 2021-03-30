import {CommandExecutor} from './executor';

describe('CommandExecutor', () => {
    test('call exception handlers', () => {
        const mockExhade = jest.fn().mockImplementation(args => {
            return args.errors[0].index === 3 && args.errors[0].argument === '--name=test';
        });

        CommandExecutor
            .of({
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
                impl: () => {
                },
                exhale: mockExhade
            })
            .execute(['test', '-l', '--name=test']);

        expect(mockExhade).toHaveBeenCalled();
        expect(mockExhade).toHaveReturnedWith(true);
    });
});
