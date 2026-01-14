import { z } from "zod";
import { submittalsClient } from "../utils.js";

export const createSubmittalTool = {
    title: "Create Submittal",
    description: `
        Creates a new submittal in an Autodesk Construction Cloud (ACC) project.
        Submittals are used to formally submit materials, products, samples, or shop drawings
        for review and approval by the design team.

        Required parameters: projectId, title, submittalTypeId, dueDate
        Optional: description, number, assignedTo, status, and many other fields

        Typical workflow:
        1. Use getSubmittalTypes to get available submittal types
        2. Create submittal with required fields
        3. Attach documents/files (separate API call)
        4. Submit for review

        Use this to:
        - Submit materials for approval
        - Create shop drawing submittals
        - Submit product data sheets
        - Create sample submittals
    `,
    inputSchema: {
        projectId: z.string().nonempty(),
        title: z.string().nonempty().describe("Submittal title (required)"),
        submittalTypeId: z.string().nonempty().describe("Submittal type ID (from getSubmittalTypes)"),
        dueDate: z.string().describe("Due date in ISO8601 format (e.g., '2026-02-15')"),
        number: z.string().optional().describe("Submittal number/reference (e.g., 'S-001')"),
        description: z.string().optional().describe("Detailed description of the submittal"),
        status: z.string().optional().default("draft").describe("Initial status (default: draft)"),
        assignedTo: z.string().optional().describe("User ID to assign the submittal to"),
        specSection: z.string().optional().describe("Specification section reference"),
        ballInCourt: z.string().optional().describe("User ID of responsible party"),
        private: z.boolean().optional().describe("Whether submittal is private (default: false)")
    },
    callback: async ({ projectId, title, submittalTypeId, dueDate, number, description, status = "draft", assignedTo, specSection, ballInCourt, private: isPrivate }) => {
        const cleanProjectId = projectId.replace(/^b\./, "");

        const submittalData = {
            title,
            submittalTypeId,
            dueDate,
            status
        };

        if (number) submittalData.number = number;
        if (description) submittalData.description = description;
        if (assignedTo) submittalData.assignedTo = assignedTo;
        if (specSection) submittalData.specSection = specSection;
        if (ballInCourt) submittalData.ballInCourt = ballInCourt;
        if (isPrivate !== undefined) submittalData.private = isPrivate;

        try {
            const result = await submittalsClient.createSubmittal(cleanProjectId, submittalData);

            let output = `✅ Submittal created successfully!\n\n`;
            output += `ID: ${result.id}\n`;
            output += `Title: ${result.title}\n`;
            output += `Number: ${result.number || 'N/A'}\n`;
            output += `Status: ${result.status}\n`;
            output += `Type: ${result.type || result.submittalTypeId}\n`;
            output += `Due Date: ${result.dueDate}\n`;
            output += `Created: ${result.createdAt || new Date().toISOString()}\n`;
            if (result.assignedTo) output += `Assigned To: ${result.assignedTo}\n`;
            if (result.description) output += `\nDescription:\n${result.description}\n`;

            return { content: [{ type: "text", text: output }] };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error creating submittal: ${error.message}` }],
                isError: true
            };
        }
    }
};
