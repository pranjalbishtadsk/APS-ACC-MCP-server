import { z } from "zod";
import { issuesClient } from "../utils.js";

export const getIssueDetailsTool = {
    title: "Get Issue Details",
    description: `
        Retrieves detailed information about a specific issue in an Autodesk Construction Cloud (ACC) project.
        Returns full issue details including title, status, description, assignee, dates, location, 
        comments, attachments, custom attributes, and complete audit trail.
        
        Required parameters: projectId and issueId.
        The projectId should be provided without the 'b.' prefix.
    `,
    inputSchema: {
        projectId: z.string().nonempty(),
        issueId: z.string().nonempty(),
        includeComments: z.boolean().optional().default(true),
        includeAttachments: z.boolean().optional().default(true)
    },
    callback: async ({ projectId, issueId, includeComments = true, includeAttachments = true }) => {
        // Remove 'b.' prefix if present
        const cleanProjectId = projectId.replace("b.", "");

        try {
            // Get the issue details
            const issue = await issuesClient.getIssueDetails(cleanProjectId, issueId);

            // Format the output
            let output = `📋 Issue Details
═══════════════════════════════════════

🆔 Basic Information:
- Issue ID: ${issue.id}
- Display ID: ${issue.displayId || 'N/A'}
- Title: ${issue.title}
- Status: ${issue.status}
- Published: ${issue.published ? 'Yes' : 'No'}
- Issue Type: ${issue.issueTypeId || 'N/A'}
- Issue Subtype: ${issue.issueSubtypeId || 'N/A'}

📝 Description:
${issue.description || 'No description provided'}

👤 Assignment:
- Assigned To: ${issue.assignedTo || 'Unassigned'}
- Assigned Type: ${issue.assignedToType || 'N/A'}
- Owner: ${issue.owner || 'N/A'}

📅 Dates:
- Created: ${issue.createdAt}
- Created By: ${issue.createdBy}
- Updated: ${issue.updatedAt || 'N/A'}
- Due Date: ${issue.dueDate || 'Not set'}
- Start Date: ${issue.startDate || 'Not set'}
- Closed Date: ${issue.closedAt || 'Not closed'}
- Closed By: ${issue.closedBy || 'N/A'}

📍 Location:
- Location ID: ${issue.locationId || 'Not specified'}
- Location Details: ${issue.locationDetails || 'Not specified'}
${issue.gpsCoordinates ? `- GPS: ${issue.gpsCoordinates.latitude}, ${issue.gpsCoordinates.longitude}` : ''}

🔍 Additional Details:
- Root Cause: ${issue.rootCauseId || 'Not specified'}
- Priority: ${issue.priority || 'Not set'}
- Permitted: ${issue.permitted || 'N/A'}
- Target: ${issue.target || 'N/A'}`;

            // Add watchers if present
            if (issue.watchers && issue.watchers.length > 0) {
                output += `\n\n👥 Watchers (${issue.watchers.length}):\n`;
                issue.watchers.forEach(watcher => {
                    output += `- ${watcher}\n`;
                });
            }

            // Add custom attributes if present
            if (issue.customAttributes && issue.customAttributes.length > 0) {
                output += `\n\n⚙️ Custom Attributes:\n`;
                issue.customAttributes.forEach(attr => {
                    output += `- ${attr.attributeDefinitionId}: ${attr.value}\n`;
                });
            }

            // Add comments if requested and available
            if (includeComments && issue.comments && issue.comments.length > 0) {
                output += `\n\n💬 Comments (${issue.comments.length}):\n`;
                issue.comments.forEach((comment, index) => {
                    output += `\n${index + 1}. ${comment.createdBy} (${comment.createdAt}):
   ${comment.body}\n`;
                });
            } else if (includeComments) {
                output += `\n\n💬 Comments: No comments yet`;
            }

            // Add attachments if requested and available
            if (includeAttachments && issue.attachments && issue.attachments.length > 0) {
                output += `\n\n📎 Attachments (${issue.attachments.length}):\n`;
                issue.attachments.forEach((attachment, index) => {
                    output += `${index + 1}. ${attachment.name} (${attachment.type || 'unknown type'})
   - URN: ${attachment.urn}
   - Uploaded: ${attachment.createdAt}
   - Uploaded By: ${attachment.createdBy}\n`;
                });
            } else if (includeAttachments) {
                output += `\n\n📎 Attachments: No attachments`;
            }

            return {
                content: [{ type: "text", text: output }],
                structuredContent: { issue }
            };
        } catch (error) {
            const errorMessage = `❌ Failed to retrieve issue details: ${error.message || error}`;
            return {
                content: [{ type: "text", text: errorMessage }],
                isError: true
            };
        }
    }
};
