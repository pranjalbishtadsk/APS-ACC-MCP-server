import { z } from "zod";
import { issuesClient } from "../utils.js";

export const createIssueTool = {
    title: "Create Issue",
    description: `
        Creates a new issue in an Autodesk Construction Cloud (ACC) project.
        Required parameters: projectId, title, issueSubtypeId, and status.
        
        Note: Issues are created as unpublished by default. Set published=true to make them visible to all project members.
        The projectId should be provided without the 'b.' prefix.
        
        Status values: draft, open, pending, in_progress, completed, in_review, not_approved, in_dispute, closed
        AssignedToType values: user, company, role, null
    `,
    inputSchema: {
        projectId: z.string().nonempty(),
        title: z.string().max(100).nonempty(),
        issueSubtypeId: z.string().nonempty(),
        status: z.enum(["draft", "open", "pending", "in_progress", "completed", "in_review", "not_approved", "in_dispute", "closed"]),
        description: z.string().max(1000).optional(),
        assignedTo: z.string().optional(),
        assignedToType: z.enum(["user", "company", "role", "null"]).optional(),
        dueDate: z.string().optional(), // ISO8601 format: "2025-01-15"
        startDate: z.string().optional(), // ISO8601 format: "2025-01-10"
        locationId: z.string().optional(),
        locationDetails: z.string().max(250).optional(),
        rootCauseId: z.string().optional(),
        published: z.boolean().optional(),
        watchers: z.array(z.string()).optional(),
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
        title,
        issueSubtypeId,
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
        watchers,
        customAttributes,
        gpsCoordinates
    }) => {
        // Remove 'b.' prefix if present
        const cleanProjectId = projectId.replace("b.", "");

        // Build the request body with only provided fields
        const issueData = {
            title,
            issueSubtypeId,
            status
        };

        // Add optional fields only if provided
        if (description !== undefined) issueData.description = description;
        if (assignedTo !== undefined) issueData.assignedTo = assignedTo;
        if (assignedToType !== undefined) issueData.assignedToType = assignedToType;
        if (dueDate !== undefined) issueData.dueDate = dueDate;
        if (startDate !== undefined) issueData.startDate = startDate;
        if (locationId !== undefined) issueData.locationId = locationId;
        if (locationDetails !== undefined) issueData.locationDetails = locationDetails;
        if (rootCauseId !== undefined) issueData.rootCauseId = rootCauseId;
        if (published !== undefined) issueData.published = published;
        if (watchers !== undefined) issueData.watchers = watchers;
        if (customAttributes !== undefined) issueData.customAttributes = customAttributes;
        if (gpsCoordinates !== undefined) issueData.gpsCoordinates = gpsCoordinates;

        try {
            const createdIssue = await issuesClient.createIssue(cleanProjectId, issueData);
            
            const output = `✅ Issue created successfully!
- ID: ${createdIssue.id}
- Display ID: ${createdIssue.displayId}
- Title: ${createdIssue.title}
- Status: ${createdIssue.status}
- Published: ${createdIssue.published ? 'Yes' : 'No (only visible to creator/assignee)'}
${createdIssue.assignedTo ? `- Assigned to: ${createdIssue.assignedTo} (${createdIssue.assignedToType})` : ''}
${createdIssue.dueDate ? `- Due date: ${createdIssue.dueDate}` : ''}
- Created at: ${createdIssue.createdAt}
- Created by: ${createdIssue.createdBy}`;

            return {
                content: [{ type: "text", text: output }],
                structuredContent: { issue: createdIssue }
            };
        } catch (error) {
            const errorMessage = `❌ Failed to create issue: ${error.message || error}`;
            return {
                content: [{ type: "text", text: errorMessage }],
                isError: true
            };
        }
    }
};
