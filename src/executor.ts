import {importBy, parentDirname} from 'import-by';
import {CommandAnalyser} from './analyser';
import {CommandArgument, CommandError, ExceptionHandler} from './argument';
import {provide, Provider} from './basic';
import {ArgumentParser, CommandExtension, CommandSchema} from './schema';
import {Util} from './util';

export interface NodeCheckingOption {
    minMajor: number;
    minMinor?: number;
    minMicro?: number;
    toolName?: string;
}

export class Executable {
    private readonly config: CommandSchema;
    private readonly beforeExecute: () => boolean;
    private readonly afterExecute: (status: number) => void;

    constructor(config: CommandSchema, beforeExecute: () => boolean, afterExecute: (status: number) => void) {
        this.config = config;
        this.beforeExecute = beforeExecute;
        this.afterExecute = afterExecute;
    }

    /**
     * Execute the command
     *
     * @param argv is argument vector
     * @param cwd is current working directory
     */
    public execute(argv?: string[], cwd?: string) {
        if (typeof this.beforeExecute === 'function' && !this.beforeExecute())
            return;

        const analyser: CommandAnalyser = new CommandAnalyser(this.config, argv, cwd);
        const success: boolean = analyser.analysis();

        (async () => {
            if (success) {
                if (analyser.method.implementation != null) {
                    const result: any = analyser.method.implementation(analyser as CommandArgument);
                    if (result instanceof Promise) await result;
                }
                return 0;
            } else {
                for (let i = analyser.method.exceptionHandlers.length - 1; i > -1; i--) {
                    let result: any = analyser.method.exceptionHandlers[i](analyser as CommandError);
                    if (result instanceof Promise) result = await result;
                    if (!result) break;
                }
                return 1;
            }
        })().then(value => {
            if (typeof this.afterExecute === 'function')
                this.afterExecute(value);
        });
    }
}

export class CommandExecutor {
    private readonly extension: CommandExtension;
    private _exited = false;
    private _shouldExit = false;
    private _node?: NodeCheckingOption = undefined;

    constructor(extension: CommandExtension) {
        this.extension = extension;
    }

    static use(extension: Provider<CommandExtension>): CommandExecutor {
        return new CommandExecutor(provide(extension) || {});
    }

    /**
     * Should call process.exit when complete or error?
     */
    public exit(enable: boolean = true): CommandExecutor {
        this._shouldExit = enable;
        return this;
    }

    /**
     * Minimum node version required to be runnable the command
     */
    public node(options: NodeCheckingOption): CommandExecutor {
        this._node = options;
        return this;
    }

    public config(config: CommandSchema | string): Executable {
        if (typeof config === 'string')
            config = importBy(config, parentDirname(__filename)) as CommandSchema;

        const shouldExit = (code?: number) => {
            this._exited = true;
            if (this._shouldExit)
                process.exit(code);
        };

        if (typeof config !== 'object') {
            console.error('The command configuration is invalid.');
            shouldExit(2);
        }

        const shouldExecute = () => {
            if (this._exited) return false;
            if (this._node == null) return true;

            const [major, minor, micro]: any = process.versions.node.split('.');

            if (this._node != null && this._node.minMajor != null && major < this._node.minMajor && (
                this._node.minMinor == null || (major == this._node.minMajor && minor < this._node.minMinor && (
                this._node.minMicro == null || (minor == this._node.minMinor && micro < this._node.minMicro))))) {
                const toolName = this._node.toolName != null ? this._node.toolName : this.config.name;
                const version = `v${
                    this._node.minMajor
                }.${
                    this._node.minMinor != null ? this._node.minMinor : '0'
                }.${
                    this._node.minMicro != null ? this._node.minMicro : '0'
                }`;

                console.error(
                    `ERROR: This version of ${toolName} requires at least Node.js ${version}` +
                    `The current version of Node.js is ${process.version}`);
                shouldExit(2);
                return false;
            }

            return true;
        };

        // Merge configuration with extension
        if (Util.isNotBlank(this.extension)) {
            if (Util.isNotBlank(this.extension.exception)) {
                const exception = Util.toArray<ExceptionHandler>(this.extension.exception);
                config.exception = Util.toArray<ExceptionHandler>(config.exception);
                config.exception.push(...exception);
            }

            if (Util.isNotBlank(this.extension.execute) && Util.isBlank(config.execute))
                config.execute = this.extension.execute;

            if (this.extension.children instanceof Array)
                config.children?.push(...this.extension.children);

            if (Util.isNotBlank(this.extension.parser)) {
                const parsers: ArgumentParser[] = Util.toArray<ArgumentParser>(this.extension.parser)
                    .filter(parser => parser instanceof Function || typeof parser === 'function');
                config.parser = Util.toArray<ArgumentParser>(config.parser);
                config.parser.push(...parsers);
            }
        }

        return new Executable(config, shouldExecute, shouldExit);
    }
}
