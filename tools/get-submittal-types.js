import { z } from "zod";
import { submittalsClient } from "../utils.js";

export const getSubmittalTypesTool = {
    title: "Get Submittal Types",
    description: `
        Retrieves available submittal types configured in an ACC project.
        Submittal types define the categories and workflows for submittals.

        Use this tool to:
        - Get submittal type IDs needed for creating submittals
        - Understand available submittal categories
        - View configured submittal workflows

        Required parameter: projectId

        Common submittal types include:
        - Materials
        - Shop Drawings
        - Product Data
        - Samples
        - Mix Designs
        - Test Reports
    `,
    inputSchema: {
        projectId: z.string().nonempty()
    },
    callback: async ({ projectId }) => {
        const cleanProjectId = projectId.replace(/^b\./, "");

        try {
            const result = await submittalsClient.getSubmittalTypes(cleanProjectId);
            const types = result.results || result || [];

            if (!Array.isArray(types) || types.length === 0) {
                return {
                    content: [{
                        type: "text",
                        text: "No submittal types found. The project may not have submittal types configured yet."
                    }]
                };
            }

            let output = `Found ${types.length} submittal type(s):\n\n`;
            types.forEach((type, index) => {
                output += `${index + 1}. ${type.name || type.title || 'Unnamed Type'}\n`;
                output += `   ID: ${type.id}\n`;
                if (type.code) output += `   Code: ${type.code}\n`;
                if (type.category) output += `   Category: ${type.category}\n`;
                if (type.description) output += `   Description: ${type.description}\n`;
                if (type.workflow) output += `   Workflow: ${type.workflow}\n`;
                output += '\n';
            });

            output += '\n💡 Tip: Use the ID from above when creating a submittal with createSubmittalTool\n';

            return { content: [{ type: "text", text: output }] };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Error retrieving submittal types: ${error.message}`
                }],
                isError: true
            };
        }
    }
};
