import { z } from "zod";
import { rfiClient } from "../utils.js";

export const createRFITool = {
    title: "Create RFI",
    description: `
        Creates a new RFI (Request for Information) in an Autodesk Construction Cloud (ACC) project.
        RFIs are formal requests for clarification or additional information from project stakeholders.

        Required parameters: projectId, title, rfiTypeId, and question.

        Common workflow:
        1. Use getRFITypesTool to get available RFI types
        2. Create RFI with question
        3. Assign to appropriate stakeholder
        4. Set due date and priority

        The projectId should be provided without the 'b.' prefix.

        Status values: draft, open, answered, closed
        Priority values: Low, Normal, High (capitalized, optional - omit for no priority)
    `,
    inputSchema: {
        projectId: z.string().nonempty(),
        title: z.string().max(250).nonempty(),
        rfiTypeId: z.string().nonempty().describe("RFI type ID (use getRFITypesTool to get available types)"),
        question: z.string().nonempty().describe("The question or request for information"),
        description: z.string().max(2000).optional().describe("DEPRECATED: Description field not supported by API v3. Include details in the 'question' field instead."),
        assignedTo: z.string().optional().describe("User ID to assign the RFI to"),
        manager: z.string().optional().describe("Manager user ID"),
        dueDate: z.string().optional().describe("Due date in ISO8601 format (e.g., 2026-01-15 or 2026-01-15T00:00:00.000Z)"),
        priority: z.enum(["Low", "Normal", "High"]).optional().describe("Priority level (Low, Normal, or High)"),
        status: z.enum(["draft", "open"]).optional().default("draft"),
        location: z.string().optional().describe("Location or area reference"),
        discipline: z.string().optional().describe("Discipline (e.g., Mechanical, Electrical, Structural)"),
        category: z.string().optional().describe("RFI category"),
        costImpact: z.boolean().optional().describe("Whether this RFI has cost impact"),
        scheduledImpact: z.string().optional().describe("Schedule impact description"),
        customIdentifier: z.string().optional().describe("Custom RFI number/identifier"),
        attachmentUrns: z.array(z.string()).optional().describe("Array of file URNs to attach"),
        customAttributes: z.array(z.object({
            attributeDefinitionId: z.string(),
            value: z.union([z.string(), z.number(), z.boolean()])
        })).optional().describe("Custom attribute values")
    },
    callback: async ({
        projectId,
        title,
        rfiTypeId,
        question,
        description,
        assignedTo,
        manager,
        dueDate,
        priority,
        status = "draft",
        location,
        discipline,
        category,
        costImpact,
        scheduledImpact,
        customIdentifier,
        attachmentUrns,
        customAttributes
    }) => {
        // Remove 'b.' prefix if present
        const cleanProjectId = projectId.replace("b.", "");

        // Build the RFI data object
        // Note: API expects 'question' (singular), not 'questions' array
        const rfiData = {
            title,
            rfiTypeId,
            question,
            status
        };

        // Add optional fields only if provided
        if (priority !== undefined) rfiData.priority = priority;
        // Note: API v3 doesn't accept 'description' at root level - it may be deprecated
        // Users should include description details in the 'question' field instead
        if (assignedTo !== undefined) rfiData.assignedTo = assignedTo;
        if (manager !== undefined) rfiData.manager = manager;
        // dueDate must be full ISO8601 datetime format
        if (dueDate !== undefined) {
            // If just a date is provided (YYYY-MM-DD), convert to full ISO8601
            rfiData.dueDate = dueDate.includes('T') ? dueDate : `${dueDate}T00:00:00.000Z`;
        }
        if (location !== undefined) rfiData.location = location;
        // Discipline and category must be arrays according to API spec
        if (discipline !== undefined) rfiData.discipline = [discipline];
        if (category !== undefined) rfiData.category = [category];
        if (costImpact !== undefined) rfiData.costImpact = costImpact;
        if (scheduledImpact !== undefined) rfiData.scheduledImpact = scheduledImpact;
        if (customIdentifier !== undefined) rfiData.customIdentifier = customIdentifier;
        if (attachmentUrns !== undefined && attachmentUrns.length > 0) {
            rfiData.attachments = attachmentUrns.map(urn => ({ urn }));
        }
        if (customAttributes !== undefined) rfiData.customAttributes = customAttributes;

        try {
            const createdRFI = await rfiClient.createRFI(cleanProjectId, rfiData);

            const output = `✅ RFI created successfully!
- ID: ${createdRFI.id}
- Custom ID: ${createdRFI.customIdentifier || 'Auto-generated'}
- Title: ${createdRFI.title}
- Status: ${createdRFI.status}
- Priority: ${createdRFI.priority || 'Normal'}
${createdRFI.assignedTo ? `- Assigned to: ${createdRFI.assignedTo}` : ''}
${createdRFI.manager ? `- Manager: ${createdRFI.manager}` : ''}
${createdRFI.dueDate ? `- Due date: ${createdRFI.dueDate}` : ''}
- Created at: ${createdRFI.createdAt}
- Created by: ${createdRFI.createdBy}

Question:
"${question}"

💡 Tip: Use getRFIDetailsTool with rfiId="${createdRFI.id}" to view full details`;

            return {
                content: [{ type: "text", text: output }],
                structuredContent: { rfi: createdRFI }
            };
        } catch (error) {
            const errorMessage = `❌ Failed to create RFI: ${error.message || error}

💡 Common issues:
- Invalid rfiTypeId (use getRFITypesTool to get valid types)
- Missing required fields (projectId, title, rfiTypeId, question)
- Invalid user IDs for assignedTo or manager
- Date format should be ISO8601 (YYYY-MM-DD)
- Priority must be "Low", "Normal", or "High" (capitalized)`;

            return {
                content: [{ type: "text", text: errorMessage }],
                isError: true
            };
        }
    }
};
