import { z } from 'zod';

/**
 * Upload Photo Tool - Placeholder for ACC Photos API
 * 
 * NOTE: This is a placeholder/documentation tool. Photo uploads require:
 * 1. @aps_sdk/construction-photos package (if available)
 * 2. File upload handling via Data Management API
 * 3. Additional scopes: photos:write, data:write
 * 
 * ACC Photos are typically uploaded through:
 * - ACC Mobile App (primary method)
 * - ACC Web Interface
 * - Photos API (programmatic)
 */
export const uploadPhotoTool = {
  name: 'uploadPhoto',
  description: `Upload a photo to an ACC project.
  
  **Implementation Status**: PLACEHOLDER/DOCUMENTATION ONLY
  
  **Why This Is Complex**:
  - Requires file upload handling (binary data)
  - Needs Data Management API for storage
  - Photos API for metadata
  - Geo-location and markup support
  
  **Recommended Approach**:
  1. Use ACC Mobile App for site photos (easiest)
  2. Use ACC Web Interface for desktop uploads
  3. For programmatic access, implement:
     - File upload to ACC storage via Data Management API
     - Photo metadata via Photos API
     - Link photo to location/issue if needed
  
  This tool documents the process rather than implementing it.`,
  
  inputSchema: z.object({
    projectId: z.string().min(1).describe('ACC project ID (starts with b.)'),
    photoPath: z.string().describe('Local file path to photo'),
    title: z.string().optional().describe('Photo title/description'),
    location: z.string().optional().describe('Location or area where photo was taken'),
    linkedIssueId: z.string().optional().describe('Optional issue ID to link photo to')
  }),
  
  async execute({ projectId, photoPath, title, location, linkedIssueId }) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'NOT_IMPLEMENTED',
            message: 'Photo upload requires complex file handling and is not implemented in this version',
            providedInput: {
              projectId,
              photoPath,
              title,
              location,
              linkedIssueId
            },
            implementationGuidance: {
              step1: {
                title: 'Upload file to ACC storage',
                method: 'Data Management API',
                endpoint: 'POST /oss/v2/buckets/:bucketKey/objects/:objectName',
                notes: 'Upload the photo file as binary data'
              },
              step2: {
                title: 'Create photo metadata',
                method: 'Photos API (when available)',
                package: '@aps_sdk/construction-photos',
                notes: 'Associate uploaded file with photo metadata, location, tags'
              },
              step3: {
                title: 'Optional: Link to issue',
                method: 'Issues API',
                function: 'createAttachments or update linkedDocuments',
                notes: 'Link the photo to an existing issue if provided'
              }
            },
            alternatives: {
              accMobileApp: 'Best for field photos with automatic geo-tagging',
              accWebInterface: 'Good for bulk uploads from desktop',
              dataManagementAPI: 'For programmatic file management only'
            },
            requiredScopes: ['photos:write', 'data:write'],
            requiredPackages: [
              '@aps_sdk/construction-photos',
              '@aps_sdk/data-management'
            ]
          }, null, 2)
        }
      ]
    };
  }
};
