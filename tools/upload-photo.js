import { z } from "zod";
import { photosClient } from "../utils.js";
import fs from "node:fs/promises";
import path from "node:path";

export const uploadPhotoTool = {
    title: "Upload Photo",
    description: `
        Uploads a photo or video to an Autodesk Construction Cloud (ACC) project.
        
        Required parameters: projectId, filePath
        Optional: title, description, location, tags
        
        The file will be uploaded directly to the project's Photos module.
        Supported formats: JPEG, PNG, MP4, MOV, etc.
        
        Note: This tool requires 3-legged OAuth authentication. 
        Run 'npm run oauth-login' if you haven't authenticated yet.
    `,
    inputSchema: {
        projectId: z.string().describe("Project ID (with or without 'b.' prefix)"),
        filePath: z.string().describe("Absolute path to the photo/video file on your local system"),
        title: z.string().optional().describe("Title/name for the photo (default: filename)"),
        description: z.string().optional().describe("Description of the photo"),
        location: z.string().optional().describe("Location where the photo was taken"),
        tags: z.array(z.string()).optional().describe("Tags for categorizing the photo")
    },
    callback: async ({ projectId, filePath, title, description, location, tags }) => {
        const cleanProjectId = projectId.replace(/^b\./, "");

        try {
            // Validate file exists
            try {
                await fs.access(filePath);
            } catch (error) {
                return {
                    content: [{ 
                        type: "text", 
                        text: `❌ Error: File not found at path: ${filePath}\n\nPlease provide the absolute path to the photo/video file.` 
                    }],
                    isError: true
                };
            }

            // Get file info
            const fileName = path.basename(filePath);
            const fileStats = await fs.stat(filePath);
            const fileSize = fileStats.size;

            // Read file as buffer
            const fileBuffer = await fs.readFile(filePath);

            // Prepare metadata
            const metadata = {
                title: title || fileName,
                description,
                location,
                tags
            };

            // Upload photo
            const result = await photosClient.uploadPhoto(cleanProjectId, fileBuffer, fileName, metadata);

            let output = `✅ Photo/video uploaded successfully!\n\n`;
            output += `ID: ${result.id}\n`;
            output += `Name: ${result.name || fileName}\n`;
            output += `Type: ${result.type || 'N/A'}\n`;
            output += `Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB\n`;
            output += `Created: ${result.createdAt || new Date().toISOString()}\n`;
            
            if (result.imageUrl) output += `\nImage URL: ${result.imageUrl}\n`;
            if (result.thumbnailUrl) output += `Thumbnail URL: ${result.thumbnailUrl}\n`;
            
            if (metadata.description) output += `\nDescription: ${metadata.description}\n`;
            if (metadata.location) output += `Location: ${metadata.location}\n`;
            if (metadata.tags && metadata.tags.length > 0) output += `Tags: ${metadata.tags.join(', ')}\n`;

            return { content: [{ type: "text", text: output }] };

        } catch (error) {
            return {
                content: [{ 
                    type: "text", 
                    text: `❌ Error uploading photo: ${error.message}\n\nNote: Run 'npm run oauth-login' to authenticate with 3-legged OAuth if you haven't already.` 
                }],
                isError: true
            };
        }
    }
};
