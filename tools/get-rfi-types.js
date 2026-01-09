import { z } from "zod";
import { rfiClient } from "../utils.js";

export const getRFITypesTool = {
    title: "Get RFI Types",
    description: `
        Retrieves the available RFI types configured for an ACC project.
        RFI types define different categories or templates for RFIs in the project.

        Required parameter: projectId.
        The projectId should be provided without the 'b.' prefix.

        Use this before creating an RFI to get valid rfiTypeId values.
    `,
    inputSchema: {
        projectId: z.string().nonempty()
    },
    callback: async ({ projectId }) => {
        // Remove 'b.' prefix if present
        const cleanProjectId = projectId.replace("b.", "");

        try {
            const result = await rfiClient.getRFITypes(cleanProjectId);

            const rfiTypes = result.results || result || [];

            if (rfiTypes.length === 0) {
                return {
                    content: [{
                        type: "text",
                        text: "📋 No RFI types found in this project.\n\n💡 RFI types may need to be configured in the ACC project settings."
                    }],
                    structuredContent: { rfiTypes: [] }
                };
            }

            // Format the output
            let output = `📋 Available RFI Types
═══════════════════════════════════════
Found ${rfiTypes.length} RFI type(s):\n\n`;

            rfiTypes.forEach((type, index) => {
                output += `${index + 1}. ${type.name || 'Unnamed Type'}
   ID: ${type.id}
   Description: ${type.description || 'No description'}
   ${type.isDefault ? '⭐ Default Type' : ''}
   ${type.isActive !== false ? '✅ Active' : '❌ Inactive'}
   ${type.customAttributes ? `Custom Attributes: ${type.customAttributes.length}` : ''}
\n`;
            });

            output += `\n💡 Use these IDs when creating RFIs with the createRFITool`;

            return {
                content: [{ type: "text", text: output }],
                structuredContent: { rfiTypes }
            };
        } catch (error) {
            const errorMessage = `❌ Failed to retrieve RFI types: ${error.message || error}`;
            return {
                content: [{ type: "text", text: errorMessage }],
                isError: true
            };
        }
    }
};
