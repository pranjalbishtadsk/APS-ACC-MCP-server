import { z } from "zod";
import { photosClient } from "../utils.js";

export const getPhotoDetailsTool = {
    title: "Get Photo Details",
    description: "Retrieves detailed information about a specific photo or video from an ACC project",
    inputSchema: {
        projectId: z.string().describe("Project ID (with or without 'b.' prefix)"),
        photoId: z.string().describe("Photo/video ID")
    },
    callback: async ({ projectId, photoId }) => {
        const cleanProjectId = projectId.replace(/^b\./, "");

        try {
            const photo = await photosClient.getPhotoDetails(cleanProjectId, photoId);

            let output = `Photo/Video Details:\n\n`;
            output += `Name: ${photo.name || 'Untitled'}\n`;
            output += `ID: ${photo.id}\n`;
            output += `Type: ${photo.type || 'N/A'}\n`;
            output += `Created: ${photo.createdAt || 'N/A'}\n`;
            output += `Created By: ${photo.createdBy || 'N/A'}\n`;
            output += `Updated: ${photo.updatedAt || 'N/A'}\n`;
            output += `Updated By: ${photo.updatedBy || 'N/A'}\n`;

            if (photo.description) output += `\nDescription:\n${photo.description}\n`;
            if (photo.imageUrl) output += `\nImage URL: ${photo.imageUrl}\n`;
            if (photo.thumbnailUrl) output += `Thumbnail URL: ${photo.thumbnailUrl}\n`;
            if (photo.videoUrl) output += `Video URL: ${photo.videoUrl}\n`;

            if (photo.location) {
                output += `\nLocation:\n`;
                if (photo.location.name) output += `- Name: ${photo.location.name}\n`;
                if (photo.location.coordinates) output += `- Coordinates: ${JSON.stringify(photo.location.coordinates)}\n`;
            }

            if (photo.fileSize) output += `\nFile Size: ${photo.fileSize} bytes\n`;
            if (photo.width && photo.height) output += `Dimensions: ${photo.width}x${photo.height}\n`;
            if (photo.tags && photo.tags.length > 0) output += `\nTags: ${photo.tags.join(', ')}\n`;

            if (photo.customAttributes && Object.keys(photo.customAttributes).length > 0) {
                output += `\nCustom Attributes:\n`;
                Object.entries(photo.customAttributes).forEach(([key, value]) => {
                    output += `- ${key}: ${value}\n`;
                });
            }

            return { content: [{ type: "text", text: output }] };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error retrieving photo details: ${error.message}\n\nNote: Run 'npm run oauth-login' to authenticate with 3-legged OAuth.` }],
                isError: true
            };
        }
    }
};
