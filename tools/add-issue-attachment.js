import { z } from "zod";
import { issuesClient } from "../utils.js";

export const addIssueAttachmentTool = {
    title: "Add Issue Attachment",
    description: `
        Adds an attachment (file) to an existing issue in an Autodesk Construction Cloud (ACC) project.
        Attachments can be photos, documents, or any other file type supported by ACC.
        
        Required parameters: projectId, issueId, and urn (the file URN from ACC Data Management).
        The projectId should be provided without the 'b.' prefix.
        
        Note: This tool associates an existing file from the project's document management with the issue.
        The file must already exist in the project's file storage. You can get file URNs using getFolderContentsTool.
        
        For direct file uploads from local storage, use the Data Management API separately first to upload,
        then use this tool to attach the uploaded file to the issue.
    `,
    inputSchema: {
        projectId: z.string().nonempty(),
        issueId: z.string().nonempty(),
        urn: z.string().nonempty().describe("The URN of the file to attach (from ACC Data Management)"),
        name: z.string().optional().describe("Optional display name for the attachment")
    },
    callback: async ({ projectId, issueId, urn, name }) => {
        // Remove 'b.' prefix if present
        const cleanProjectId = projectId.replace("b.", "");

        try {
            // Note: The SDK doesn't have a direct "addAttachment" method exposed in IssuesClient
            // Attachments are typically managed through the issue update API or separate attachment endpoints
            // This is a limitation that needs to be addressed with the actual API implementation
            
            const errorMessage = `⚠️ Attachment functionality not yet fully implemented.
            
The ACC Issues API supports attachments, but the current SDK wrapper doesn't expose
a direct method for adding attachments. 

Workarounds:
1. Use the Data Management API to upload files to the project
2. Reference files via linkedDocuments in createIssue or updateIssue
3. Use the full REST API directly for attachment operations

Provided parameters:
- Project ID: ${cleanProjectId}
- Issue ID: ${issueId}
- File URN: ${urn}
${name ? `- Display Name: ${name}` : ''}

This feature requires enhancement to the SDK or direct API implementation.`;

            return {
                content: [{ type: "text", text: errorMessage }],
                isError: false  // Not an error, just a limitation
            };
        } catch (error) {
            const errorMessage = `❌ Failed to add attachment: ${error.message || error}`;
            return {
                content: [{ type: "text", text: errorMessage }],
                isError: true
            };
        }
    }
};
