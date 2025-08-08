[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/idea-research-dino-x-mcp-badge.png)](https://mseep.ai/app/idea-research-dino-x-mcp)

# DINO-X MCP

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) [![npm version](https://img.shields.io/npm/v/@deepdataspace/dinox-mcp.svg)](https://www.npmjs.com/package/@deepdataspace/dinox-mcp) [![npm downloads](https://img.shields.io/npm/dm/@deepdataspace/dinox-mcp.svg)](https://www.npmjs.com/package/@deepdataspace/dinox-mcp) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/IDEA-Research/DINO-X-MCP/pulls) [![MCP Badge](https://lobehub.com/badge/mcp/idea-research-dino-x-mcp)](https://lobehub.com/mcp/idea-research-dino-x-mcp) [![GitHub stars](https://img.shields.io/github/stars/IDEA-Research/DINO-X-MCP.svg)](https://github.com/IDEA-Research/DINO-X-MCP/stargazers)

**English** | [中文](README_ZH.md)

DINO-X Official MCP Server — powered by the DINO-X and Grounding DINO models — brings fine-grained object detection and image understanding to your multimodal applications.

<p align="center">
  <video width="800" controls>
    <source src="https://dds-frontend.oss-cn-shenzhen.aliyuncs.com/dinox-mcp/dinox-mcp-en-overveiw.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</p>

## Why DINO-X MCP?

With DINO-X MCP, you can:

- Fine-Grained Understanding: Full image detection, object detection, and region-level descriptions.

- Structured Outputs: Get object categories, counts, locations, and attributes for VQA and multi-step reasoning tasks.

- Composable: Works seamlessly with other MCP servers to build end-to-end visual agents or automation pipelines.

## Transport Modes

DINO-X MCP supports two transport modes:

| Feature | STDIO (default) | Streamable HTTP |
|:--|:--|:--|
| Runtime | Local | Local or Cloud |
| Transport | Standard I/O | HTTP (streaming responses) |
| Input source | `file://` and `https://` | `https://` only |
| Visualization | Supported (saves annotated images locally) | Not supported (for now) |

## Quick Start

### 1. Prepare an MCP client

Any MCP-compatible client works, e.g.:

- [Cursor](https://www.cursor.com/)
- [WindSurf](https://windsurf.com/)
- [Trae](https://www.trae.ai/)
- [Cherry Studio](https://www.cherry-ai.com/)

### 2. Get your API key

Apply on the DINO-X platform: [Request API Key](https://cloud.deepdataspace.com/request_api) (new users get free quota).

### 3. Configure MCP

#### Option A: Official Hosted Streamable HTTP (Recommended)

Add to your MCP client config and replace with your API key:

```json
{
  "mcpServers": {
    "dinox-mcp": {
      "url": "https://mcp.deepdataspace.com/mcp?key=your-api-key"
    }
  }
}
```

#### Option B: Use the NPM package locally (STDIO)

Install Node.js first 

- Download the installer from [nodejs.org](https://nodejs.org/)

- Or use command:

```bash
# macOS / Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# or
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# load nvm into current shell (choose the one you use)
source ~/.bashrc || true
source ~/.zshrc  || true

# install and use LTS Node.js
nvm install --lts
nvm use --lts

# Windows (one of the following)
winget install OpenJS.NodeJS.LTS
# or with Chocolatey (in admin PowerShell)
iwr -useb https://raw.githubusercontent.com/chocolatey/chocolatey/master/chocolateyInstall/InstallChocolatey.ps1 | iex
choco install nodejs-lts -y
```

Configure your MCP client:

```json
{
  "mcpServers": {
    "dinox-mcp": {
      "command": "npx",
      "args": ["-y", "@deepdataspace/dinox-mcp"],
      "env": {
        "DINOX_API_KEY": "your-api-key-here",
        "IMAGE_STORAGE_DIRECTORY": "/path/to/your/image/directory"
      }
    }
  }
}
```
Note: Replace `your-api-key-here` with your real key.

#### Option C: Run from source locally

Make sure Node.js is installed (see Option B), then:

```bash
# clone
git clone https://github.com/IDEA-Research/DINO-X-MCP.git
cd DINO-X-MCP

# install deps
npm install

# build
npm run build
```

Configure your MCP client:

```json
{
  "mcpServers": {
    "dinox-mcp": {
      "command": "node",
      "args": ["/path/to/DINO-X-MCP/build/index.js"],
      "env": {
        "DINOX_API_KEY": "your-api-key-here",
        "IMAGE_STORAGE_DIRECTORY": "/path/to/your/image/directory"
      }
    }
  }
}
```

## CLI Flags & Environment Variables

- Common flags
  - `--http`: start in Streamable HTTP mode (otherwise STDIO by default)
  - `--stdio`: force STDIO mode
  - `--dinox-api-key=...`: set API key
  - `--enable-client-key`: allow API key via URL `?key=` (Streamable HTTP only)
  - `--port=8080`: HTTP port (default 3020)

- Environment variables
  - `DINOX_API_KEY` (required/conditionally required): DINO-X platform API key
  - `IMAGE_STORAGE_DIRECTORY` (optional, STDIO): directory to save annotated images
  - `AUTH_TOKEN` (optional, HTTP): if set, client must send `Authorization: Bearer <token>`

  Examples:

```bash
# STDIO (local)
node build/index.js --dinox-api-key=your-api-key

# Streamable HTTP (server provides a shared API key)
node build/index.js --http --dinox-api-key=your-api-key

# Streamable HTTP (custom port)
node build/index.js --http --dinox-api-key=your-api-key --port=8080

# Streamable HTTP (require client-provided API key via URL)
node build/index.js --http --enable-client-key
```


Client config when using `?key=`:

```json
{
  "mcpServers": {
    "dinox-mcp": {
      "url": "http://localhost:3020/mcp?key=your-api-key"
    }
  }
}
```

Using `AUTH_TOKEN` with a gateway that injects `Authorization: Bearer <token>`:

```bash
AUTH_TOKEN=my-token node build/index.js --http --enable-client-key
```

Client example with `supergateway`:

```json
{
  "mcpServers": {
    "dinox-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "supergateway",
        "--streamableHttp",
        "http://localhost:3020/mcp?key=your-api-key",
        "--oauth2Bearer",
        "my-token"
      ]
    }
  }
}
```

## Tools 

| Capability | Tool ID | Transport | Input | Output |
|:--|:--|:--|:--|:--|
| Full-scene object detection | `detect-all-objects` | STDIO / HTTP | Image URL | Category + bbox + (optional) captions |
| Text-prompted object detection | `detect-objects-by-text` | STDIO / HTTP | Image URL + English nouns (dot-separated for multiple, e.g., `person.car`) | Target object bbox + (optional) captions |
| Human pose estimation | `detect-human-pose-keypoints` | STDIO / HTTP | Image URL | 17 keypoints + bbox + (optional) captions |
| Visualization | `visualize-detection-result` | STDIO only | Image URL + detection results array | Local path to annotated image |


## 🎬 Use Cases
| 🎯 Scenario | 📝 Input | ✨ Output |
|---------|---------|---------|
| **Detection & Localization** | **💬 Prompt:**<br>`Detect and visualize the `<br>`fire areas in the forest `<br><br>**🖼️ Input Image:**<br>![1-1](https://github.com/user-attachments/assets/b5401c20-b7f2-4a8e-bc24-4eca54c48a92)| ![1-2](https://github.com/user-attachments/assets/8bc3c9fe-5a5a-4f10-af0a-552b797a00fc)|
| **Object Counting** | **💬 Prompt:**<br>`Please analyze this`<br>`warehouse image, detect`<br>`all the cardboard boxes,`<br>`count the total number`<br><br>**🖼️ Input Image:**<br>![2-1](https://github.com/user-attachments/assets/9d500523-4094-43fe-a6e5-5a714075dfd8)|  <img width="1276" alt="2-2" src="https://github.com/user-attachments/assets/3f18ef8c-5e89-45fc-bd0f-f23381304272" />|
| **Feature Detection** | **💬 Prompt:**<br>`Find all red cars`<br>`in the image`<br><br>**🖼️ Input Image:**<br>![4-1](https://github.com/user-attachments/assets/3a5b0776-a932-447f-bc81-42c0536381e8)|![4-2](https://github.com/user-attachments/assets/410c2120-8c86-4f90-9ce1-c34fb3b1781a)|
| **Attribute Reasoning** | **💬 Prompt:**<br>`Find the tallest person`<br>`in the image, describe`<br>`their clothing`<br><br>**🖼️ Input Image:**<br>![5-1](https://github.com/user-attachments/assets/9ba4b77e-6d00-4257-9bdb-079a53ce4ca4) | ![5-2](https://github.com/user-attachments/assets/ef0ce3e1-1dd2-4bd7-a145-e1623c297911) |
| **Full Scene Detection** | **💬 Prompt:**<br>`Find the fruit with`<br>`the highest vitamin C`<br>`content in the image`<br><br>**🖼️ Input Image:**<br>![6-1](https://github.com/user-attachments/assets/9cf9f475-6015-47d0-917e-5004a104d777)| ![6-3](https://github.com/user-attachments/assets/17466bc2-4b9a-4a74-9456-05c253b0b388)<br><br>*Answer: Kiwi fruit (93mg/100g)* |
| **Pose Analysis** | **💬 Prompt:**<br>`Please analyze what`<br>`yoga pose this is`<br><br>**🖼️ Input Image:**<br>![3-1](https://github.com/user-attachments/assets/2b2a6b5a-939b-4c37-8f40-900ae921b07a) |![3-3](https://github.com/user-attachments/assets/41636813-aaf7-4ad0-a5c3-1a5cbe67c022)|


## FAQ

- Supported image sources?
  - STDIO: `file://` and `https://`
  - Streamable HTTP: `https://` only
- Supported image formats?
  - jpg, jpeg, webp, png

## Development & Debugging

Use watch mode to auto-rebuild during development:

```bash
npm run watch
```

Use MCP Inspector for debugging:

```bash
npm run inspector
```

## License

Apache License 2.0