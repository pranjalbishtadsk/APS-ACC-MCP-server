# Testing Guide for ACC Issues MCP Tools

This guide provides example prompts to test all implemented MCP tools for Autodesk Construction Cloud Issues.

## Prerequisites

Before testing, make sure you have:
1. MCP Inspector running: `npx @modelcontextprotocol/inspector`
2. Or Claude Desktop/VS Code configured with the MCP server
3. Valid project ID and issue IDs from your ACC project

## 🔍 Getting Started

### 1. Get Projects (getProjectsTool)

**Natural Language Prompts:**
```
"What ACC projects do I have access to?"
"List all my projects"
"Show me available projects and their IDs"
```

**Expected Output:**
- List of accounts with project names and IDs
- Use these project IDs for subsequent tests

---

## 📋 Issue Management Tools

### 2. List Issues (getIssuesTool)

**Natural Language Prompts:**
```
"List all issues in project [PROJECT_ID]"
"Show me all open issues"
"What issues do we have in the Seaport Civic Center project?"
"How many issues are in the project?"
```

**Expected Output:**
- List of issues with IDs, titles, and statuses
- Note issue IDs for detailed queries

---

### 3. Get Issue Details (getIssueDetailsTool)

**Natural Language Prompts:**
```
"Show me detailed information for issue [ISSUE_ID]"
"Get full details of issue abc123 in project [PROJECT_ID]"
"What are the comments and attachments for issue [ISSUE_ID]?"
"Tell me everything about issue [ISSUE_ID] including its history"
```

**Example Specific Prompt:**
```
"Get detailed information for issue afa55451-45d9-43f4-a0c3-f485f2fcb837 
in project 9e7d8e6a-79e8-428e-83a7-dfd2e778fe35"
```

**Expected Output:**
- Complete issue information
- Description, assignee, dates, location
- Comments with timestamps and authors
- Attachments with metadata
- Custom attributes and watchers

---

### 4. Create Issue (createIssueTool)

**Basic Creation Prompts:**
```
"Create a new issue titled 'Electrical Outlet Missing in Room 205'"
"Add an issue about the broken HVAC system on Level 3"
"Create an open issue for the damaged drywall in conference room"
```

**Detailed Creation Prompt:**
```
"Create a new issue with the following details:
- Title: Water Damage in Basement Storage Area
- Status: open
- Description: Discovered water seepage near east wall, approximately 3x4 feet affected area
- Due date: 2026-01-15
- Location: Basement Level, Storage Room B-102"
```

**Advanced Creation with All Fields:**
```
"Create a comprehensive issue:
- Title: Structural Beam Alignment Issue - Grid B4
- Status: open  
- Description: Structural beam at grid intersection B4 shows 2-inch misalignment from design specifications. Requires immediate structural engineer review.
- Issue subtype ID: [get from getIssueTypesTool first]
- Assigned to: [user ID]
- Due date: 2026-01-20
- Start date: 2026-01-09
- Location: Level 5, Grid Area B4
- Published: true"
```

**Expected Output:**
- Success message with created issue ID and display ID
- All provided field values
- Creation timestamp and creator

---

### 5. Update Issue (updateIssueTool)

**Status Update Prompts:**
```
"Update issue [ISSUE_ID] status to 'in_progress'"
"Mark issue abc123 as completed"
"Change the status of issue [ISSUE_ID] to 'closed'"
```

**Assignment Update Prompts:**
```
"Assign issue [ISSUE_ID] to user [USER_ID]"
"Update issue [ISSUE_ID] assignee to John Doe (USER_ID: ABC123)"
"Change the assignedToType to 'company' for issue [ISSUE_ID]"
```

**Multiple Fields Update:**
```
"Update issue [ISSUE_ID]:
- Status: in_progress
- Due date: 2026-01-25
- Description: Added contractor quote: $2,500 for repairs. Materials ordered."
```

**Title and Description Update:**
```
"For issue [ISSUE_ID], update the title to 'Concrete Repair - Level 2 Complete' 
and add description: 'Surface grinding completed, sealant applied, curing in progress'"
```

**Example Specific Prompt:**
```
"Update issue afa55451-45d9-43f4-a0c3-f485f2fcb837 in project 9e7d8e6a-79e8-428e-83a7-dfd2e778fe35:
- Status: in_progress
- Description: Work started on 2026-01-08, contractor on site
- Due date: 2026-01-20"
```

**Expected Output:**
- Success message with updated issue details
- List of changed fields with new values
- Update timestamp and updater ID

---

### 6. Add Comment (addIssueCommentTool)

**Simple Comment Prompts:**
```
"Add a comment to issue [ISSUE_ID]: 'Work completed, ready for inspection'"
"Comment on issue abc123: 'Contractor will be on site tomorrow at 9 AM'"
"Add 'Materials delivered, waiting for electrical inspector' to issue [ISSUE_ID]"
```

**Status Update Comments:**
```
"Add a comment to issue [ISSUE_ID]: 
'Update: 60% complete. Drywall installation finished, mudding and taping in progress. 
Expected completion by Friday.'"
```

**Question/Clarification Comments:**
```
"Comment on issue [ISSUE_ID]: 
'Question for project manager: Should we use Type X or Type C drywall? 
Structural requirements unclear in specs.'"
```

**Example Specific Prompt:**
```
"Add a comment to issue afa55451-45d9-43f4-a0c3-f485f2fcb837 in project 9e7d8e6a-79e8-428e-83a7-dfd2e778fe35:
'Inspection completed. Found additional minor cracks in adjacent area. Recommend expanding repair scope.'"
```

**Expected Output:**
- Success message with comment ID
- Comment text
- Creation timestamp and creator
- Associated issue ID

---

### 7. Add Attachment (addIssueAttachmentTool)

**Note:** This tool has limitations in the current SDK implementation. It's designed to attach existing files from the project's document management.

**Conceptual Prompts (for documentation):**
```
"Attach file with URN [FILE_URN] to issue [ISSUE_ID]"
"Add the inspection report (URN: urn:...) to issue abc123"
"Attach the photo from folder contents to this issue"
```

**Expected Output:**
- Currently returns a limitation notice explaining workarounds
- Suggests using Data Management API for file uploads
- Provides guidance on referencing files via linkedDocuments

---

## 🔄 Complete Workflow Examples

### Workflow 1: Create and Track an Issue

```
1. "List all my ACC projects"
   → Get project ID

2. "Get available issue types for project [PROJECT_ID]"
   → Get issue subtype ID

3. "Create a new issue:
   - Title: Paint Touch-up Required - Main Lobby
   - Status: open
   - Issue subtype: [SUBTYPE_ID from step 2]
   - Description: Multiple scuff marks on walls near elevator bay"
   → Get new issue ID

4. "Add comment to issue [NEW_ISSUE_ID]: 
   'Scheduled for tomorrow 8 AM with painting crew'"

5. "Get details for issue [NEW_ISSUE_ID]"
   → Verify issue and comment were created

6. "Update issue [NEW_ISSUE_ID] status to 'in_progress'"

7. "Add comment to issue [NEW_ISSUE_ID]: 'Work completed, paint drying'"

8. "Update issue [NEW_ISSUE_ID] status to 'completed'"
```

---

### Workflow 2: Issue Review and Updates

```
1. "List all open issues in project [PROJECT_ID]"
   → Review current issues

2. "Show detailed information for issue [ISSUE_ID]"
   → Examine specific issue

3. "Add comment: 'Reviewed during site visit, coordinating with subcontractor'"

4. "Update the issue:
   - Assigned to: [USER_ID]
   - Due date: 2026-01-25
   - Status: in_progress"

5. "Get details again to confirm changes"
```

---

### Workflow 3: Daily Issue Management

```
Morning:
"List all issues in my project - show me what needs attention today"

For Each Priority Issue:
- "Get details for issue [ID]"
- "Add comment with status update"
- "Update status if work progressed"

End of Day:
"Show me all issues I commented on today"
"List all issues that are in_progress"
```

---

## 🧪 Test Data Suggestions

### Good Test Issues to Create:

1. **Simple Issue:**
   - Title: "Test Issue - Door Lock Broken"
   - Status: open
   - Description: "Test issue for MCP tools validation"

2. **Complex Issue:**
   - Title: "HVAC System Noise - Executive Office Suite"
   - Status: open
   - Description: "Excessive noise from HVAC during operation. Affects rooms 401-405. Needs immediate attention per tenant complaint."
   - Due date: 7 days from now
   - Location details: "Level 4, North Wing"

3. **Issue for Status Changes:**
   - Create with status: "open"
   - Update to: "in_progress"
   - Add comments at each stage
   - Finally update to: "completed"

---

## 📊 Testing Checklist

- [ ] Successfully retrieved projects list
- [ ] Listed all issues in a project
- [ ] Retrieved detailed information for at least one issue
- [ ] Created a new issue with minimal fields (title, status, subtype)
- [ ] Created a new issue with multiple optional fields
- [ ] Updated an issue's status
- [ ] Updated an issue's title and description
- [ ] Updated multiple fields in a single call
- [ ] Added a comment to an issue
- [ ] Added multiple comments to track progress
- [ ] Verified all changes using getIssueDetailsTool
- [ ] Tested error handling (invalid IDs, missing fields, etc.)

---

## 🐛 Troubleshooting

### Common Issues:

**"Issue not found"**
- Verify project ID doesn't have 'b.' prefix
- Confirm issue ID is correct
- Ensure you have access to the project

**"Authentication failed"**
- Check .env file has correct credentials
- Verify SSA has access to the project
- Ensure SSA private key path is correct

**"Missing required field"**
- For createIssue: Need title, issueSubtypeId, and status
- For updateIssue: Need at least one field to update
- For addComment: Need comment text

**"Invalid status value"**
- Valid statuses: draft, open, pending, in_progress, completed, in_review, not_approved, in_dispute, closed
- Use exact spelling and lowercase

---

## 📝 Notes

- All projectId parameters automatically remove 'b.' prefix if present
- Dates should be in ISO8601 format: "YYYY-MM-DD"
- Issue IDs are UUIDs (e.g., "afa55451-45d9-43f4-a0c3-f485f2fcb837")
- Comments are added by the service account, not individual users
- Attachments require files to already exist in project document management

---

## 🚀 Next Steps

After testing these tools, consider:
1. Building automation scripts using these tools
2. Creating custom workflows for your team
3. Integrating with other systems via MCP
4. Extending with additional ACC API endpoints
5. Building dashboards using the structured data returned

---

## 📚 Additional Resources

- [ACC Issues API Documentation](https://aps.autodesk.com/en/docs/acc/v1/reference/http/issues-v1-projects-projectId-issues-POST/)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [APS SDK GitHub](https://github.com/autodesk-platform-services)
