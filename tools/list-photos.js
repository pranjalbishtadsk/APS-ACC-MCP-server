import { z } from "zod";
import { photosClient } from "../utils.js";

export const listPhotosTool = {
    title: "List Photos",
    description: "Retrieves photos and videos from an ACC project with optional filtering by date range and media type",
    inputSchema: {
        projectId: z.string().describe("Project ID (with or without 'b.' prefix)"),
        createdFrom: z.string().optional().describe("Filter by creation date (from) in ISO8601 format (e.g., '2025-01-01T00:00:00.000Z')"),
        createdTo: z.string().optional().describe("Filter by creation date (to) in ISO8601 format (e.g., '2025-12-31T23:59:59.999Z')"),
        mediaType: z.enum(["photo", "video"]).optional().describe("Filter by media type: 'photo' or 'video'"),
        limit: z.number().min(1).max(100).optional().describe("Maximum number of photos to return (1-100, default: 25)"),
        offset: z.number().min(0).optional().describe("Number of photos to skip for pagination (default: 0)")
    },
    callback: async ({ projectId, createdFrom, createdTo, mediaType, limit = 25, offset = 0 }) => {
        const cleanProjectId = projectId.replace(/^b\./, "");

        const filters = {};
        if (createdFrom) filters.createdFrom = createdFrom;
        if (createdTo) filters.createdTo = createdTo;
        if (mediaType) filters.mediaType = mediaType;
        if (limit !== undefined) filters.limit = limit;
        if (offset !== undefined) filters.offset = offset;

        try {
            const result = await photosClient.searchPhotos(cleanProjectId, filters);
            const photos = result.results || [];

            if (photos.length === 0) {
                return {
                    content: [{ type: "text", text: "No photos or videos found matching the specified criteria." }]
                };
            }

            let output = `Found ${photos.length} photo(s)/video(s):\n\n`;
            photos.forEach((photo, index) => {
                output += `${index + 1}. ${photo.name || 'Untitled'}\n`;
                output += `   ID: ${photo.id}\n`;
                output += `   Type: ${photo.type || 'N/A'}\n`;
                output += `   Created: ${photo.createdAt || 'N/A'}\n`;
                output += `   Created By: ${photo.createdBy || 'N/A'}\n`;
                if (photo.imageUrl) output += `   Image URL: ${photo.imageUrl}\n`;
                if (photo.thumbnailUrl) output += `   Thumbnail URL: ${photo.thumbnailUrl}\n`;
                if (photo.description) output += `   Description: ${photo.description}\n`;
                output += '\n';
            });

            if (result.pagination) {
                output += `\nPagination: Limit=${result.pagination.limit || limit}, Offset=${result.pagination.offset || offset}, Total=${result.pagination.totalResults || 'N/A'}\n`;
            }

            return { content: [{ type: "text", text: output }] };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error listing photos: ${error.message}\n\nNote: Run 'npm run oauth-login' to authenticate with 3-legged OAuth.` }],
                isError: true
            };
        }
    }
};
