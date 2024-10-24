import { google, docs_v1 } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';

interface RequestBody {
  templateId: string;
  title: string;
  folderName: string;
  replacements: Record<string, string>;
  userEmail: string;
  logoUrl: string;
  website: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { templateId, title, folderName, replacements, userEmail, logoUrl, website } = req.body as RequestBody;

    console.log('Received request with:', { templateId, title, folderName, userEmail, logoUrl, website });

    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set');
    }

    let credentials;
    try {
      credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      console.log('Credentials parsed successfully');
    } catch (error) {
      console.error('Error parsing GOOGLE_APPLICATION_CREDENTIALS:', error);
      throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS format');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/documents'],
    });

    console.log('Auth client created');

    const drive = google.drive({ version: 'v3', auth });
    const docs = google.docs({ version: 'v1', auth });

    // Check if the template file exists and is accessible
    try {
      console.log('Checking template file...');
      const file = await drive.files.get({
        fileId: templateId,
        fields: 'id, name',
        supportsAllDrives: true,
      });
      console.log('Template file found:', file.data);
    } catch (error) {
      console.error('Error checking template file:', error);
      throw new Error('Template file not found or not accessible. Please check the file ID and permissions.');
    }

    // Copy the template
    let copyResponse;
    try {
      console.log('Copying template...');
      copyResponse = await drive.files.copy({
        fileId: templateId,
        requestBody: {
          name: title,
          parents: [folderName],
        },
        supportsAllDrives: true,
      });
      console.log('File copied successfully:', copyResponse.data);
    } catch (error) {
      console.error('Error copying template:', error);
      throw new Error('Failed to copy template. Please check folder permissions.');
    }

    const documentId = copyResponse.data.id;

    if (!documentId) {
      throw new Error('Failed to create document: No document ID returned');
    }

    // Get the document content
    let document: docs_v1.Schema$Document;
    try {
      console.log('Getting document content...');
      const response = await docs.documents.get({
        documentId: documentId,
      });
      if (!response.data) {
        throw new Error('No document data returned');
      }
      document = response.data;
      console.log('Document content retrieved successfully');
    } catch (error) {
      console.error('Error getting document content:', error);
      throw new Error('Failed to get document content');
    }

    // Replace placeholders and insert the logo
    try {
      console.log('Updating document content...');
      const requests: docs_v1.Schema$Request[] = Object.entries(replacements).map(([key, value]) => ({
        replaceAllText: {
          containsText: { text: key, matchCase: true },
          replaceText: value,
        },
      }));

      // Insert the logo using the website
      requests.push({
        insertInlineImage: {
          location: {
            index: 1, // Insert at the beginning of the document
          },
          uri: `https://logo.clearbit.com/${website}`,
          objectSize: {
            height: {
              magnitude: 100,
              unit: 'PT',
            },
            width: {
              magnitude: 100,
              unit: 'PT',
            },
          },
        },
      } as docs_v1.Schema$Request);

      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: requests,
        },
      });
      console.log('Document content updated successfully');
    } catch (error) {
      console.error('Error updating document content:', error);
      if (error instanceof Error && 'response' in error) {
        const googleError = error as { response?: { data?: unknown } };
        if (googleError.response?.data) {
          console.error('Response data:', googleError.response.data);
        }
      }
      throw new Error('Failed to update document content: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }

    // Set permissions for the user
    try {
      console.log('Setting document permissions...');
      await drive.permissions.create({
        fileId: documentId,
        requestBody: {
          role: 'writer',
          type: 'user',
          emailAddress: userEmail,
        },
      });
      console.log('Permissions set successfully');
    } catch (error) {
      console.error('Error setting permissions:', error);
      throw new Error('Failed to set document permissions');
    }

    // Get the document URL
    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    console.log('Document created successfully:', documentUrl);
    res.status(200).json({ documentUrl });
  } catch (error) {
    console.error('Error in create-document API:', error);
    res.status(500).json({ 
      message: 'Failed to create document', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}