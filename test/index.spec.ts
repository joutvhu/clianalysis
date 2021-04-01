import {CommandExecutor} from '../src';

describe('Index', () => {
    test('call implement function', () => {
        const mockImpl = jest.fn().mockImplementation(args => {
            return args.args.name === 'test' && args.args.local === true;
        });

        CommandExecutor
            .of({
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
                                format: 'string'
                            }
                        ],
                        execute: mockImpl
                    }
                ],
                execute: () => {
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
                name: 'unit-test',
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
                                format: 'integer'
                            },
                            {
                                type: 'value',
                                name: 'position',
                                format: 'number'
                            }
                        ],
                        execute: mockImpl
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
                name: 'unit-test',
                children: [
                    {
                        type: 'task',
                        name: 'test',
                        filters: ['test', 't'],
                        children: [
                            {
                                type: 'value',
                                name: 'v1',
                                format: 'boolean'
                            },
                            {
                                type: 'value',
                                name: 'v2',
                                format: 'boolean'
                            },
                            {
                                type: 'value',
                                name: 'v3',
                                format: 'boolean'
                            }
                        ],
                        execute: mockImpl
                    }
                ]
            })
            .execute(['test', 'YES', 'false', '0']);

        expect(mockImpl).toHaveBeenCalled();
        expect(mockImpl).toHaveReturnedWith(true);
    });
});
