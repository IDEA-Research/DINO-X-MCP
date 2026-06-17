import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DinoXApiClient } from "../dino-x/client.js";
import { BASE_URL, DEFAULT_TIMEOUT, Tool, ToolConfigs } from "../constants/tool.js";
import { z } from 'zod';
import { parseBbox, parsePoseKeypoints } from "../utils/index.js";
import { Config, ResultCategory } from "../types/index.js";
import express from "express";
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";
import { logError, logEvent, runWithRequestLogContext } from "../utils/observability.js";

/**
 * MCP Server class for managing DINO-X MCP server configuration and functionality
 * Specifically designed for Streamable HTTP transport mode
 */
export class MCPStreamHTTPServer {
  private config!: Config;
  private defaultApi?: DinoXApiClient;
  private requestApiClients = new AsyncLocalStorage<DinoXApiClient>();

  constructor(customConfig: Config) {
    this.config = customConfig;

    // Create default API client if apiKey is provided in config
    if (this.config.apiKey) {
      this.defaultApi = this.createApiClient(this.config.apiKey);
    }

  }

  private createMcpServer(): McpServer {
    const server = new McpServer({
      name: 'dinox-mcp-server',
      version: '1.0.0',
    });

    this.registerTools(server);
    return server;
  }

  /**
   * Get API key from request with fallback priority
   * Priority: URL parameter 'key' (if allowed) > server config apiKey
   * @param req Express request object
   * @returns API key string
   * @throws Error if no valid API key found
   */
  private getApiKeyFromRequest(req: express.Request): string {
    const urlApiKey = req.query.key as string;
    if (urlApiKey && typeof urlApiKey === 'string' && urlApiKey.trim()) {
      return urlApiKey.trim();
    }

    throw new Error(
      'API key required. Please provide via URL parameter (?key=your-dinox-api-key)'
    );
  }

  private createApiClient(apiKey: string): DinoXApiClient {
    return new DinoXApiClient({
      apiKey,
      baseUrl: BASE_URL,
      timeout: DEFAULT_TIMEOUT,
      clientSource: this.config.clientSource,
    });
  }

  private getApiClient(): DinoXApiClient {
    const requestApiClient = this.requestApiClients.getStore();
    if (requestApiClient) {
      return requestApiClient;
    }

    if (this.defaultApi) {
      return this.defaultApi;
    }

    throw new Error("API client is not configured");
  }

  private getRequestIdFromRequest(req: express.Request): string {
    const requestIdHeader = req.headers["x-fc-request-id"] || req.headers["x-request-id"];
    if (Array.isArray(requestIdHeader)) {
      return requestIdHeader[0] || randomUUID();
    }

    return requestIdHeader || randomUUID();
  }

  private getClientIp(req: express.Request): string | undefined {
    const forwardedFor = req.headers["x-forwarded-for"];
    if (typeof forwardedFor === "string" && forwardedFor.trim()) {
      return forwardedFor.split(",")[0].trim();
    }

    return req.ip;
  }

  private getRequestHeader(req: express.Request, name: string): string | undefined {
    const value = req.headers[name.toLowerCase()];
    if (Array.isArray(value)) {
      return value.join(",");
    }

    return value;
  }

  private getHttpRequestLogFields(req: express.Request): Record<string, unknown> {
    return {
      http_method: req.method,
      route_path: req.path,
      client_ip: this.getClientIp(req),
      query_has_key: typeof req.query.key === "string" && req.query.key.trim().length > 0,
      user_agent: this.getRequestHeader(req, "user-agent"),
      accept: this.getRequestHeader(req, "accept"),
      content_type: this.getRequestHeader(req, "content-type"),
      content_length: this.getRequestHeader(req, "content-length"),
      mcp_protocol_version: this.getRequestHeader(req, "mcp-protocol-version"),
    };
  }

  private getJsonRpcSummary(body: unknown): Record<string, unknown> {
    const messages = Array.isArray(body) ? body : [body];
    const methods: string[] = [];
    const toolNames: string[] = [];

    for (const message of messages) {
      if (!message || typeof message !== "object") {
        continue;
      }

      const candidate = message as { method?: unknown; params?: { name?: unknown } };
      if (typeof candidate.method === "string") {
        methods.push(candidate.method);
      }

      if (candidate.method === "tools/call" && typeof candidate.params?.name === "string") {
        toolNames.push(candidate.params.name);
      }
    }

    return {
      jsonrpc_batch_size: messages.length,
      jsonrpc_methods: methods,
      tool_names: toolNames,
    };
  }

  private getImageUriScheme(imageFileUri: string): string {
    const match = imageFileUri.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
    return match?.[1] || "unknown";
  }

  private isSseRequest(req: express.Request): boolean {
    const acceptHeader = this.getRequestHeader(req, "accept");
    return req.method === "GET" && !!acceptHeader?.includes("text/event-stream");
  }

  private registerTools(server: McpServer): void {
    this.registerDetectByTextTool(server);
    this.registerDetectAllObjectsTool(server);
    this.registerDetectHumanPoseKeypointsTool(server);
  }

  private registerDetectByTextTool(server: McpServer): void {
    const { name, description } = ToolConfigs[Tool.DETECT_BY_TEXT];
    server.tool(
      name,
      description,
      {
        imageFileUri: z.string().describe("URI of the input image. Preferred for remote or local files. Must start with 'https://.'"),
        textPrompt: z.string().describe("Nouns of target objects (English only, avoid adjectives). Use periods to separate multiple categories (e.g., 'person.car.traffic light')."),
        includeDescription: z.boolean().describe("Whether to return a description of the objects detected in the image, but will take longer to process."),
      },
      async (args) => {
        try {
          const { imageFileUri, textPrompt, includeDescription } = args;

          if (!imageFileUri || !textPrompt) {
            logEvent("mcp_tool_call_rejected", {
              tool_name: name,
              reason: "missing_image_or_text_prompt",
            });
            return {
              content: [
                {
                  type: 'text',
                  text: 'Image file URI and text prompt are required',
                },
              ],
            }
          }

          logEvent("mcp_tool_call_start", {
            tool_name: name,
            include_description: includeDescription,
            image_uri_scheme: this.getImageUriScheme(imageFileUri),
            text_prompt_length: textPrompt.length,
          });

          const { objects } = await this.getApiClient().detectObjectsByText(imageFileUri, textPrompt, includeDescription);

          const categories: ResultCategory = {};
          for (const object of objects) {
            if (!categories[object.category]) {
              categories[object.category] = [];
            }
            categories[object.category].push(object);
          }

          const objectsInfo = objects.map(obj => {
            const bbox = parseBbox(obj.bbox);
            return {
              name: obj.category,
              bbox,
              ...(includeDescription ? {
                description: obj.caption,
              } : {}),
            }
          });

          logEvent("mcp_tool_call_success", {
            tool_name: name,
            object_count: objectsInfo.length,
          });

          return {
            content: [
              {
                type: "text",
                text: `Objects detected in image: ${Object.keys(categories).map(cat =>
                  `${cat} (${categories[cat].length})`
                )?.join(', ')}.`
              },
              {
                type: "text",
                text: `Detailed object detection results: ${JSON.stringify((objectsInfo), null, 2)}`
              },
              {
                type: "text",
                text: `Note: The bbox coordinates are in {xmin, ymin, xmax, ymax} format, where the origin (0,0) is at the top-left corner of the image. These coordinates help determine the exact position and spatial relationships of objects in the image.`
              },
            ]
          };
        } catch (error) {
          logError("mcp_tool_call_error", error, {
            tool_name: name,
          });
          return {
            content: [
              {
                type: 'text',
                text: `Failed to detect objects from image: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      }
    )
  }

  private registerDetectAllObjectsTool(server: McpServer): void {
    const { name, description } = ToolConfigs[Tool.DETECT_ALL_OBJECTS];
    server.tool(
      name,
      description,
      {
        imageFileUri: z.string().describe("URI of the input image. Preferred for remote or local files. Must start with 'https://'."),
        includeDescription: z.boolean().describe("Whether to return a description of the objects detected in the image, but will take longer to process."),
      },
      async (args) => {
        try {
          const { imageFileUri, includeDescription } = args;

          if (!imageFileUri) {
            logEvent("mcp_tool_call_rejected", {
              tool_name: name,
              reason: "missing_image_uri",
            });
            return {
              content: [
                {
                  type: 'text',
                  text: 'Image file URI is required',
                },
              ],
            }
          }

          logEvent("mcp_tool_call_start", {
            tool_name: name,
            include_description: includeDescription,
            image_uri_scheme: this.getImageUriScheme(imageFileUri),
          });

          const { objects } = await this.getApiClient().detectAllObjects(imageFileUri, includeDescription);
          const categories: ResultCategory = {};

          for (const object of objects) {
            if (!categories[object.category]) {
              categories[object.category] = [];
            }
            categories[object.category].push(object);
          }

          const objectsInfo = objects.map(obj => {
            const bbox = parseBbox(obj.bbox);
            return {
              name: obj.category,
              bbox,
              ...(includeDescription ? {
                description: obj.caption,
              } : {}),
            }
          });

          logEvent("mcp_tool_call_success", {
            tool_name: name,
            object_count: objectsInfo.length,
          });

          return {
            content: [
              {
                type: "text",
                text: `Objects detected in image: ${Object.keys(categories).map(cat =>
                  `${cat} (${categories[cat].length})`
                )?.join(', ')}.`
              },
              {
                type: "text",
                text: `Detailed object detection results: ${JSON.stringify(objectsInfo, null, 2)}`
              },
              {
                type: "text",
                text: `Note: The bbox coordinates are in [xmin, ymin, xmax, ymax] format, where the origin (0,0) is at the top-left corner of the image. These coordinates help determine the exact position and spatial relationships of objects in the image.`
              },
            ]
          };
        } catch (error) {
          logError("mcp_tool_call_error", error, {
            tool_name: name,
          });
          return {
            content: [
              {
                type: 'text',
                text: `Failed to detect objects from image: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      }
    )
  }

  private registerDetectHumanPoseKeypointsTool(server: McpServer): void {
    const { name, description } = ToolConfigs[Tool.DETECT_HUMAN_POSE_KEYPOINTS];
    server.tool(
      name,
      description,
      {
        imageFileUri: z.string().describe("URI of the input image. Preferred for remote or local files. Must start with 'https://'."),
        includeDescription: z.boolean().describe("Whether to return a description of the objects detected in the image, but will take longer to process."),
      },
      async (args) => {
        try {
          const { imageFileUri, includeDescription } = args;

          if (!imageFileUri) {
            logEvent("mcp_tool_call_rejected", {
              tool_name: name,
              reason: "missing_image_uri",
            });
            return {
              content: [
                {
                  type: 'text',
                  text: 'Image file URI is required',
                },
              ],
            }
          }

          logEvent("mcp_tool_call_start", {
            tool_name: name,
            include_description: includeDescription,
            image_uri_scheme: this.getImageUriScheme(imageFileUri),
          });

          const { objects } = await this.getApiClient().detectHumanPoseKeypoints(imageFileUri, includeDescription);

          const categories: ResultCategory = {};
          for (const object of objects) {
            if (!categories[object.category]) {
              categories[object.category] = [];
            }
            categories[object.category].push(object);
          }

          const objectsInfo = objects.map(obj => {
            const bbox = parseBbox(obj.bbox);
            const pose = obj.pose ? parsePoseKeypoints(obj.pose) : undefined;

            return {
              name: obj.category,
              bbox,
              pose,
              ...(includeDescription ? {
                description: obj.caption,
              } : {}),
            }
          });

          logEvent("mcp_tool_call_success", {
            tool_name: name,
            object_count: objectsInfo.length,
          });

          return {
            content: [
              {
                type: "text",
                text: `${objectsInfo.length} human(s) detected in image.`
              },
              {
                type: "text",
                text: `Detailed human pose keypoints detection results: ${JSON.stringify((objectsInfo), null, 2)}`
              },
              {
                type: "text",
                text: `Note: The bbox coordinates are in {xmin, ymin, xmax, ymax} format, where the origin (0,0) is at the top-left corner of the image. The pose keypoints follow the same coordinate system, with visibility states (not visible, visible).`
              },
            ]
          };
        } catch (error) {
          logError("mcp_tool_call_error", error, {
            tool_name: name,
          });
          return {
            content: [
              {
                type: 'text',
                text: `Failed to detect human pose keypoints from image: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      }
    )
  }

  async start(): Promise<void> {
    console.error("Starting DINO-X MCP server on Streamable HTTP transport...");

    const app = express();
    app.set("trust proxy", true);

    app.use((req, res, next) => {
      const requestId = this.getRequestIdFromRequest(req);
      const startedAt = Date.now();
      let finished = false;

      runWithRequestLogContext({ requestId }, () => {
        logEvent("mcp_http_request_start", this.getHttpRequestLogFields(req));

        res.on("finish", () => {
          finished = true;
          logEvent("mcp_http_request_finish", {
            ...this.getHttpRequestLogFields(req),
            status_code: res.statusCode,
            duration_ms: Date.now() - startedAt,
            ...this.getJsonRpcSummary(req.body),
          });
        });

        res.on("close", () => {
          if (finished) {
            return;
          }

          logEvent("mcp_http_request_closed", {
            ...this.getHttpRequestLogFields(req),
            status_code: res.statusCode,
            duration_ms: Date.now() - startedAt,
            request_aborted: req.aborted,
            response_writable_ended: res.writableEnded,
          });
        });

        next();
      });
    });

    app.use(express.json());

    app.use((error: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (!error) {
        return next();
      }

      logError("mcp_http_body_parse_error", error, this.getHttpRequestLogFields(req));
      if (!res.headersSent) {
        return res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32700,
            message: "Parse error",
          },
          id: null,
        });
      }

      next(error);
    });

    const authToken = this.config.authToken;

    const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {

      if (this.config.enableClientKey) {
        try {
          const apiKey = this.getApiKeyFromRequest(req);
          const apiClient = this.createApiClient(apiKey);

          return this.validateAuthToken(req, res, authToken, () => {
            this.requestApiClients.run(apiClient, () => next());
          });
        } catch (apiKeyError) {
          logError("mcp_auth_failed", apiKeyError, {
            reason: "missing_or_invalid_api_key",
          });
          return res.status(401).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Unauthorized: Missing or invalid API key',
            },
            id: null,
          });
        }
      }

      return this.validateAuthToken(req, res, authToken, () => {
        if (this.defaultApi) {
          this.requestApiClients.run(this.defaultApi, () => next());
          return;
        }

        next();
      });
    };

    app.all('/mcp', authMiddleware, async (req, res) => {
      try {
        if (this.config.sseEnabled === false && this.isSseRequest(req)) {
          logEvent("mcp_sse_rejected", {
            reason: "sse_disabled",
            ...this.getHttpRequestLogFields(req),
          });

          res.status(405).json({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: "SSE is disabled for this MCP endpoint",
            },
            id: null,
          });
          return;
        }

        logEvent("mcp_rpc_request_start", {
          http_method: req.method,
          route_path: req.path,
          ...this.getJsonRpcSummary(req.body),
        });

        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined
        })
        const server = this.createMcpServer();

        await server.connect(transport);

        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        logError("mcp_rpc_request_error", error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: null,
          });
        }
      }
    });

    app.listen(this.config.port, () => {
      console.error(`DINO-X MCP Server running on http://localhost:${this.config.port}`);
      if (this.config.enableClientKey) {
        console.error(`API key is required at client side. Please provide via URL parameter (http://localhost:${this.config.port}?key=your-dinox-api-key)`);
      }
    });
  }

  private validateAuthToken(
    req: express.Request,
    res: express.Response,
    authToken: string | undefined,
    onAuthorized: () => void
  ): void | express.Response {
    // Handle auth token validation if configured
    if (!authToken) {
      onAuthorized();
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logEvent("mcp_auth_failed", {
        reason: "missing_authorization_header",
      });
      return res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Unauthorized: Missing or invalid Authorization header",
        },
        id: null,
      });
    }

    const token = authHeader.substring(7);
    if (token !== authToken) {
      logEvent("mcp_auth_failed", {
        reason: "invalid_token",
      });
      return res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Unauthorized: Invalid token",
        },
        id: null,
      });
    }

    onAuthorized();
  }
}
