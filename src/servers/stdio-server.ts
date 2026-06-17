import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DinoXApiClient } from "../dino-x/client.js";
import { BASE_URL, DEFAULT_TIMEOUT, Tool, ToolConfigs } from "../constants/tool.js";
import { z } from 'zod';
import { getDefaultImageStorageDirectory, parseBbox, parsePoseKeypoints, visualizeDetections } from "../utils/index.js";
import { Config, ResultCategory } from "../types/index.js";

/**
 * MCP Server class for managing DINO-X MCP server configuration and functionality
 * Specifically designed for STDIO transport mode
 */
export class MCPStdioServer {
  private server!: McpServer;
  private config!: Config;
  private api!: DinoXApiClient;

  constructor(customConfig: Config) {
    this.config = customConfig;

    this.api = new DinoXApiClient({
      apiKey: this.config.apiKey!,
      baseUrl: BASE_URL,
      timeout: DEFAULT_TIMEOUT,
      clientSource: this.config.clientSource,
    });

    this.server = new McpServer({
      name: 'dinox-mcp-server',
      version: '1.0.0',
    });

    this.registerTools();
  }

  private registerTools(): void {
    this.registerDetectByTextTool();
    this.registerDetectAllObjectsTool();
    this.registerDetectHumanPoseKeypointsTool();
    this.registerVisualizeDetectionResultTool();
  }

  private registerDetectByTextTool(): void {
    const { name, description } = ToolConfigs[Tool.DETECT_BY_TEXT];
    this.server.tool(
      name,
      description,
      {
        imageFileUri: z.string().describe("URI of the input image. Preferred for remote or local files. Must start with 'https://' or 'file://'."),
        textPrompt: z.string().describe("Nouns of target objects (English only, avoid adjectives). Use periods to separate multiple categories (e.g., 'person.car.traffic light')."),
        includeDescription: z.boolean().describe("Whether to return a description of the objects detected in the image, but will take longer to process."),
      },
      async (args) => {
        try {
          const { imageFileUri, textPrompt, includeDescription } = args;

          if (!imageFileUri || !textPrompt) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Image file URI and text prompt are required',
                },
              ],
            }
          }

          const { objects } = await this.api.detectObjectsByText(imageFileUri, textPrompt, includeDescription);

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

  private registerDetectAllObjectsTool(): void {
    const { name, description } = ToolConfigs[Tool.DETECT_ALL_OBJECTS];
    this.server.tool(
      name,
      description,
      {
        imageFileUri: z.string().describe("URI of the input image. Preferred for remote or local files. Must start with 'https://' or 'file://'."),
        includeDescription: z.boolean().describe("Whether to return a description of the objects detected in the image, but will take longer to process."),
      },
      async (args) => {
        try {
          const { imageFileUri, includeDescription } = args;

          if (!imageFileUri) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Image file URI is required',
                },
              ],
            }
          }

          const { objects } = await this.api.detectAllObjects(imageFileUri, includeDescription);
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

  private registerDetectHumanPoseKeypointsTool(): void {
    const { name, description } = ToolConfigs[Tool.DETECT_HUMAN_POSE_KEYPOINTS];
    this.server.tool(
      name,
      description,
      {
        imageFileUri: z.string().describe("URI of the input image. Preferred for remote or local files. Must start with 'https://' or 'file://'."),
        includeDescription: z.boolean().describe("Whether to return a description of the objects detected in the image, but will take longer to process."),
      },
      async (args) => {
        try {
          const { imageFileUri, includeDescription } = args;

          if (!imageFileUri) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Image file URI is required',
                },
              ],
            }
          }

          const { objects } = await this.api.detectHumanPoseKeypoints(imageFileUri, includeDescription);

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

  private registerVisualizeDetectionResultTool(): void {
    const { name, description } = ToolConfigs[Tool.VISUALIZE_DETECTION_RESULT];
    this.server.tool(
      name,
      description,
      {
        imageFileUri: z.string().describe("URI of the input image. Preferred for remote or local files. Must start with 'https://' or 'file://'."),
        detections: z.array(z.object({
          name: z.string().describe("Object category name"),
          bbox: z.object({
            xmin: z.number(),
            ymin: z.number(),
            xmax: z.number(),
            ymax: z.number()
          }).describe("Bounding box coordinates")
        })).describe("Array of detection results with name and bbox information."),
        fontSize: z.number().optional().describe("Font size for labels (default: 24)"),
        boxThickness: z.number().optional().describe("Thickness of bounding box lines (default: 4)"),
        showLabels: z.boolean().optional().describe("Whether to show category labels (default: true)")
      },
      async (args) => {
        try {
          const { imageFileUri, detections, fontSize, boxThickness, showLabels } = args;

          if (!imageFileUri || !detections || !Array.isArray(detections)) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Image file URI and detections array are required',
                },
              ],
            };
          }

          const visualizedImagePath = await visualizeDetections(
            imageFileUri,
            detections, 
            {
              fontSize,
              boxThickness,
              showLabels
            },
            this.config.imageStorageDirectory || getDefaultImageStorageDirectory()
          );

          return {
            content: [
              {
                type: "text",
                text: `Visualization saved to: ${visualizedImagePath}`
              },
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to visualize detections: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      }
    )
  }

  /**
   * Start the server using stdio transport
   */
  async start(): Promise<void> {
    console.error("Starting DINO-X MCP server on STDIO transport...");
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("DINO-X MCP server running on STDIO transport.");
  }
}
