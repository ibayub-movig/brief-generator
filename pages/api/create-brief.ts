import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { website, description, deliverables, email } = req.body

  // Here you would typically use an AI service or your own logic to generate the brief
  // For this example, we'll just create a simple template
  const brief = `
    Brief for ${website}

    Description:
    ${description}

    Deliverables:
    ${deliverables}

    Contact Email: ${email}

    Generated on: ${new Date().toLocaleString()}
  `

  res.status(200).json({ brief })
}