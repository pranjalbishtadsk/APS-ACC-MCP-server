# aps-mcp-server-nodejs

Simple [Model Context Protocol](https://modelcontextprotocol.io) server built with Node.js, providing access to [Autodesk Platform Services](https://aps.autodesk.com) API, with fine-grained access control using [Secure Service Accounts](https://aps.autodesk.com/en/docs/ssa/v1/developers_guide/overview/).

![Screenshot](screenshot.png)

[YouTube Video](https://youtu.be/6DRSR9HlIds)

## Overview

This MCP server enables AI assistants (like GitHub Copilot, Claude, and Cursor) to interact with your Autodesk Construction Cloud (ACC) projects through natural language. By connecting AI chat interfaces to APS APIs, you can query project data, browse files, and analyze issues without leaving your development environment.

### How It Works

The Model Context Protocol (MCP) creates a standardized way for AI assistants to access external data sources:

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   VS Code +     │  MCP    │  aps-mcp-server  │   APS   │  Autodesk ACC   │
│ GitHub Copilot  │ ◄─────► │   (Node.js)      │ ◄─────► │   Projects      │
└─────────────────┘  stdio  └──────────────────┘   API   └─────────────────┘
```

1. **AI Client** (VS Code/Claude/Cursor) sends natural language queries
2. **MCP Server** translates queries into APS API calls using Secure Service Account credentials
3. **APS APIs** fetch data from your ACC projects
4. **MCP Server** returns structured data to the AI client
5. **AI Client** formats and presents the information to you

### Available MCP Tools

This server provides 4 tools that AI assistants can use:

| Tool | Description | Parameters | Returns |
|------|-------------|------------|---------|
| **getProjectsTool** | Retrieves all ACC accounts and projects accessible to your service account | None | List of accounts with nested projects (IDs and names) |
| **getFolderContentsTool** | Browses folder and file structure within a project | `accountId`, `projectId`, `folderId` (optional) | List of folders and files with IDs and display names |
| **getIssuesTool** | Fetches all issues from a project | `projectId` | List of issues with IDs, titles, statuses, types, assignments, due dates, and 3D coordinates |
| **getIssueTypesTool** | Gets available issue types and subtypes | `projectId` | List of issue types with subtypes (for issue classification) |

### VS Code MCP Client Integration

When you use this server with **VS Code + GitHub Copilot**:

1. **Configuration**: The `.vscode/mcp.json` file tells VS Code where to find the MCP server
2. **Connection**: VS Code starts the Node.js server and connects via stdio (standard input/output)
3. **Authentication**: The server uses Secure Service Account credentials from `.env` for API access
4. **Tool Discovery**: Copilot learns what tools are available from the server
5. **Natural Queries**: You ask questions in Copilot Chat using plain English
6. **Tool Execution**: Copilot decides which tools to call and with what parameters
7. **Response**: Results are formatted and displayed in the chat interface

**Example interaction:**
```
You: "What projects do I have access to?"
Copilot: [calls getProjectsTool] → "You have 1 project: Construction: Sample Project..."

You: "List all issues"
Copilot: [calls getIssuesTool with projectId] → "You have 2 open issues..."
```

### Comparison with ACC Native Features

| Feature | ACC Web Interface | ACC Project Beta | APS MCP Server |
|---------|-------------------|------------------|----------------|
| **Access Method** | Web browser | Web browser | AI chat in IDE |
| **Query Interface** | GUI navigation | Conversational AI | Conversational AI |
| **Integration** | Standalone app | Standalone app | Embedded in VS Code/Claude/Cursor |
| **Authentication** | User login | User login | Service Account (programmatic) |
| **Data Access** | Full ACC features | Limited to conversation context | API-based (read access) |
| **Customization** | Fixed UI | Fixed AI behavior | Custom tools & scripts |
| **Use Case** | Manual project management | Quick queries & assistance | Developer workflows & automation |
| **Multi-Project** | Switch between projects | Context limited | Access all authorized projects |
| **Offline Mode** | ❌ No | ❌ No | ❌ No (requires API) |
| **File Upload** | ✅ Yes | ✅ Yes | ❌ No (read-only) |
| **Issue Creation** | ✅ Yes | ✅ Yes | ❌ No (not implemented yet) |
| **Real-time Collaboration** | ✅ Yes | Limited | ❌ No |

**Key Differences:**

- **ACC Project Beta**: Autodesk's native AI assistant integrated into the ACC web interface, designed for project managers and teams working directly in ACC
- **APS MCP Server**: Developer-focused tool that brings ACC data into your coding environment, ideal for:
  - Building automation scripts
  - Creating custom reports
  - Integrating ACC data with other systems
  - Quick project status checks without leaving your IDE
  - Prototyping new ACC integrations

**When to use each:**
- Use **ACC Web Interface** for full project management, file uploads, and team collaboration
- Use **ACC Project Beta** for quick questions while working in ACC web
- Use **APS MCP Server** for development workflows, custom automation, and IDE-native queries

## Development

### Prerequisites

- [Node.js](https://nodejs.org)
- [APS application](https://aps.autodesk.com/en/docs/oauth/v2/tutorials/create-app) (must be of type _Server-to-Server_)
- [Provisioned access to ACC](https://get-started.aps.autodesk.com/#provision-access-in-other-products)

### Setup

#### Secure Service Account

Our MCP server will need a secure service account and a private key. Instead of implementing the logic in this code sample, we will use https://ssa-manager.autodesk.io:

- Go to https://ssa-manager.autodesk.io, and log in with your APS client ID and secret
- Create a new secure service account using the _Create Account With Name:_ button; don't forget to specify the first name and last name
- Make sure the new account is selected in the _Accounts_ list
- Make note of the `serviceAccountId` and `email` values under _Account Details_
- Create a new private key using the _Create Key_ button; a _*.pem_ file will be automatically downloaded to your machine
- Make sure the new private key is selected in the _Keys_ list
- Make note of the `kid` value under _Key Details_

#### Autodesk Construction Cloud

- Make sure you've provisioned access to ACC for your APS application
- Invite the secure service account (the `email` value from earlier) as a new member to your selected ACC projects

#### Server

- Clone this repository
- Install dependencies: `yarn install`
- Create a _.env_ file in the root folder of this project, and define the following environment variables:
  - `APS_CLIENT_ID` - your APS application client ID
  - `APS_CLIENT_SECRET` - your APS application client secret
  - `SSA_ID` -  your service account ID (the `serviceAccountId` field from earlier)
  - `SSA_KEY_ID` - your private key ID (the `kid` field from earlier)
  - `SSA_KEY_PATH` - full path to your downloaded *.pem file
- The _.env_ file might look something like this:

```bash
APS_CLIENT_ID="AhH9..."
APS_CLIENT_SECRET="1FS4..."
SSA_ID="ZCU2TJH5PK8A5KQ9"
SSA_KEY_ID="8a4ee790-3378-44f3-bbab-5acb35ec35ce"
SSA_KEY_PATH="/Users/brozp/aps-mcp-server-nodejs/8a4ee790-3378-44f3-bbab-5acb35ec35ce.pem"
```

## Usage

### MCP Inspector

- Run the [Model Context Protocol Inspector](https://modelcontextprotocol.io/docs/tools/inspector): `npx @modelcontextprotocol/inspector`
- Hit `Connect` to connect to the MCP server

### Claude Desktop

- Make sure you have [Claude Desktop](https://claude.ai/download) installed
- Create a Claude Desktop config file if you don't have one yet:
  - On macOS: _~/Library/Application Support/Claude/claude\_desktop\_config.json_
  - On Windows: _%APPDATA%\Claude\claude\_desktop\_config.json_
- Add this MCP server to the config, using the absolute path of the _server.js_ file on your system, for example:

```json
{
    "mcpServers": {
        "aps-mcp-server-nodejs": {
            "command": "node",
            "args": [
                "/path/to/aps-mcp-server-nodejs/server.js"
            ]
        }
    }
}
```

- Open Claude Desktop, and try some of the following test prompt:
  - What ACC projects do I have access to?
  - Give me a visual dashboard of all issues in project XYZ

> For more details on how to add MCP servers to Claude Desktop, see the [official documentation](https://modelcontextprotocol.io/quickstart/user).

### Visual Studio Code & GitHub Copilot

- Make sure you have [enabled MCP servers in Visual Studio Code](https://code.visualstudio.com/docs/copilot/chat/mcp-servers#_enable-mcp-support-in-vs-code)
- Create _.vscode/mcp.json_ file in your workspace, and add the following JSON to it:

```json
{
    "servers": {
        "aps-mcp-server-nodejs": {
            "type": "stdio",
            "command": "node",
            "args": [
                "/path/to/aps-mcp-server-nodejs/server.js"
            ]
        }
    }
}
```

> For more details on how to add MCP servers to Visual Studio Code, see the [documentation](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)

### Cursor

- Create _.cursor/mcp.json_ file in your workspace, and add the following JSON to it:

```json
{
  "mcpServers": {
    "aps-mcp-server-nodejs": {
      "command": "node",
      "args": [
        "/path/to/aps-mcp-server-nodejs/server.js"
      ]
    }
  }
}
```

> For more details on how to add MCP servers to Cursor, see the [documentation](https://docs.cursor.com/context/model-context-protocol)
