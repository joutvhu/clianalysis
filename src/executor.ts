import {CommandAnalyser} from './analyser';
import {CommandSchema} from './schema';

export interface NodeCheckingOption {
    minMajor: number;
    minMinor?: number;
    minMicro?: number;
    toolName?: string;
}

export class CommandExecutor {
    private readonly config: CommandSchema = {};
    private exited = false;
    private exitCode = false;

    constructor(config: CommandSchema) {
        this.config = config;
    }

    static of(config: CommandSchema): CommandExecutor {
        return new CommandExecutor(config);
    }

    private exit(code?: number) {
        this.exited = true;
        if (this.exitCode)
            process.exit(code);
    }

    public endWithExit(enable: boolean = true): CommandExecutor {
        this.exitCode = enable;
        return this;
    }

    public checkNode(options: NodeCheckingOption): CommandExecutor {
        const [major, minor, micro]: any = process.versions.node.split('.');

        if (options != null && options.minMajor != null && major < options.minMajor && (
            options.minMinor == null || (major == options.minMajor && minor < options.minMinor && (
            options.minMicro == null || (minor == options.minMinor && micro < options.minMicro))))) {
            const toolName = options.toolName != null ? options.toolName : this.config.name;
            const version = `v${
                options.minMajor
            }.${
                options.minMinor != null ? options.minMinor : '0'
            }.${
                options.minMicro != null ? options.minMicro : '0'
            }`;

            console.error(
                `ERROR: This version of ${toolName} requires at least Node.js ${version}` +
                `The current version of Node.js is ${process.version}`);
            this.exit(1);
        }

        return this;
    }

    public execute(argv?: string[], cwd?: string) {
        if (this.exited) return;

        const result: CommandAnalyser = new CommandAnalyser(this.config, argv, cwd);
        const success: boolean = result.analysis();
        const args: any = result.arguments;

        if (success) {
            if (result.implementFunction != null)
                result.implementFunction(args);
            this.exit(0);
        } else {
            for (let i = result.exceptionHandlers.length - 1; i > -1; i--) {
                if (!result.exceptionHandlers[i](args))
                    break;
            }
            this.exit(1);
        }
    }
}
