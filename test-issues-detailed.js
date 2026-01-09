import { issuesClient } from "./utils.js";

const projectId = "b.99e37037-5a68-4ac9-b0d0-a2bd35fc7a2c";
const projectIdForAPI = projectId.replace("b.", "");

console.log("=== Detailed Issues Information - Seaport Civic Center Project ===\n");

try {
    // Get all issues
    const issuesResponse = await issuesClient.getIssues(projectIdForAPI);
    const issues = issuesResponse.results || [];
    
    console.log(`Total Issues: ${issues.length}\n`);
    
    if (issues.length === 0) {
        console.log("No issues found in this project.");
        process.exit(0);
    }
    
    // Display detailed information for each issue
    for (let i = 0; i < issues.length; i++) {
        const issue = issues[i];
        
        console.log("=".repeat(80));
        console.log(`ISSUE ${i + 1}: ${issue.title || 'Untitled'}`);
        console.log("=".repeat(80));
        
        // Basic Information
        console.log(`\n📋 Basic Information:`);
        console.log(`   ID: ${issue.id}`);
        console.log(`   Status: ${issue.status || 'N/A'}`);
        console.log(`   Issue Type ID: ${issue.issueTypeId || 'N/A'}`);
        
        // Description/Message
        if (issue.description) {
            console.log(`\n📝 Description/Message:`);
            console.log(`   ${issue.description}`);
        } else {
            console.log(`\n📝 Description/Message: (No description provided)`);
        }
        
        // Location
        if (issue.location) {
            console.log(`\n📍 Location:`);
            if (typeof issue.location === 'string') {
                console.log(`   ${issue.location}`);
            } else if (issue.location.x !== undefined) {
                console.log(`   Coordinates: X=${issue.location.x}, Y=${issue.location.y}, Z=${issue.location.z || 'N/A'}`);
            } else {
                console.log(`   ${JSON.stringify(issue.location)}`);
            }
        } else {
            console.log(`\n📍 Location: (No location specified)`);
        }
        
        // Created By
        if (issue.createdBy) {
            console.log(`\n👤 Created By:`);
            if (typeof issue.createdBy === 'string') {
                console.log(`   ${issue.createdBy}`);
            } else {
                console.log(`   Name: ${issue.createdBy.name || issue.createdBy.displayName || 'N/A'}`);
                console.log(`   Email: ${issue.createdBy.email || 'N/A'}`);
                console.log(`   ID: ${issue.createdBy.id || issue.createdBy.userId || 'N/A'}`);
            }
        } else {
            console.log(`\n👤 Created By: (Not available)`);
        }
        
        // Assigned To
        if (issue.assignedTo) {
            console.log(`\n👥 Assigned To:`);
            if (typeof issue.assignedTo === 'string') {
                console.log(`   ${issue.assignedTo}`);
            } else if (Array.isArray(issue.assignedTo)) {
                issue.assignedTo.forEach((assignee, idx) => {
                    console.log(`   ${idx + 1}. ${assignee.name || assignee.displayName || assignee.email || 'N/A'}`);
                    if (assignee.email) console.log(`      Email: ${assignee.email}`);
                });
            } else {
                console.log(`   Name: ${issue.assignedTo.name || issue.assignedTo.displayName || 'N/A'}`);
                console.log(`   Email: ${issue.assignedTo.email || 'N/A'}`);
            }
        } else {
            console.log(`\n👥 Assigned To: (Unassigned)`);
        }
        
        // Dates
        if (issue.createdAt) {
            console.log(`\n📅 Created At: ${issue.createdAt}`);
        }
        if (issue.updatedAt) {
            console.log(`   Updated At: ${issue.updatedAt}`);
        }
        if (issue.dueDate) {
            console.log(`   Due Date: ${issue.dueDate}`);
        }
        
        // Priority
        if (issue.priority) {
            console.log(`\n⚡ Priority: ${issue.priority}`);
        }
        
        // Status Details
        if (issue.statusDetails) {
            console.log(`\n📊 Status Details:`);
            console.log(`   ${JSON.stringify(issue.statusDetails, null, 2)}`);
        }
        
        // Additional fields
        const additionalFields = ['subtype', 'subtypeId', 'owner', 'watchers', 'attachments', 'comments', 'linkedIssues'];
        const hasAdditional = additionalFields.some(field => issue[field] !== undefined);
        
        if (hasAdditional) {
            console.log(`\n📎 Additional Information:`);
            if (issue.subtype) console.log(`   Subtype: ${issue.subtype}`);
            if (issue.owner) console.log(`   Owner: ${JSON.stringify(issue.owner)}`);
            if (issue.watchers && Array.isArray(issue.watchers)) {
                console.log(`   Watchers: ${issue.watchers.length}`);
            }
            if (issue.attachments && Array.isArray(issue.attachments)) {
                console.log(`   Attachments: ${issue.attachments.length}`);
            }
            if (issue.comments && Array.isArray(issue.comments)) {
                console.log(`   Comments: ${issue.comments.length}`);
            }
        }
        
        // Show full issue object for debugging (commented out, but can be enabled)
        // console.log(`\n🔍 Full Issue Object:`);
        // console.log(JSON.stringify(issue, null, 2));
        
        console.log("\n");
    }
    
    console.log("=".repeat(80));
    console.log("End of Issues List");
    console.log("=".repeat(80));
    
} catch (error) {
    console.error("Error:", error.message);
    if (error.stack) {
        console.error(error.stack);
    }
    if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    }
}

process.exit(0);


