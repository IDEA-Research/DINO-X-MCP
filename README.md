[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/idea-research-dino-x-mcp-badge.png)](https://mseep.ai/app/idea-research-dino-x-mcp)

# DINO-X MCP

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) [![npm version](https://img.shields.io/npm/v/@deepdataspace/dinox-mcp.svg)](https://www.npmjs.com/package/@deepdataspace/dinox-mcp) [![npm downloads](https://img.shields.io/npm/dm/@deepdataspace/dinox-mcp.svg)](https://www.npmjs.com/package/@deepdataspace/dinox-mcp) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/IDEA-Research/DINO-X-MCP/pulls) [![GitHub stars](https://img.shields.io/github/stars/IDEA-Research/DINO-X-MCP.svg)](https://github.com/IDEA-Research/DINO-X-MCP/stargazers)

**English** | [中文](README_ZH.md)

Enables large language models to perform fine-grained object detection and image understanding, powered by DINO-X and Grounding DINO 1.6 API.

<p align="center">
  <video width="800" controls>
    <source src="https://dds-frontend.oss-cn-shenzhen.aliyuncs.com/dinox-mcp/dinox-mcp-en-overveiw.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</p>

## 💡 Why DINO-X MCP?

Although multimodal models can understand and describe images, they often lack precise localization and high-quality structured outputs for visual content.

With DINO-X MCP, you can:

🧠 Achieve fine-grained image understanding — both full-scene recognition and targeted detection based on natural language.

🎯 Accurately obtain object count, position, and attributes, enabling tasks such as visual question answering.

🧩 Integrate with other MCP Servers to build multi-step visual workflows.

🛠️ Build natural language-driven visual agents for real-world automation scenarios.

## 🎬 Use Case
| 🎯 Scenario | 📝 Input | ✨ Output |
|---------|---------|---------|
| **Detection & Localization** | **💬 Prompt:**<br>`Detect and visualize the `<br>`fire areas in the forest `<br><br>**🖼️ Input Image:**<br>![1-1](https://github.com/user-attachments/assets/b5401c20-b7f2-4a8e-bc24-4eca54c48a92)| ![1-2](https://github.com/user-attachments/assets/8bc3c9fe-5a5a-4f10-af0a-552b797a00fc)|
| **Object Counting** | **💬 Prompt:**<br>`Please analyze this`<br>`warehouse image, detect`<br>`all the cardboard boxes,`<br>`count the total number`<br><br>**🖼️ Input Image:**<br>![2-1](https://github.com/user-attachments/assets/9d500523-4094-43fe-a6e5-5a714075dfd8)|  <img width="1276" alt="2-2" src="https://github.com/user-attachments/assets/3f18ef8c-5e89-45fc-bd0f-f23381304272" />|
| **Feature Detection** | **💬 Prompt:**<br>`Find all red cars`<br>`in the image`<br><br>**🖼️ Input Image:**<br>![4-1](https://github.com/user-attachments/assets/3a5b0776-a932-447f-bc81-42c0536381e8)|![4-2](https://github.com/user-attachments/assets/410c2120-8c86-4f90-9ce1-c34fb3b1781a)|
| **Attribute Reasoning** | **💬 Prompt:**<br>`Find the tallest person`<br>`in the image, describe`<br>`their clothing`<br><br>**🖼️ Input Image:**<br>![5-1](https://github.com/user-attachments/assets/9ba4b77e-6d00-4257-9bdb-079a53ce4ca4) | ![5-2](https://github.com/user-attachments/assets/ef0ce3e1-1dd2-4bd7-a145-e1623c297911) |
| **Full Scene Detection** | **💬 Prompt:**<br>`Find the fruit with`<br>`the highest vitamin C`<br>`content in the image`<br><br>**🖼️ Input Image:**<br>![6-1](https://github.com/user-attachments/assets/9cf9f475-6015-47d0-917e-5004a104d777)| ![6-3](https://github.com/user-attachments/assets/17466bc2-4b9a-4a74-9456-05c253b0b388)<br><br>*Answer: Kiwi fruit (93mg/100g)* |
| **Pose Analysis** | **💬 Prompt:**<br>`Please analyze what`<br>`yoga pose this is`<br><br>**🖼️ Input Image:**<br>![3-1](https://github.com/user-attachments/assets/2b2a6b5a-939b-4c37-8f40-900ae921b07a) |![3-3](https://github.com/user-attachments/assets/41636813-aaf7-4ad0-a5c3-1a5cbe67c022)|


## 🚀 Quick Start

### 1. Prerequisites

You can install Node.js using one of the following methods:

#### Option A: Command 👍

```bash
# For MacOS or Linux
# 1. Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# OR
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# 2. Add these lines to your profile (~/.bash_profile, ~/.zshrc, ~/.profile, or ~/.bashrc)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  

# 3. Activate nvm in current shell
source ~/.bashrc
# Or
source ~/.zshrc   

# 4. Verify nvm installation
command -v nvm

# 5. Install and use LTS version of Node.js
nvm install --lts
nvm use --lts

# For Windows
winget install OpenJS.NodeJS.LTS
# Or using PowerShell (Administrator)
iwr -useb https://raw.githubusercontent.com/chocolatey/chocolatey/master/chocolateyInstall/InstallChocolatey.ps1 | iex
choco install nodejs-lts -y
```

#### Option B: Manual Installation

Download the installer from [nodejs.org](https://nodejs.org/)

Also, choose an AI assistants and applications that support the MCP Client, including but not limited to:

- [Cursor](https://www.cursor.com/)
- [WindSurf](https://windsurf.com/)
- [Trae](https://www.trae.ai/)
- [Cherry Studio](https://www.cherry-ai.com/)

### 2. Configure MCP Sever

You can use DINO-X MCP server in two ways:

#### Option A: Using NPM Package 👍

Add the following configuration in your MCP client:

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

#### Option B: Using Local Project

First, clone and build the project:

```bash
# Clone the project
git clone https://github.com/IDEA-Research/DINO-X-MCP.git
cd DINO-X-MCP

# Install dependencies
pnpm install

# Build the project
pnpm run build
```

Then configure your MCP client:

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

### 3. Get API Key

Get your API key from [DINO-X Platform](https://cloud.deepdataspace.com/request_api) (A free quota is available for new users).

Replace `your-api-key-here` in the configuration above with your actual API key.

### 4. Environment Variables

The DINO-X MCP server supports the following environment variables:

| Variable Name | Description | Required | Default Value | Example |
|---------------|-------------|----------|---------------|---------|
| `DINOX_API_KEY` | Your DINO-X API key for authentication | **Required** | - | `your-api-key-here` |
| `IMAGE_STORAGE_DIRECTORY` | Directory where generated visualization images will be saved | Optional | **macOS/Linux:** `/tmp/dinox-mcp`<br>**Windows:** `%TEMP%\dinox-mcp` | `/Users/admin/Downloads/dinox-images` |


### 5. Available Tools

Restart your MCP client, and you should be able to use the following tools:

| Method Name                   | Description                                                                   | Input               | Output                          |
| ----------------------------- | ----------------------------------------------------------------------------- | ------------------- | -------------------------------- |
| `detect-all-objects`          | Detects and localizes all recognizable objects in an image.                   | Image               | Category names + bounding boxes + captions |
| `object-detection-by-text`    | Detects and localizes objects in an image based on a natural language prompt. | Image + Text prompt | Bounding boxes + object captions |
| `detect-human-pose-keypoints` | Detects 17 human body keypoints per person in an image for pose estimation.   | Image               | Keypoint coordinates and captions  |
| `visualize-detections`        | Visualizes detection results by drawing bounding boxes and labels on the image. | Image + Detection results | Annotated image saved to storage directory |


## 📝 Usage

### Supported Image Formats

- Remote URLs starting with `https://` 👍
- Local file paths (starting with `file://`)
- Common image formats: `jpg, jpeg, png, webp`

### API Docs

Please refer to [DINO-X Platform](https://cloud.deepdataspace.com/docs) for API usage limits and pricing information.


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

## License

Apache License 2.0
