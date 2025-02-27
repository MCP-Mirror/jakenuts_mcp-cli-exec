#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CliServer } from './server.js';

async function main() {
  const server = new CliServer();
  const transport = new StdioServerTransport();
  
  try {
    await server.connect(transport);
  } catch (error) {
    console.error('Server error:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Startup error:', error);
  process.exit(1);
});
