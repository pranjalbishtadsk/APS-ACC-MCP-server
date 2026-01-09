import { z } from 'zod';
import { issuesClient } from '../utils.js';

/**
 * List Photos Tool - Placeholder for ACC Photos API
 * 
 * NOTE: This is a placeholder implementation. ACC Photos API requires:
 * 1. @aps_sdk/construction-photos package (if available)
 * 2. Additional scopes: photos:read
 * 
 * Current implementation uses Issues API to list issues with photo attachments
 * as a workaround until proper Photos API is available.
 */
export const listPhotosTool = {
  name: 'listPhotos',
  description: `Lists photos from an ACC project. 
  
  **Current Implementation**: Lists issues with photo attachments as a workaround.
  
  **Future Enhancement**: Will use dedicated Photos API when available.
  
  Use this to:
  - View site photos uploaded to project
  - Filter photos by location or type
  - Get photo counts and summaries`,
  
  inputSchema: z.object({
    projectId: z.string().min(1).describe('ACC project ID (starts with b.)'),
    filterId: z.string().optional().describe('Optional filter ID to apply'),
    limit: z.number().min(1).max(100).default(25).describe('Maximum number of photos to return (1-100, default 25)')
  }),
  
  async execute({ projectId, filterId, limit = 25 }) {
    try {
      // Workaround: Get issues with attachments
      // In practice, issues with photos would have attachments
      const result = await issuesClient.getIssues(
        projectId,
        filterId,
        undefined, // fields
        undefined, // sort
        limit,
        0 // offset
      );
      
      // Filter for issues likely to have photos (with attachments)
      const issuesWithAttachments = result.results?.filter(issue => 
        issue.attachmentCount && issue.attachmentCount > 0
      ) || [];
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              note: 'This is a workaround implementation using Issues API',
              message: 'For full Photos API support, install @aps_sdk/construction-photos (when available)',
              photosFound: issuesWithAttachments.length,
              totalIssuesChecked: result.results?.length || 0,
              issuesWithPhotos: issuesWithAttachments.map(issue => ({
                issueId: issue.id,
                title: issue.title,
                attachmentCount: issue.attachmentCount,
                createdAt: issue.createdAt,
                createdBy: issue.createdBy
              })),
              implementation: {
                current: 'Issues API with attachment filtering',
                future: 'Dedicated ACC Photos API',
                requiredPackage: '@aps_sdk/construction-photos',
                requiredScopes: ['photos:read']
              }
            }, null, 2)
          }
        ]
      };
      
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listing photos: ${error.message}\n\nNote: This is a placeholder implementation. Full Photos API support requires @aps_sdk/construction-photos package.`
          }
        ],
        isError: true
      };
    }
  }
};
