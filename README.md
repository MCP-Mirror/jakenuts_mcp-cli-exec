# mcp-cli MCP Server

A powerful CLI command execution MCP server that enables running shell commands with structured output.

## Features

### Tools

#### cli-exec-raw
Execute a raw CLI command and return structured output
- Takes a command string and optional timeout
- Returns detailed execution results including stdout, stderr, exit code
- Handles errors gracefully with structured error responses

#### cli-exec
Execute one or more CLI commands in a specific working directory
- Supports single commands, && chained commands, or array of commands
- Maintains working directory context between commands
- Returns detailed results for each command execution
- Stops on first command failure
- Optional timeout per command

### Output Format

Commands return structured results including:
- Success/failure status
- Exit code
- stdout and stderr (with ANSI codes stripped)
- Execution duration
- Working directory
- Detailed error information if applicable

## Installation

Install from npm:
```bash
npm install @jakenuts/mcp-cli
# or
pnpm add @jakenuts/mcp-cli
```

### For Cline VSCode Extension

Add to `%APPDATA%/Code - Insiders/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "mcp-cli": {
      "command": "npx",
      "args": ["-y", "@jakenuts/mcp-cli"]
    }
  }
}
```

### For Claude Desktop

Add to the appropriate config file:

Windows: `%APPDATA%/Claude/claude_desktop_config.json`
MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mcp-cli": {
      "command": "npx",
      "args": ["-y", "@jakenuts/mcp-cli"]
    }
  }
}
```

### Special Windows Configuration

If you encounter the ENOENT spawn npx issue on Windows, use this alternative configuration that specifies the full paths:

```json
{
  "mcpServers": {
    "mcp-cli": {
      "command": "C:\\path\\to\\node\\node.exe",
      "args": [
        "C:\\path\\to\\node\\node_modules\\npm\\bin\\npx-cli.js",
        "-y",
        "@jakenuts/mcp-cli"
      ]
    }
  }
}
```


## Development

Install dependencies:
```bash
pnpm install
```

Build the server:
```bash
pnpm run build
```

For development with auto-rebuild:
```bash
pnpm run watch
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. The MCP Inspector provides helpful debugging tools:

```bash
pnpm run inspector
```

This will provide a URL to access the inspector in your browser, where you can:
- View all MCP messages
- Inspect request/response payloads
- Test tools interactively
- Monitor server state

## Error Handling

The server includes comprehensive error handling:
- Input validation for all tool parameters
- Structured error responses
- Command timeout handling
- Working directory validation
- ANSI code stripping for clean output

## Technical Details

- Built with TypeScript and the MCP SDK
- Uses execa for reliable command execution
- Default command timeout: 5 minutes
- Supports Windows and Unix-like systems
- Maintains working directory context
- Handles command chaining and sequential execution
