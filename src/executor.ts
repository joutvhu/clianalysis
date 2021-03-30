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
        const success: boolean = result.analysis();
        const args: any = result.arguments;

        if (success) {
            if (result.implementFunction != null)
                result.implementFunction(args);
        } else {
            for (let i = result.exceptionHandlers.length - 1; i > -1; i--) {
                if (!result.exceptionHandlers[i](args))
                    break;
            }
        }
    }
}
