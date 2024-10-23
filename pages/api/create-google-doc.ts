import type { NextApiRequest, NextApiResponse } from 'next'
import { google } from 'googleapis'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { content, title } = req.body

  try {
    // Set up Google Auth
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS
    if (!credentials) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set')
    }

    const parsedCredentials = JSON.parse(credentials)

    const auth = new google.auth.GoogleAuth({
      credentials: parsedCredentials,
      scopes: ['https://www.googleapis.com/auth/documents'],
    })

    const docs = google.docs({ version: 'v1', auth })

    // Create a new document
    const createResponse = await docs.documents.create({
      requestBody: {
        title,
      },
    })

    const documentId = createResponse.data.documentId

    if (!documentId) {
      throw new Error('Failed to create document: No document ID returned')
    }

    // Insert content into the document
    await docs.documents.batchUpdate({
      documentId: documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: content,
            },
          },
        ],
      },
    })

    res.status(200).json({ message: 'Google Doc created successfully', documentId })
  } catch (error: unknown) {
    console.error('Error creating Google Doc:', error)
    
    let errorMessage = 'Failed to create Google Doc'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    res.status(500).json({ error: 'Failed to create Google Doc', details: errorMessage })
  }
}