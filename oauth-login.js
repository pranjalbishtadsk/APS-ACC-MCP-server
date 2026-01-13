import http from "node:http";
import { threeLeggedAuthProvider } from "./utils.js";
import { OAUTH_CALLBACK_URL } from "./config.js";

// Simple OAuth login flow
async function startOAuthFlow() {
    if (!threeLeggedAuthProvider) {
        console.error("❌ OAuth credentials not configured. Please set OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, and OAUTH_CALLBACK_URL in .env file.");
        process.exit(1);
    }

    console.log("\n🔐 Starting 3-Legged OAuth Authentication for Photos API\n");

    // Extract port from callback URL
    const callbackUrl = new URL(OAUTH_CALLBACK_URL);
    const port = callbackUrl.port || 3000;

    // Create simple HTTP server to handle OAuth callback
    const server = http.createServer(async (req, res) => {
        const url = new URL(req.url, `http://localhost:${port}`);

        if (url.pathname === "/callback") {
            const code = url.searchParams.get("code");
            const error = url.searchParams.get("error");

            if (error) {
                res.writeHead(400, { "Content-Type": "text/html" });
                res.end(`
                    <html>
                        <body style="font-family: Arial, sans-serif; padding: 50px; text-align: center;">
                            <h1 style="color: #d32f2f;">❌ Authentication Failed</h1>
                            <p>Error: ${error}</p>
                            <p>You can close this window.</p>
                        </body>
                    </html>
                `);
                console.error(`\n❌ Authentication failed: ${error}`);
                setTimeout(() => {
                    server.close();
                    process.exit(1);
                }, 2000);
                return;
            }

            if (!code) {
                res.writeHead(400, { "Content-Type": "text/html" });
                res.end(`
                    <html>
                        <body style="font-family: Arial, sans-serif; padding: 50px; text-align: center;">
                            <h1 style="color: #d32f2f;">❌ No Authorization Code</h1>
                            <p>No authorization code received from Autodesk.</p>
                            <p>You can close this window.</p>
                        </body>
                    </html>
                `);
                console.error("\n❌ No authorization code received");
                setTimeout(() => {
                    server.close();
                    process.exit(1);
                }, 2000);
                return;
            }

            try {
                console.log("📝 Exchanging authorization code for access token...");
                const tokenData = await threeLeggedAuthProvider.exchangeCodeForToken(code);

                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(`
                    <html>
                        <body style="font-family: Arial, sans-serif; padding: 50px; text-align: center;">
                            <h1 style="color: #4caf50;">✅ Authentication Successful!</h1>
                            <p>You have successfully authenticated with Autodesk.</p>
                            <p><strong>Access token expires in:</strong> ${Math.floor(tokenData.expires_in / 60)} minutes</p>
                            <p>You can now close this window and use the Photos API tools.</p>
                        </body>
                    </html>
                `);

                console.log("\n✅ Authentication successful!");
                console.log(`   Access Token: ${tokenData.access_token.substring(0, 20)}...`);
                console.log(`   Expires In: ${Math.floor(tokenData.expires_in / 60)} minutes`);
                console.log("\n✨ You can now use the Photos API tools!\n");

                setTimeout(() => {
                    server.close();
                    console.log("Server closed. OAuth tokens are stored in memory.");
                    console.log("Note: Tokens will be lost when the MCP server restarts.");
                    console.log("For persistent storage, consider implementing token caching.\n");
                }, 2000);
            } catch (error) {
                res.writeHead(500, { "Content-Type": "text/html" });
                res.end(`
                    <html>
                        <body style="font-family: Arial, sans-serif; padding: 50px; text-align: center;">
                            <h1 style="color: #d32f2f;">❌ Token Exchange Failed</h1>
                            <p>${error.message}</p>
                            <p>You can close this window.</p>
                        </body>
                    </html>
                `);
                console.error(`\n❌ Token exchange failed: ${error.message}`);
                setTimeout(() => {
                    server.close();
                    process.exit(1);
                }, 2000);
            }
        } else {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not Found");
        }
    });

    server.listen(port, () => {
        const authUrl = threeLeggedAuthProvider.getAuthorizationUrl();
        console.log(`📡 OAuth callback server started on http://localhost:${port}`);
        console.log("\n🌐 Please open the following URL in your browser to authenticate:\n");
        console.log(`   ${authUrl}\n`);
        console.log("Waiting for authentication...\n");
    });

    server.on("error", (error) => {
        console.error(`\n❌ Server error: ${error.message}`);
        if (error.code === "EADDRINUSE") {
            console.error(`   Port ${port} is already in use. Please stop other services using this port or change OAUTH_CALLBACK_URL in .env`);
        }
        process.exit(1);
    });
}

// Run OAuth flow
startOAuthFlow().catch((error) => {
    console.error(`\n❌ OAuth flow error: ${error.message}`);
    process.exit(1);
});
