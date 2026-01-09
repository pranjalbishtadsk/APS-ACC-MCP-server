import fs from "node:fs/promises";
import jwt from "jsonwebtoken";
import { DataManagementClient } from "@aps_sdk/data-management";
import { IssuesClient } from "@aps_sdk/construction-issues";
import { APS_CLIENT_ID, APS_CLIENT_SECRET, SSA_ID, SSA_KEY_ID, SSA_KEY_PATH } from "./config.js";

const TOKEN_ENDPOINT = "https://developer.api.autodesk.com/authentication/v2/token";

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
