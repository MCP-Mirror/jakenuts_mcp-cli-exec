import { readFileSync } from 'fs';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { CommandExecutor } from './executor.js';
import { ExecResult, CommandResult } from './types.js';
import { isValidExecArgs, isValidExecRawArgs } from './validation.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
const { name, version } = pkg;

export class CliServer {
  private server: Server;
  private executor: CommandExecutor;

  constructor() {
    this.server = new Server(
      {
        name,
        version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.executor = new CommandExecutor();
    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'cli-exec-raw',
          description: 'Execute a raw CLI command and return structured output',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'The CLI command to execute',
              },
              timeout: {
                type: 'number',
                description: 'Optional timeout in milliseconds (default: 5 minutes)',
                minimum: 0,
              },
            },
            required: ['command'],
          },
        },
        {
          name: 'cli-exec',
          description: 'Execute one or more CLI commands in a specific working directory',
          inputSchema: {
            type: 'object',
            properties: {
              workingDirectory: {
                type: 'string',
                description: 'Working directory to execute commands in',
              },
              commands: {
                oneOf: [
                  {
                    type: 'string',
                    description: 'Single command or && separated commands',
                  },
                  {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    description: 'Array of commands to execute sequentially',
                  },
                ],
                description: 'Commands to execute',
              },
              timeout: {
                type: 'number',
                description: 'Optional timeout in milliseconds per command (default: 5 minutes)',
                minimum: 0,
              },
            },
            required: ['workingDirectory', 'commands'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'cli-exec-raw': {
          if (!isValidExecRawArgs(request.params.arguments)) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'Invalid execution arguments'
            );
          }

          try {
            const startTime = Date.now();
            const result = await this.executor.executeCommand(
              request.params.arguments.command,
              undefined,
              request.params.arguments.timeout
            );
            const duration = Date.now() - startTime;

            const formattedResult: CommandResult = {
              command: request.params.arguments.command,
              success: result.exitCode === 0,
              exitCode: result.exitCode,
              stdout: result.stdout,
              stderr: result.stderr,
              duration,
              workingDirectory: process.cwd(),
            };

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(formattedResult, null, 2),
                },
              ],
            };
          } catch (error) {
            const errorResult: CommandResult = {
              command: request.params.arguments.command,
              success: false,
              exitCode: -1,
              stdout: '',
              stderr: '',
              error: error instanceof Error ? error.message : String(error),
              duration: 0,
              workingDirectory: process.cwd(),
            };

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(errorResult, null, 2),
                },
              ],
              isError: true,
            };
          }
        }

        case 'cli-exec': {
          if (!isValidExecArgs(request.params.arguments)) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'Invalid execution arguments'
            );
          }

          try {
            const startTime = Date.now();
            const commands = this.executor.parseCommands(request.params.arguments.commands);
            const results = await this.executor.executeCommands(
              commands,
              request.params.arguments.workingDirectory,
              request.params.arguments.timeout
            );

            const execResult: ExecResult = {
              success: results.every((r) => r.success),
              results,
              totalDuration: Date.now() - startTime,
            };

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(execResult, null, 2),
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: false,
                      results: [],
                      error: error instanceof Error ? error.message : String(error),
                      totalDuration: 0,
                    },
                    null,
                    2
                  ),
                },
              ],
              isError: true,
            };
          }
        }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  async connect(transport: any) {
    await this.server.connect(transport);
    console.error(`${name} v${version} running on stdio`);
  }

  async close() {
    await this.server.close();
  }
}