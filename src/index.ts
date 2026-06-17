#!/usr/bin/env node
import { MCPStdioServer } from "./servers/stdio-server.js";
import { MCPStreamHTTPServer } from "./servers/http-server.js";
import { parseArgs, getDefaultImageStorageDirectory } from "./utils/index.js";
import { DEFAULT_CLIENT_SOURCE_BY_TRANSPORT, DEFAULT_PORT, DEFAULT_TRANSPORT, Transport } from "./types/index.js";

function parseConfig() {
  const args = parseArgs();

  const apiKey = args["dinox-api-key"] || process.env.DINOX_API_KEY;

  // Support both --transport http and --http as shorthand
  let transport = (args["transport"] as Transport) || DEFAULT_TRANSPORT;
  if (args["http"] !== undefined) {
    transport = Transport.StreamableHTTP;
  }
  if (args["stdio"] !== undefined) {
    transport = Transport.STDIO;
  }

  const port = parseInt(args["port"], 10) || DEFAULT_PORT;
  const enableClientKey = args["enable-client-key"] === "true" || args["enable-client-key"] === "";
  const clientSource = args["client-source"] || DEFAULT_CLIENT_SOURCE_BY_TRANSPORT[transport];
  const sseEnabled = process.env.DINOX_MCP_SSE_ENABLED !== "false";
  let imageStorageDirectory = process.env.IMAGE_STORAGE_DIRECTORY;
  let authToken = process.env.AUTH_TOKEN;

  // For STDIO transport, API key is always required
  // For HTTP transport, API key is required unless --allow-url-key is specified
  if (!apiKey) {
    if (transport === Transport.STDIO) {
      throw new Error("Missing API key for STDIO transport. Use --dinox-api-key or set DINOX_API_KEY env var.");
    } else if (transport === Transport.StreamableHTTP && !enableClientKey) {
      throw new Error("Missing API key for HTTP transport. Use --dinox-api-key, set DINOX_API_KEY env var, or use --enable-client-key to allow client-provided keys.");
    }
  }

  if (![Transport.STDIO, Transport.StreamableHTTP].includes(transport)) {
    throw new Error(`Invalid transport: "${transport}". Must be "stdio" or "http".`);
  }

  if (transport === Transport.StreamableHTTP && (isNaN(port) || port < 1 || port > 65535)) {
    throw new Error("Invalid port. Must be a number between 1 and 65535.");
  }

  if (transport === Transport.STDIO && !imageStorageDirectory) {
    imageStorageDirectory = getDefaultImageStorageDirectory();
  }

  return { apiKey, transport, port, imageStorageDirectory, authToken, enableClientKey, clientSource, sseEnabled };
}

async function startMCPServer() {
  const config = parseConfig();

  const server =
    config.transport === Transport.STDIO
      ? new MCPStdioServer(config)
      : new MCPStreamHTTPServer(config);

  await server.start();
}

startMCPServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
