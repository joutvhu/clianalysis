import {CommandExecutor} from './index';

describe('CommandExecutor', () => {
    test('call impl function', () => {
        const mockImpl = jest.fn().mockImplementation(args => {
            return args.args.name === 'test' && args.args.local === true;
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
                            },
                            {
                                type: 'flag',
                                name: '!v2',
                                filters: ['--v2']
                            },
                            {
                                type: 'param',
                                name: 'name',
                                filters: ['--name=', '-n='],
                                dataType: 'string'
                            }
                        ],
                        impl: mockImpl
                    }
                ],
                impl: () => {
                }
            })
            .execute(['test', '-l', '--name=test']);

        expect(mockImpl).toHaveBeenCalled();
        expect(mockImpl).toHaveReturnedWith(true);
    });

    test('parse number', () => {
        const mockImpl = jest.fn().mockImplementation(args => {
            return args.args.position === 4.5 && args.args.amount === 41;
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
                                type: 'param',
                                name: 'amount',
                                filters: ['--amount=', '-a='],
                                dataType: 'integer'
                            },
                            {
                                type: 'value',
                                name: 'position',
                                dataType: 'number'
                            }
                        ],
                        impl: mockImpl
                    }
                ]
            })
            .execute(['test', '4.5', '--amount=41']);

        expect(mockImpl).toHaveBeenCalled();
        expect(mockImpl).toHaveReturnedWith(true);
    });

    test('parse boolean', () => {
        const mockImpl = jest.fn().mockImplementation(args => {
            return args.args.v1 === true && args.args.v2 === false && args.args.v3 === false;
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
                                type: 'value',
                                name: 'v1',
                                dataType: 'boolean'
                            },
                            {
                                type: 'value',
                                name: 'v2',
                                dataType: 'boolean'
                            },
                            {
                                type: 'value',
                                name: 'v3',
                                dataType: 'boolean'
                            }
                        ],
                        impl: mockImpl
                    }
                ]
            })
            .execute(['test', 'YES', 'false', '0']);

        expect(mockImpl).toHaveBeenCalled();
        expect(mockImpl).toHaveReturnedWith(true);
    });
});
