# DINO-X MCP

<p align="center">

Official DINO-X Model Context Protocol (MCP) server that empowers LLMs with real-world visual perception through image object detection, localization, and captioning APIs. This server allows MCP clients like <a href="https://www.cursor.so">Cursor</a>, <a href="https://codeium.com/windsurf">Windsurf</a>, <a href="https://github.com/openai/openai-agents-python">OpenAI Agents</a> and others to detect objects, analyze scenes, generate descriptions and more.
</p>

## 🚀 Quick Start

### 1. Get API Key

Get your API key from [DINO-X Platform](https://cloud.deepdataspace.com/request_api).

### 2. Clone and Build Project

```bash
# Clone the project
git clone https://github.com/IDEA-Research/DINO-X-MCP.git
cd DINO-X—MCP

# Install dependencies
pnpm install

# Build the project
pnpm run build
```

### 3. Configure MCP Client

After building, you need to configure the server in your MCP client. Here are configuration methods for different clients:

#### Cursor

Add the following configuration in Cursor's MCP settings:

```json
{
  "mcpServers": {
    "dinox": {
      "command": "node",
      "args": ["/path/to/mcp-server-dinox/build/index.js"],
      "env": {
        "DINOX_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

#### Other MCP Clients

For other MCP-compatible clients, refer to their documentation to add server configuration with the following parameters:

- **Command**: `node`
- **Arguments**: `["/path/to/mcp-server-dinox/build/index.js"]`
- **Environment Variable**: `DINOX_API_KEY=your-api-key-here`

### 4. Available Tools

Restart your MCP client, and you should be able to use the following tools:

- `object-detection-by-text`: Detect and locate specific objects in images based on text prompts
- `detect-all-objects`: Detect and locate all identifiable objects in images

## 🛠️ Development

### Watch Mode

During development, you can use watch mode for automatic rebuilding:

```bash
pnpm run watch
```

### Debugging

Use MCP Inspector to debug the server:

```bash
pnpm run inspector
```

## 📝 Usage

### Supported Image Formats

- Local file paths (starting with `file://`)
- Remote URLs (starting with `https://`)
- Common image formats: JPG, JPEG, PNG, WebP.

### API Limitations

Please refer to [DINO-X Platform](https://cloud.deepdataspace.com/docs) for API usage limits and pricing information.

## License

Apache License 2.0
