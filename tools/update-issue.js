import { z } from "zod";
import { issuesClient } from "../utils.js";

export const updateIssueTool = {
    title: "Update Issue",
    description: `
        Updates an existing issue in an Autodesk Construction Cloud (ACC) project.
        You can update various properties such as title, status, description, assignee, dates, location, etc.
        
        Required parameters: projectId and issueId.
        At least one field to update must be provided.
        The projectId should be provided without the 'b.' prefix.
        
        Note: Only provided fields will be updated; omitted fields remain unchanged.
        To verify which attributes can be updated, use getIssueDetailsTool first to check permittedAttributes.
    `,
    inputSchema: {
        projectId: z.string().nonempty(),
        issueId: z.string().nonempty(),
        title: z.string().max(100).optional(),
        status: z.enum(["draft", "open", "pending", "in_progress", "completed", "in_review", "not_approved", "in_dispute", "closed"]).optional(),
        description: z.string().max(1000).optional(),
        assignedTo: z.string().optional(),
        assignedToType: z.enum(["user", "company", "role", "null"]).optional(),
        dueDate: z.string().optional(), // ISO8601 format: "2025-01-15"
        startDate: z.string().optional(), // ISO8601 format: "2025-01-10"
        locationId: z.string().optional(),
        locationDetails: z.string().max(250).optional(),
        rootCauseId: z.string().optional(),
        published: z.boolean().optional(),
        issueSubtypeId: z.string().optional(),
        customAttributes: z.array(z.object({
            attributeDefinitionId: z.string(),
            value: z.string()
        })).optional(),
        gpsCoordinates: z.object({
            latitude: z.number(),
            longitude: z.number()
        }).optional()
    },
    callback: async ({
        projectId,
        issueId,
        title,
        status,
        description,
        assignedTo,
        assignedToType,
        dueDate,
        startDate,
        locationId,
        locationDetails,
        rootCauseId,
        published,
        issueSubtypeId,
        customAttributes,
        gpsCoordinates
    }) => {
        // Remove 'b.' prefix if present
        const cleanProjectId = projectId.replace("b.", "");

        // Build the update payload with only provided fields
        const updateData = {};

        if (title !== undefined) updateData.title = title;
        if (status !== undefined) updateData.status = status;
        if (description !== undefined) updateData.description = description;
        if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
        if (assignedToType !== undefined) updateData.assignedToType = assignedToType;
        if (dueDate !== undefined) updateData.dueDate = dueDate;
        if (startDate !== undefined) updateData.startDate = startDate;
        if (locationId !== undefined) updateData.locationId = locationId;
        if (locationDetails !== undefined) updateData.locationDetails = locationDetails;
        if (rootCauseId !== undefined) updateData.rootCauseId = rootCauseId;
        if (published !== undefined) updateData.published = published;
        if (issueSubtypeId !== undefined) updateData.issueSubtypeId = issueSubtypeId;
        if (customAttributes !== undefined) updateData.customAttributes = customAttributes;
        if (gpsCoordinates !== undefined) updateData.gpsCoordinates = gpsCoordinates;

        // Check if at least one field to update is provided
        if (Object.keys(updateData).length === 0) {
            return {
                content: [{ type: "text", text: "❌ No fields to update. Please provide at least one field to update." }],
                isError: true
            };
        }

        try {
            const updatedIssue = await issuesClient.patchIssueDetails(cleanProjectId, issueId, updateData);
            
            const changedFields = Object.keys(updateData).map(key => `- ${key}: ${updateData[key]}`).join('\n');
            
            const output = `✅ Issue updated successfully!
- ID: ${updatedIssue.id}
- Display ID: ${updatedIssue.displayId}
- Title: ${updatedIssue.title}
- Status: ${updatedIssue.status}

Updated fields:
${changedFields}

- Updated at: ${updatedIssue.updatedAt}
- Updated by: ${updatedIssue.updatedBy}`;

            return {
                content: [{ type: "text", text: output }],
                structuredContent: { issue: updatedIssue }
            };
        } catch (error) {
            const errorMessage = `❌ Failed to update issue: ${error.message || error}`;
            return {
                content: [{ type: "text", text: errorMessage }],
                isError: true
            };
        }
    }
};
