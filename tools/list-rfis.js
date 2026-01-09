import { z } from "zod";
import { rfiClient } from "../utils.js";

export const listRFIsTool = {
    title: "List RFIs",
    description: `
        Retrieves a list of RFIs (Requests for Information) from an Autodesk Construction Cloud (ACC) project.
        RFIs are formal requests for clarification or additional information from project stakeholders.

        Required parameter: projectId.
        Optional: filters (search text, status, assignee, etc.), limit, and offset for pagination.

        Common RFI statuses: draft, open, answered, closed

        Use this to:
        - List all RFIs in a project
        - Search for specific RFIs by text
        - Filter RFIs by status, assignee, or date
        - Monitor RFI workflow and responses
    `,
    inputSchema: {
        projectId: z.string().nonempty(),
        searchText: z.string().optional().describe("Search RFIs by text in title, question, or custom ID (client-side filtering)"),
        status: z.string().optional().describe("Filter by RFI status (e.g., draft, open, answered, closed)"),
        assignedTo: z.string().optional().describe("Filter by assignee user ID"),
        limit: z.number().min(1).max(100).default(25).describe("Number of RFIs to return (1-100, default 25)"),
        offset: z.number().min(0).default(0).describe("Number of RFIs to skip for pagination (default 0)")
    },
    callback: async ({ projectId, searchText, status, assignedTo, limit = 25, offset = 0 }) => {
        // Remove 'b.' prefix if present
        const cleanProjectId = projectId.replace("b.", "");

        // Build filter object
        const filters = {};
        // Note: searchText goes at root level, not inside filters
        if (status) filters.status = [status];
        if (assignedTo) filters.assignedTo = assignedTo;

        try {
            // Note: API doesn't support server-side text search, so we fetch all and filter client-side
            const result = await rfiClient.searchRFIs(cleanProjectId, filters, limit, offset, null);

            let rfis = result.results || [];

            // Client-side text search filtering
            if (searchText) {
                const searchLower = searchText.toLowerCase();
                rfis = rfis.filter(rfi =>
                    rfi.title?.toLowerCase().includes(searchLower) ||
                    rfi.question?.toLowerCase().includes(searchLower) ||
                    rfi.customIdentifier?.toLowerCase().includes(searchLower)
                );
            }

            const totalResults = result.pagination?.totalResults || rfis.length;

            if (rfis.length === 0) {
                return {
                    content: [{
                        type: "text",
                        text: "📋 No RFIs found matching your criteria."
                    }],
                    structuredContent: { rfis: [], total: 0 }
                };
            }

            // Format the output
            let output = `📋 RFIs in Project
═══════════════════════════════════════
Found ${rfis.length} ${searchText ? `matching "${searchText}"` : 'RFI(s)'}${!searchText ? ` of ${totalResults} total` : ''}
${offset > 0 ? `Showing results ${offset + 1} to ${offset + rfis.length}\n` : ''}
${searchText ? `⚠️ Text search performed client-side (API limitation)\n` : ''}
`;

            rfis.forEach((rfi, index) => {
                // Format assignedTo - handle both string and object formats
                const assignedToDisplay = typeof rfi.assignedTo === 'object'
                    ? rfi.assignedTo?.name || rfi.assignedTo?.email || `User ID: ${rfi.assignedTo?.id || 'Unknown'}`
                    : rfi.assignedTo || 'Unassigned';

                output += `\n${index + 1}. 🆔 ${rfi.customIdentifier || rfi.id}
   Title: ${rfi.title}
   Status: ${rfi.status || 'N/A'}
   Type: ${rfi.rfiTypeId || 'N/A'}
   Assigned To: ${assignedToDisplay}
   Due Date: ${rfi.dueDate || 'Not set'}
   Created: ${rfi.createdAt} by ${typeof rfi.createdBy === 'object' ? rfi.createdBy?.name || rfi.createdBy?.email || rfi.createdBy?.id : rfi.createdBy}
   ${rfi.questionCount ? `Questions: ${rfi.questionCount}` : ''}
   ${rfi.responseCount ? `Responses: ${rfi.responseCount}` : ''}
`;
            });

            // Add pagination info
            if (totalResults > limit) {
                const currentPage = Math.floor(offset / limit) + 1;
                const totalPages = Math.ceil(totalResults / limit);
                output += `\n📄 Page ${currentPage} of ${totalPages}`;

                if (offset + limit < totalResults) {
                    output += `\n💡 Tip: Use offset=${offset + limit} to see the next ${Math.min(limit, totalResults - offset - limit)} RFIs`;
                }
            }

            return {
                content: [{ type: "text", text: output }],
                structuredContent: { rfis, total: totalResults, pagination: result.pagination }
            };
        } catch (error) {
            const errorMessage = `❌ Failed to retrieve RFIs: ${error.message || error}`;
            return {
                content: [{ type: "text", text: errorMessage }],
                isError: true
            };
        }
    }
};
