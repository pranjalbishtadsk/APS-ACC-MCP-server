import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import url from "node:url";
import jwt from "jsonwebtoken";
import { DataManagementClient } from "@aps_sdk/data-management";
import { IssuesClient } from "@aps_sdk/construction-issues";
import {
    APS_CLIENT_ID,
    APS_CLIENT_SECRET,
    SSA_ID,
    SSA_KEY_ID,
    SSA_KEY_PATH,
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    OAUTH_CALLBACK_URL
} from "./config.js";

const TOKEN_ENDPOINT = "https://developer.api.autodesk.com/authentication/v2/token";
const AUTHORIZE_ENDPOINT = "https://developer.api.autodesk.com/authentication/v2/authorize";

class ServiceAccountAuthenticationProvider {
    constructor(scopes) {
        this._accessToken = null;
        this._expiresAt = 0;
        this._scopes = scopes;
    }

    async getAccessToken() {
        if (!this._accessToken || this._expiresAt < Date.now()) {
            const assertion = await this._createAssertion(this._scopes);
            const { access_token, expires_in } = await this._exchangeAccessToken(assertion);
            this._accessToken = access_token;
            this._expiresAt = Date.now() + expires_in * 1000;
        }
        return this._accessToken;
    }

    async _createAssertion(scopes) {
        const expiresAt = Math.floor(Date.now() / 1000) + 300;
        const payload = { iss: APS_CLIENT_ID, sub: SSA_ID, aud: TOKEN_ENDPOINT, exp: expiresAt, scope: scopes };
        const privateKey = await fs.readFile(SSA_KEY_PATH, "utf-8");
        const options = {
            algorithm: "RS256",
            header: { alg: "RS256", kid: SSA_KEY_ID },
            noTimestamp: true
        };
        return jwt.sign(payload, privateKey, options);
    }

    async _exchangeAccessToken(assertion) {
        const headers = {
            "Accept": "application/json",
            "Authorization": `Basic ${Buffer.from(`${APS_CLIENT_ID}:${APS_CLIENT_SECRET}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded"
        };
        const body = new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion });
        const response = await fetch(TOKEN_ENDPOINT, { method: "POST", headers, body });
        if (!response.ok) {
            throw new Error(`Could not generate access token: ${await response.text()}`);
        }
        return response.json();
    }
}

const serviceAccountAuthenticationProvider = new ServiceAccountAuthenticationProvider(["data:read", "data:write"]);
export const dataManagementClient = new DataManagementClient({ authenticationProvider: serviceAccountAuthenticationProvider });
export const issuesClient = new IssuesClient({ authenticationProvider: serviceAccountAuthenticationProvider });

// 3-Legged OAuth Authentication Provider for Photos API
class ThreeLeggedAuthenticationProvider {
    constructor(clientId, clientSecret, callbackUrl, scopes, tokenFilePath = "./oauth-tokens.json") {
        this._clientId = clientId;
        this._clientSecret = clientSecret;
        this._callbackUrl = callbackUrl;
        this._scopes = scopes;
        this._tokenFilePath = tokenFilePath;
        this._accessToken = null;
        this._refreshToken = null;
        this._expiresAt = 0;

        // Load tokens from file on initialization
        this._loadTokensFromFile();
    }

    _loadTokensFromFile() {
        // Synchronous version to load tokens during initialization
        try {
            const data = readFileSync(this._tokenFilePath, "utf-8");
            const tokens = JSON.parse(data);
            if (tokens.accessToken && tokens.refreshToken && tokens.expiresAt) {
                this._accessToken = tokens.accessToken;
                this._refreshToken = tokens.refreshToken;
                this._expiresAt = tokens.expiresAt;
            }
        } catch (error) {
            // File doesn't exist or is invalid, ignore
        }
    }

    async _saveTokensToFile() {
        try {
            const tokens = {
                accessToken: this._accessToken,
                refreshToken: this._refreshToken,
                expiresAt: this._expiresAt
            };
            await fs.writeFile(this._tokenFilePath, JSON.stringify(tokens, null, 2));
        } catch (error) {
            console.error("Failed to save OAuth tokens to file:", error.message);
        }
    }

    getAuthorizationUrl() {
        const params = new URLSearchParams({
            response_type: "code",
            client_id: this._clientId,
            redirect_uri: this._callbackUrl,
            scope: this._scopes.join(" ")
        });
        return `${AUTHORIZE_ENDPOINT}?${params.toString()}`;
    }

    async exchangeCodeForToken(authorizationCode) {
        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded"
        };
        const body = new URLSearchParams({
            grant_type: "authorization_code",
            code: authorizationCode,
            client_id: this._clientId,
            client_secret: this._clientSecret,
            redirect_uri: this._callbackUrl
        });

        const response = await fetch(TOKEN_ENDPOINT, { method: "POST", headers, body });
        if (!response.ok) {
            throw new Error(`Could not exchange authorization code: ${await response.text()}`);
        }

        const data = await response.json();
        this._accessToken = data.access_token;
        this._refreshToken = data.refresh_token;
        this._expiresAt = Date.now() + data.expires_in * 1000;

        // Save tokens to file
        await this._saveTokensToFile();

        return data;
    }

    async refreshAccessToken() {
        if (!this._refreshToken) {
            throw new Error("No refresh token available. User needs to re-authenticate.");
        }

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded"
        };
        const body = new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: this._refreshToken,
            client_id: this._clientId,
            client_secret: this._clientSecret
        });

        const response = await fetch(TOKEN_ENDPOINT, { method: "POST", headers, body });
        if (!response.ok) {
            throw new Error(`Could not refresh access token: ${await response.text()}`);
        }

        const data = await response.json();
        this._accessToken = data.access_token;
        this._refreshToken = data.refresh_token;
        this._expiresAt = Date.now() + data.expires_in * 1000;

        // Save tokens to file
        await this._saveTokensToFile();

        return data;
    }

    async getAccessToken() {
        if (!this._accessToken) {
            throw new Error("No access token available. User needs to authenticate first. Run the OAuth flow.");
        }

        // Refresh token if expired
        if (this._expiresAt < Date.now()) {
            await this.refreshAccessToken();
        }

        return this._accessToken;
    }

    setTokens(accessToken, refreshToken, expiresIn) {
        this._accessToken = accessToken;
        this._refreshToken = refreshToken;
        this._expiresAt = Date.now() + expiresIn * 1000;
    }

    hasToken() {
        return !!this._accessToken;
    }
}

// Initialize 3-legged OAuth provider if credentials are available
let threeLeggedAuthProvider = null;
if (OAUTH_CLIENT_ID && OAUTH_CLIENT_SECRET && OAUTH_CALLBACK_URL) {
    // Use absolute path for token file based on the location of this utils.js file
    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const tokenFilePath = path.join(__dirname, "oauth-tokens.json");

    threeLeggedAuthProvider = new ThreeLeggedAuthenticationProvider(
        OAUTH_CLIENT_ID,
        OAUTH_CLIENT_SECRET,
        OAUTH_CALLBACK_URL,
        ["data:read", "data:write"],
        tokenFilePath
    );
}

export { threeLeggedAuthProvider };

// RFI API Client - No SDK available, using direct REST API calls
class RFIClient {
    constructor(authenticationProvider) {
        this._authProvider = authenticationProvider;
        this._baseUrl = "https://developer.api.autodesk.com/construction/rfis/v3";
    }

    async _fetch(endpoint, options = {}) {
        const token = await this._authProvider.getAccessToken();
        const url = `${this._baseUrl}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                ...options.headers
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`RFI API Error (${response.status}): ${errorText}`);
        }

        return response.json();
    }

    async searchRFIs(projectId, filters = {}, limit = 25, offset = 0, query = null) {
        // Build request body - pagination parameters go at root level, not nested
        const requestBody = {
            limit,
            offset
        };

        // Only add filter if there are actual filter values
        if (Object.keys(filters).length > 0) {
            requestBody.filter = filters;
        }

        // Add query/search text inside filter object, not at root level
        if (query) {
            if (!requestBody.filter) requestBody.filter = {};
            requestBody.filter.search = query;
        }

        return this._fetch(`/projects/${projectId}/search:rfis`, {
            method: "POST",
            body: JSON.stringify(requestBody)
        });
    }

    async getRFIDetails(projectId, rfiId) {
        return this._fetch(`/projects/${projectId}/rfis/${rfiId}`, {
            method: "GET"
        });
    }

    async createRFI(projectId, rfiData) {
        return this._fetch(`/projects/${projectId}/rfis`, {
            method: "POST",
            body: JSON.stringify(rfiData)
        });
    }

    async updateRFI(projectId, rfiId, updateData) {
        return this._fetch(`/projects/${projectId}/rfis/${rfiId}`, {
            method: "PATCH",
            body: JSON.stringify(updateData)
        });
    }

    async createResponse(projectId, rfiId, responseData) {
        return this._fetch(`/projects/${projectId}/rfis/${rfiId}/responses`, {
            method: "POST",
            body: JSON.stringify(responseData)
        });
    }

    async getRFITypes(projectId) {
        return this._fetch(`/projects/${projectId}/rfi-types`, {
            method: "GET"
        });
    }
}

export const rfiClient = new RFIClient(serviceAccountAuthenticationProvider);

// Photos API Client - No SDK available, using direct REST API calls
// Note: Photos API requires 3-legged OAuth (user context), NOT service account authentication
class PhotosClient {
    constructor(authenticationProvider) {
        this._authProvider = authenticationProvider;
        this._baseUrl = "https://developer.api.autodesk.com/construction/photos/v1";
    }

    async _fetch(endpoint, options = {}) {
        if (!this._authProvider) {
            throw new Error("Photos API requires 3-legged OAuth authentication. Please configure OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, and OAUTH_CALLBACK_URL in .env file.");
        }

        if (!this._authProvider.hasToken()) {
            throw new Error("No OAuth token available. Please authenticate first by visiting the authorization URL.");
        }

        const token = await this._authProvider.getAccessToken();
        const url = `${this._baseUrl}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                ...options.headers
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Photos API Error (${response.status}): ${errorText}`);
        }

        return response.json();
    }

    async searchPhotos(projectId, filters = {}) {
        // Build request body for photos:filter endpoint
        const requestBody = {};

        // Add filters if provided
        if (filters.createdFrom) requestBody.createdFrom = filters.createdFrom;
        if (filters.createdTo) requestBody.createdTo = filters.createdTo;
        if (filters.mediaType) requestBody.mediaType = filters.mediaType;
        if (filters.limit) requestBody.limit = filters.limit;
        if (filters.offset) requestBody.offset = filters.offset;

        return this._fetch(`/projects/${projectId}/photos:filter`, {
            method: "POST",
            body: JSON.stringify(requestBody)
        });
    }

    async getPhotoDetails(projectId, photoId) {
        return this._fetch(`/projects/${projectId}/photos/${photoId}`, {
            method: "GET"
        });
    }
}

// Use 3-legged OAuth for Photos API (will be null if OAuth not configured)
export const photosClient = new PhotosClient(threeLeggedAuthProvider);
