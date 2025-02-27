import type { ExecRawArgs, ExecArgs } from './types.js';

export const isValidExecRawArgs = (args: any): args is ExecRawArgs =>
  typeof args === 'object' &&
  args !== null &&
  typeof args.command === 'string' &&
  (args.timeout === undefined || typeof args.timeout === 'number');

export const isValidExecArgs = (args: any): args is ExecArgs =>
  typeof args === 'object' &&
  args !== null &&
  typeof args.workingDirectory === 'string' &&
  (typeof args.commands === 'string' ||
    (Array.isArray(args.commands) &&
      args.commands.every((cmd: any) => typeof cmd === 'string'))) &&
  (args.timeout === undefined || typeof args.timeout === 'number');