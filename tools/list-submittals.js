import { z } from "zod";
import { submittalsClient } from "../utils.js";

export const listSubmittalsTool = {
    title: "List Submittals",
    description: `
        Retrieves a list of submittals from an Autodesk Construction Cloud (ACC) project.
        Submittals are formal submissions of materials, products, samples, or shop drawings 
        for review and approval by the design team.

        Required parameter: projectId.
        Optional: filters (status, type, assignee, etc.), limit, and offset for pagination.

        Common submittal statuses: draft, submitted, reviewed, approved, rejected, approved_as_noted

        Use this to:
        - List all submittals in a project
        - Filter submittals by status or type
        - Track submittal workflow and approvals
        - Monitor outstanding submittals
    `,
    inputSchema: {
        projectId: z.string().nonempty(),
        status: z.string().optional().describe("Filter by submittal status (e.g., draft, submitted, approved, rejected)"),
        type: z.string().optional().describe("Filter by submittal type"),
        assignedTo: z.string().optional().describe("Filter by assignee user ID"),
        limit: z.number().min(1).max(100).default(25).describe("Number of submittals to return (1-100, default 25)"),
        offset: z.number().min(0).default(0).describe("Number of submittals to skip for pagination (default 0)")
    },
    callback: async ({ projectId, status, type, assignedTo, limit = 25, offset = 0 }) => {
        const cleanProjectId = projectId.replace(/^b\./, "");

        const filters = {};
        if (status) filters.status = [status];
        if (type) filters.type = type;
        if (assignedTo) filters.assignedTo = assignedTo;

        try {
            const result = await submittalsClient.searchSubmittals(cleanProjectId, filters, limit, offset);
            const submittals = result.results || [];

            if (submittals.length === 0) {
                return {
                    content: [{ type: "text", text: "No submittals found matching the specified criteria." }]
                };
            }

            let output = `Found ${submittals.length} submittal(s):\n\n`;
            submittals.forEach((submittal, index) => {
                output += `${index + 1}. ${submittal.title || submittal.number || 'Untitled'}\n`;
                output += `   ID: ${submittal.id}\n`;
                output += `   Number: ${submittal.number || 'N/A'}\n`;
                output += `   Status: ${submittal.status || 'N/A'}\n`;
                output += `   Type: ${submittal.type || 'N/A'}\n`;
                if (submittal.dueDate) output += `   Due Date: ${submittal.dueDate}\n`;
                if (submittal.assignedTo) output += `   Assigned To: ${submittal.assignedTo}\n`;
                if (submittal.createdAt) output += `   Created: ${submittal.createdAt}\n`;
                output += '\n';
            });

            if (result.pagination) {
                output += `\nPagination: Limit=${limit}, Offset=${offset}, Total=${result.pagination.totalResults || 'N/A'}\n`;
            }

            return { content: [{ type: "text", text: output }] };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error listing submittals: ${error.message}` }],
                isError: true
            };
        }
    }
};
