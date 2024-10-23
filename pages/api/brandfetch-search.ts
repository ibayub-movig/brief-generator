import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req.query

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' })
  }

  const url = `https://api.brandfetch.io/v2/search/${encodeURIComponent(query as string)}`

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.BRANDFETCH_API_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    console.error('Error fetching data from Brandfetch:', error)
    res.status(500).json({ error: 'Failed to fetch data from Brandfetch' })
  }
}