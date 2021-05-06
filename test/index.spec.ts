import {CommandExecutor} from '../src';
import {basic} from '../src/recommend';
import {CommandType} from '../src/schema';

describe('Index', () => {
    test('call implement function', () => {
        const mockImpl = jest.fn().mockImplementation(args => {
            return args.args.name === 'test' && args.args.local === true;
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
                            },
                            {
                                type: CommandType.FLAG,
                                name: '!v2',
                                filters: ['--v2']
                            },
                            {
                                type: CommandType.PARAM,
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
                                type: CommandType.PARAM,
                                name: 'amount',
                                filters: ['--amount=', '-a='],
                                format: 'integer'
                            },
                            {
                                type: CommandType.VALUE,
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
                                type: CommandType.VALUE,
                                name: 'v1',
                                format: 'boolean'
                            },
                            {
                                type: CommandType.VALUE,
                                name: 'v2',
                                format: 'boolean'
                            },
                            {
                                type: CommandType.VALUE,
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
