# 3-Legged OAuth Setup for Photos API

The Photos API requires **3-legged OAuth authentication** (user context) instead of Service Account authentication. This guide will help you set it up.

## Prerequisites

1. **APS Application with 3-Legged OAuth**
   - Application Type: "Traditional Web App"
   - Callback URL: `http://localhost:3000/callback`
   - API Access: Enable "ACC Photos API"

2. **OAuth Credentials in .env**
   - Already configured in your `.env` file:
     ```
     OAUTH_CLIENT_ID="euAZXqNIcszE3zGNrgIwovtMp5fvAGFjdNgM7GQJUXRZt31J"
     OAUTH_CLIENT_SECRET="DESPxj4Szyq0z2cJesB0akubq9ydmnk7QBZcP4BxGWeOcGIP8qPbi0GJ5ImOwYqU"
     OAUTH_CALLBACK_URL="http://localhost:3000/callback"
     ```

## Authentication Flow

### Step 1: Run OAuth Login Script

Open a terminal and run:

```bash
npm run oauth-login
```

Or directly:

```bash
node oauth-login.js
```

### Step 2: Authenticate in Browser

The script will:
1. Start a local callback server on port 3000
2. Display an authorization URL
3. Wait for you to authenticate

**Copy the URL** from the terminal output and open it in your browser.

Example output:
```
🔐 Starting 3-Legged OAuth Authentication for Photos API

📡 OAuth callback server started on http://localhost:3000

🌐 Please open the following URL in your browser to authenticate:

   https://developer.api.autodesk.com/authentication/v2/authorize?response_type=code&client_id=...

Waiting for authentication...
```

### Step 3: Login and Authorize

1. Browser will redirect to Autodesk login page
2. Log in with your Autodesk account
3. Grant permissions to the application
4. Browser will redirect back to `http://localhost:3000/callback`

### Step 4: Success

You'll see a success message in both:
- **Browser**: "✅ Authentication Successful!"
- **Terminal**: Access token details and expiration time

Example terminal output:
```
✅ Authentication successful!
   Access Token: eyJhbGciOiJSUzI1NiIs...
   Expires In: 60 minutes

✨ You can now use the Photos API tools!

Server closed. OAuth tokens are stored in memory.
```

## Using Photos API Tools

Once authenticated, you can use the Photos tools through your MCP client:

### List Photos
```
List all photos from project XYZ
```

### Get Photo Details
```
Get details for photo with ID abc123 in project XYZ
```

### With Filters
```
List photos created after 2025-01-01 in project XYZ
List videos only from project XYZ
```

## Important Notes

### Token Expiration

- **Access tokens expire in 60 minutes**
- **Refresh tokens** are automatically used to get new access tokens
- If refresh fails, you'll need to re-authenticate by running `npm run oauth-login` again

### Token Storage

⚠️ **Tokens are stored in memory only**
- Tokens are lost when the MCP server restarts
- For production use, implement persistent token storage (file, database, etc.)

### Multiple Users

The current implementation supports **one user at a time**. If multiple users need access:
1. Each user runs `npm run oauth-login` separately
2. Or implement multi-user token management

## Troubleshooting

### Port 3000 Already in Use

If you get `EADDRINUSE` error:

**Option 1**: Stop the service using port 3000
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

**Option 2**: Change the callback URL port in `.env`:
```
OAUTH_CALLBACK_URL="http://localhost:3001/callback"
```
Then update the callback URL in your APS application settings to match.

### Authentication Failed

Common causes:
- Wrong Client ID or Client Secret in `.env`
- Callback URL doesn't match APS app settings
- ACC Photos API not enabled in APS app
- User doesn't have access to ACC projects

### No Token Available Error

If you see "No OAuth token available":
1. Run `npm run oauth-login` to authenticate first
2. Make sure authentication completed successfully
3. Check that tokens didn't expire (60 minutes)

### Photos API Not Working

If Photos API returns 401/403 errors after authentication:
- Verify your Autodesk account has access to ACC projects with photos
- Check that ACC Photos API is enabled in your APS application
- Ensure your user account is added to the ACC project

## Architecture

### Authentication Providers

The MCP server uses **two authentication providers**:

1. **Service Account (2-legged)** - For Issues, RFIs, Files
   - Uses JWT assertion with private key
   - No user interaction required
   - Configured with `APS_CLIENT_ID`, `SSA_ID`, `SSA_KEY_ID`, `SSA_KEY_PATH`

2. **3-Legged OAuth (3-legged)** - For Photos only
   - Requires user login and consent
   - User-specific access
   - Configured with `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `OAUTH_CALLBACK_URL`

### Code Structure

- `utils.js`:
  - `ServiceAccountAuthenticationProvider` - Service Account auth
  - `ThreeLeggedAuthenticationProvider` - OAuth auth
  - `photosClient` - Uses 3-legged OAuth
  - `issuesClient`, `rfiClient` - Use Service Account

- `oauth-login.js`:
  - Standalone script for user authentication
  - Creates temporary HTTP server for OAuth callback
  - Stores tokens in `threeLeggedAuthProvider` instance

## Next Steps

After authenticating successfully, try these:

1. **Test Photos tools** in your MCP client
2. **Implement token persistence** for production use
3. **Add token refresh monitoring** to notify before expiration
4. **Create a simple UI** for easier authentication (optional)

## Security Best Practices

1. **Never commit OAuth tokens** to git
2. **Keep Client Secret secure** - don't share publicly
3. **Use HTTPS** in production (not http://localhost)
4. **Implement token encryption** for persistent storage
5. **Add token revocation** when user logs out
6. **Monitor token usage** and refresh patterns

## Support

If you encounter issues:
1. Check this guide for troubleshooting steps
2. Verify APS application configuration at https://aps.autodesk.com/myapps
3. Review Autodesk OAuth documentation: https://aps.autodesk.com/en/docs/oauth/v2/developers_guide/overview/
