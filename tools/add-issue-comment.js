import { z } from "zod";
import { issuesClient } from "../utils.js";

export const addIssueCommentTool = {
    title: "Add Issue Comment",
    description: `
        Adds a comment to an existing issue in an Autodesk Construction Cloud (ACC) project.
        Comments are visible to all users with access to the issue.
        
        Required parameters: projectId, issueId, and comment (the text content).
        The projectId should be provided without the 'b.' prefix.
        
        Use this to:
        - Add status updates to issues
        - Communicate with team members
        - Document work progress
        - Ask questions or provide clarifications
    `,
    inputSchema: {
        projectId: z.string().nonempty(),
        issueId: z.string().nonempty(),
        comment: z.string().nonempty().describe("The text content of the comment to add")
    },
    callback: async ({ projectId, issueId, comment }) => {
        // Remove 'b.' prefix if present
        const cleanProjectId = projectId.replace("b.", "");

        // Build the comment payload
        const commentPayload = {
            body: comment
        };

        try {
            const createdComment = await issuesClient.createComments(cleanProjectId, issueId, commentPayload);
            
            const output = `✅ Comment added successfully!
- Comment ID: ${createdComment.id}
- Issue ID: ${issueId}
- Created at: ${createdComment.createdAt}
- Created by: ${createdComment.createdBy}

Comment:
"${createdComment.body}"`;

            return {
                content: [{ type: "text", text: output }],
                structuredContent: { comment: createdComment }
            };
        } catch (error) {
            const errorMessage = `❌ Failed to add comment: ${error.message || error}`;
            return {
                content: [{ type: "text", text: errorMessage }],
                isError: true
            };
        }
    }
};
