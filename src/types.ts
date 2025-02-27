export interface CommandResult {
  command: string;
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  error?: string;
  duration: number;
  workingDirectory: string;
}

export interface ExecResult {
  success: boolean;
  results: CommandResult[];
  totalDuration: number;
}

export interface ExecRawArgs {
  command: string;
  timeout?: number;
}

export interface ExecArgs {
  workingDirectory: string;
  commands: string | string[];
  timeout?: number;
}

export const DEFAULT_TIMEOUT = 300000; // 5 minutes