import React from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function BriefConfirmation() {
  const router = useRouter()
  const { documentUrl, logoUrl } = router.query

  if (!documentUrl) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-4xl font-bold mb-8">My Brief</h1>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Company Logo</h2>
        <Image
          src={logoUrl as string || '/placeholder.svg?height=100&width=100'}
          alt="Company Logo"
          width={200}
          height={200}
          className="rounded-md"
          unoptimized
        />
      </div>
      <CheckCircle className="w-24 h-24 text-green-500 mb-8" />
      <Link href={documentUrl as string} target="_blank" rel="noopener noreferrer">
        <Button size="lg" className="text-lg">
          View my brief
        </Button>
      </Link>
    </div>
  )
}