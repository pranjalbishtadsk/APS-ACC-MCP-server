import { z } from "zod";
import { rfiClient } from "../utils.js";

export const getRFIDetailsTool = {
    title: "Get RFI Details",
    description: `
        Retrieves detailed information about a specific RFI (Request for Information) in an ACC project.
        Returns complete RFI details including title, status, description, questions, responses,
        assignees, due dates, attachments, and workflow information.

        Required parameters: projectId and rfiId.
        The projectId should be provided without the 'b.' prefix.

        Use this to:
        - View complete RFI information
        - Review questions and responses
        - Check RFI workflow status
        - Access RFI attachments and comments
    `,
    inputSchema: {
        projectId: z.string().nonempty(),
        rfiId: z.string().nonempty().describe("The RFI ID or custom identifier")
    },
    callback: async ({ projectId, rfiId }) => {
        // Remove 'b.' prefix if present
        const cleanProjectId = projectId.replace("b.", "");

        try {
            const rfi = await rfiClient.getRFIDetails(cleanProjectId, rfiId);

            // Format the output
            let output = `📋 RFI Details
═══════════════════════════════════════

🆔 Basic Information:
- RFI ID: ${rfi.id}
- Custom ID: ${rfi.customIdentifier || 'N/A'}
- Title: ${rfi.title}
- Status: ${rfi.status}
- RFI Type: ${rfi.rfiTypeId || 'N/A'}

📝 Description:
${rfi.description || 'No description provided'}

👤 Assignment:
- Assigned To: ${typeof rfi.assignedTo === 'object' ? rfi.assignedTo?.name || rfi.assignedTo?.email || JSON.stringify(rfi.assignedTo) : rfi.assignedTo || 'Unassigned'}
- Manager: ${typeof rfi.manager === 'object' ? rfi.manager?.name || rfi.manager?.email || JSON.stringify(rfi.manager) : rfi.manager || 'N/A'}
- Owner: ${typeof rfi.owner === 'object' ? rfi.owner?.name || rfi.owner?.email || JSON.stringify(rfi.owner) : rfi.owner || 'N/A'}
- Created By: ${typeof rfi.createdBy === 'object' ? rfi.createdBy?.name || rfi.createdBy?.email || JSON.stringify(rfi.createdBy) : rfi.createdBy}

📅 Dates:
- Created: ${rfi.createdAt}
- Updated: ${rfi.updatedAt || 'N/A'}
- Due Date: ${rfi.dueDate || 'Not set'}
- Scheduled Impact: ${rfi.scheduledImpact || 'None'}

📍 Location:
- Location: ${rfi.location || 'Not specified'}
- Discipline: ${rfi.discipline || 'Not specified'}
- Category: ${rfi.category || 'Not specified'}

🔍 Workflow Information:
- Current Step: ${rfi.workflowStep || 'N/A'}
- Priority: ${rfi.priority || 'Normal'}
- Official Response Required: ${rfi.officialResponseRequired ? 'Yes' : 'No'}
- Cost Impact: ${rfi.costImpact || 'None'}`;

            // Add questions if present
            if (rfi.questions && rfi.questions.length > 0) {
                output += `\n\n❓ Questions (${rfi.questions.length}):\n`;
                rfi.questions.forEach((question, index) => {
                    output += `\n${index + 1}. ${question.text || question.body}`;
                    if (question.number) output += ` (Q${question.number})`;
                });
            }

            // Add responses if present
            if (rfi.responses && rfi.responses.length > 0) {
                output += `\n\n💬 Responses (${rfi.responses.length}):\n`;
                rfi.responses.forEach((response, index) => {
                    output += `\n${index + 1}. ${response.createdBy} (${response.createdAt}):
   ${response.text || response.body}
   Type: ${response.type || 'Individual'}${response.isOfficial ? ' (OFFICIAL)' : ''}`;
                });
            } else {
                output += `\n\n💬 Responses: No responses yet`;
            }

            // Add attachments if present
            if (rfi.attachments && rfi.attachments.length > 0) {
                output += `\n\n📎 Attachments (${rfi.attachments.length}):\n`;
                rfi.attachments.forEach((attachment, index) => {
                    output += `${index + 1}. ${attachment.name || attachment.fileName} (${attachment.type || 'unknown'})
   - URN: ${attachment.urn || attachment.id}
   - Size: ${attachment.size ? Math.round(attachment.size / 1024) + 'KB' : 'N/A'}
   - Uploaded: ${attachment.createdAt || 'N/A'}\n`;
                });
            } else {
                output += `\n\n📎 Attachments: No attachments`;
            }

            // Add custom attributes if present
            if (rfi.customAttributes && rfi.customAttributes.length > 0) {
                output += `\n\n⚙️ Custom Attributes:\n`;
                rfi.customAttributes.forEach(attr => {
                    output += `- ${attr.name || attr.attributeDefinitionId}: ${attr.value}\n`;
                });
            }

            // Add permitted actions if present
            if (rfi.permittedActions && rfi.permittedActions.length > 0) {
                output += `\n\n🔓 Permitted Actions: ${rfi.permittedActions.join(', ')}`;
            }

            return {
                content: [{ type: "text", text: output }],
                structuredContent: { rfi }
            };
        } catch (error) {
            const errorMessage = `❌ Failed to retrieve RFI details: ${error.message || error}`;
            return {
                content: [{ type: "text", text: errorMessage }],
                isError: true
            };
        }
    }
};
