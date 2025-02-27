import { execa } from 'execa';
import stripAnsi from 'strip-ansi';
import { CommandResult, DEFAULT_TIMEOUT } from './types.js';

export class CommandExecutor {
  async executeCommand(
    command: string,
    cwd?: string,
    timeout?: number
  ): Promise<{ exitCode: number; stdout: string; stderr: string, cwd:string }> {
    try {
    
      const result = await execa(command, [], {
        cwd: cwd,
        shell: true,
        timeout: timeout || DEFAULT_TIMEOUT,
        reject: false,
        all: true,
      });

      return {
        exitCode: result.exitCode ?? -1,
        stdout: stripAnsi(result.stdout ?? ''),
        stderr: stripAnsi(result.stderr ?? ''),
        cwd:result.cwd
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Command execution failed: ${error.message}`);
      }
      throw error;
    }
  }

  async executeCommands(
    commands: string[],
    workingDirectory: string,
    timeout?: number
  ): Promise<CommandResult[]> {
    const results: CommandResult[] = [];

    for (const command of commands) {
      const cmdStartTime = Date.now();
      try {    
        const result = await this.executeCommand(
          command,
          workingDirectory,
          timeout
        );

        const duration = Date.now() - cmdStartTime;

        results.push({
          command,
          success: result.exitCode === 0,
          exitCode: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
          duration,
          workingDirectory,
        });

        // Stop execution if a command fails
        if (result.exitCode !== 0) {
          break;
        }
      } catch (error) {
        results.push({
          command,
          success: false,
          exitCode: -1,
          stdout: '',
          stderr: '',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - cmdStartTime,
          workingDirectory,
        });
        break;
      }
    }

    return results;
  }

  parseCommands(commands: string | string[]): string[] {
    return Array.isArray(commands)
      ? commands
      : commands
          .split('&&')
          .map((cmd) => cmd.trim())
          .filter(Boolean);
  }
}