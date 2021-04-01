import {importBy, parentDirname} from 'import-by';
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
    private _exited = false;
    private _exitCode = false;

    constructor(config: CommandSchema) {
        this.config = config;
    }

    /**
     * Create a new instance of CommandExecutor
     *
     * @param config is a {@interface CommandSchema} or a reference string to {@interface CommandSchema}
     */
    static of(config: CommandSchema | string): CommandExecutor {
        if (typeof config === 'string')
            config = importBy(config, parentDirname(__filename)) as CommandSchema;
        return new CommandExecutor(config);
    }

    private exit(code?: number): void {
        this._exited = true;
        if (this._exitCode)
            process.exit(code);
    }

    /**
     * Should call process.exit when complete or error?
     */
    public endWithExit(enable: boolean = true): CommandExecutor {
        this._exitCode = enable;
        return this;
    }

    /**
     * Minimum node version required to be runnable the command
     */
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

    /**
     * Execute the command
     *
     * @param argv is argument vector
     * @param cwd is current working directory
     */
    public execute(argv?: string[], cwd?: string) {
        if (this._exited) return;

        const analyser: CommandAnalyser = new CommandAnalyser(this.config, argv, cwd);
        const success: boolean = analyser.analysis();
        const args: any = analyser.arguments;

        (async () => {
            if (success) {
                if (analyser.implementFunction != null) {
                    const result: any = analyser.implementFunction(args);
                    if (result instanceof Promise) await result;
                }
                return 0;
            } else {
                for (let i = analyser.exceptionHandlers.length - 1; i > -1; i--) {
                    let result: any = analyser.exceptionHandlers[i](args);
                    if (result instanceof Promise) result = await result;
                    if (!result) break;
                }
                return 1;
            }
        })().then(value => {
            this.exit(value);
        });
    }
}
