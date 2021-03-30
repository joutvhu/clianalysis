import {CommandAnalyser} from './analyser';
import {CommandSchema} from './schema';

export class CommandExecutor {
    private readonly config: CommandSchema = {};

    constructor(config: CommandSchema) {
        this.config = config;
    }

    static of(config: CommandSchema): CommandExecutor {
        return new CommandExecutor(config);
    }

    execute(argv?: string[], cwd?: string) {
        const result: CommandAnalyser = new CommandAnalyser(this.config, argv, cwd);
        result.analysis();
        result.callImpl();
    }
}
