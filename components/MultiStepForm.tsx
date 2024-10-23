import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface BrandDetails {
  name: string;
  description: string;
  logos?: Array<{
    formats: Array<{
      src: string;
    }>;
  }>;
}

interface Suggestion {
  domain: string;
  logo?: string;
}

const campaignGoals = [
  { id: 'increase-sales', label: 'Increase Sales' },
  { id: 'increase-downloads', label: 'Increase Downloads' },
  { id: 'increase-views', label: 'Increase Views' },
  { id: 'other', label: 'Other' },
]

export default function MultiStepForm() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [brandDetails, setBrandDetails] = useState<BrandDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [keyCallouts, setKeyCallouts] = useState('')
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [otherGoal, setOtherGoal] = useState('')
  const [deliverables, setDeliverables] = useState('')
  const [creatorProfiles, setCreatorProfiles] = useState('')
  const [generatedBrief, setGeneratedBrief] = useState('')

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (website.length > 2) {
        try {
          const response = await fetch(`/api/brandfetch-search?query=${encodeURIComponent(website)}`)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const data = await response.json()
          if (Array.isArray(data)) {
            setSuggestions(data.map(item => ({
              domain: item.domain,
              logo: item.logo
            })))
            setShowSuggestions(true)
          } else {
            throw new Error('Unexpected data format')
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error)
          setError('Failed to fetch suggestions. Please try again.')
          setSuggestions([])
        }
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }

    const debounce = setTimeout(() => {
      fetchSuggestions()
    }, 300)

    return () => clearTimeout(debounce)
  }, [website])

  const handleWebsiteSelect = (selected: Suggestion) => {
    setWebsite(selected.domain)
    setCompanyName(selected.domain.split('.')[0]) // Simple way to set company name, adjust as needed
    setShowSuggestions(false)
  }

  const handleClearWebsite = () => {
    setWebsite('')
    setCompanyName('')
    setShowSuggestions(false)
  }

  const handleFillDetails = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/brandfetch-details?domain=${encodeURIComponent(website)}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: BrandDetails = await response.json()
      setBrandDetails(data)
      setCompanyName(data.name)
    } catch (error) {
      console.error('Error fetching brand details:', error)
      setError('Failed to fetch brand details. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBrief = async () => {
    try {
      const goals = selectedGoals.includes('other') ? [...selectedGoals.filter(g => g !== 'other'), otherGoal] : selectedGoals
      const webhookResponse = await fetch('https://hook.eu1.make.com/k1kkrkj1h8o1o4uosmwnr4sm21n0o97o', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          website,
          companyName,
          description: brandDetails?.description,
          logoUrl: brandDetails?.logos?.[0]?.formats?.[0]?.src,
          targetAudience,
          keyCallouts,
          campaignGoals: goals,
          deliverables,
          creatorProfiles,
        }),
      })

      if (!webhookResponse.ok) {
        throw new Error(`Webhook HTTP error! status: ${webhookResponse.status}`)
      }

      const webhookData = await webhookResponse.json()
      setGeneratedBrief(JSON.stringify(webhookData, null, 2))
      setStep(4)
    } catch (error) {
      console.error('Error triggering webhook:', error)
      setError('Failed to create brief. Please try again.')
    }
  }

  return (
    <Card className="w-[600px]">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">Movig UGC Campaign Brief Generator</CardTitle>
        <CardDescription className="text-lg">Instantly create a brief in google docs</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-lg font-semibold">Your Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg font-semibold">Your Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="text-lg"
              />
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website" className="text-lg font-semibold">Company Website</Label>
              <div className="relative">
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="Enter company website"
                  className="text-lg"
                />
                {website && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={handleClearWebsite}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <ul className="mt-2 max-h-60 overflow-auto rounded-md border border-gray-200 bg-white">
                  {suggestions.map((suggestion, index) => (
                    
                    <li
                      key={index}
                      className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleWebsiteSelect(suggestion)}
                    >
                      {suggestion.logo && (
                        <img src={suggestion.logo} alt="Logo" className="w-6 h-6 mr-2" />
                      )}
                      {suggestion.domain}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-lg font-semibold">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name will auto-populate"
                className="text-lg"
              />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Campaign Goal</Label>
              {campaignGoals.map((goal) => (
                <div className="flex items-center space-x-2" key={goal.id}>
                  <Checkbox
                    id={goal.id}
                    checked={selectedGoals.includes(goal.id)}
                    onCheckedChange={(checked: boolean) => {
                      setSelectedGoals(
                        checked
                          ? [...selectedGoals, goal.id]
                          : selectedGoals.filter((id) => id !== goal.id)
                      )
                    }}
                  />
                  <label
                    htmlFor={goal.id}
                    className="text-lg font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {goal.label}
                  </label>
                </div>
              ))}
              {selectedGoals.includes('other') && (
                <Input
                  value={otherGoal}
                  onChange={(e) => setOtherGoal(e.target.value)}
                  placeholder="Enter other goal"
                  className="mt-2 text-lg"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliverables" className="text-lg font-semibold">Deliverables</Label>
              <Textarea
                id="deliverables"
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                rows={2}
                placeholder="Enter deliverables"
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creatorProfiles" className="text-lg font-semibold">Creator Profiles</Label>
              <Textarea
                id="creatorProfiles"
                value={creatorProfiles}
                onChange={(e) => setCreatorProfiles(e.target.value)}
                rows={2}
                placeholder="Describe creator profiles"
                className="text-lg"
              />
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Generated Brief</Label>
            <Textarea value={generatedBrief} readOnly rows={10} className="text-lg" />
          </div>
        )}
      </CardContent>
      <CardFooter>
        {step === 1 && (
          <Button onClick={() => setStep(2)} disabled={!name || !email} className="w-full text-lg">
            Get Started
          </Button>
        )}
        {step === 2 && (
          <>
            <Button onClick={handleFillDetails} disabled={!website || isLoading} className="w-full text-lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                'Fill Details'
              )}
            </Button>
            {brandDetails && (
              <Button onClick={() => setStep(3)} className="ml-2 w-full text-lg">
                Campaign Details
              </Button>
            )}
          </>
        )}
        {step === 3 && (
          <Button onClick={handleCreateBrief} disabled={selectedGoals.length === 0 || !deliverables || !creatorProfiles} className="w-full text-lg">
            Create Brief
          </Button>
        )}
        {step === 4 && (
          <Button onClick={() => navigator.clipboard.writeText(generatedBrief)} className="w-full text-lg">
            Copy to Clipboard
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}