import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface BrandDetails {
  name: string;
  description: string;
  logos: {
    type: string;
    theme: string;
    formats: {
      src: string;
      background: string;
      format: string;
      size: number;
      width: number;
      height: number;
    }[];
  }[];
}

interface Suggestion {
  domain: string;
  logo: string | null;
  name: string;
  icon: string | null;
}

const campaignGoals = [
  { id: 'increase-sales', label: 'Increase Sales' },
  { id: 'increase-downloads', label: 'Increase Downloads' },
  { id: 'increase-views', label: 'Increase Views' },
  { id: 'other', label: 'Other' },
]

export default function MultiStepForm() {
  const router = useRouter();
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
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [otherGoal, setOtherGoal] = useState('')
  const [deliverables, setDeliverables] = useState('')
  const [creatorProfiles, setCreatorProfiles] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showGeneratingDialog, setShowGeneratingDialog] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    console.log('logoUrl changed:', logoUrl);
  }, [logoUrl]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (website.length > 2) {
        try {
          const response = await fetch(`/api/brandfetch-search?query=${encodeURIComponent(website)}`)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const data = await response.json()
          console.log('Suggestions data:', data);
          if (Array.isArray(data)) {
            setSuggestions(data.map(item => ({
              domain: item.domain,
              logo: item.logo,
              name: item.name,
              icon: item.icon
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

    if (website && !brandDetails) {
      const debounce = setTimeout(() => {
        fetchSuggestions()
      }, 300)

      return () => clearTimeout(debounce)
    }
  }, [website, brandDetails])

  const handleWebsiteSelect = (selected: Suggestion) => {
    console.log('Selected suggestion:', selected);
    setWebsite(selected.domain);
    setCompanyName(selected.name);
    setBrandDetails(null);
    setShowSuggestions(false);
    const cdnLogoUrl = `https://cdn.brandfetch.io/${selected.domain}`;
    setLogoUrl(cdnLogoUrl);
    console.log('Set logo URL to:', cdnLogoUrl);
  };

  const handleClearWebsite = () => {
    setWebsite('');
    setCompanyName('');
    setBrandDetails(null);
    setShowSuggestions(false);
    setLogoUrl(null);
  };

  const handleAddCompanyInfo = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/brandfetch-details?domain=${encodeURIComponent(website)}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: BrandDetails = await response.json()
      console.log('Fetched brand details:', data);
      setBrandDetails(data)
      setCompanyName(data.name)
    
      const cdnLogoUrl = `https://cdn.brandfetch.io/${website}`
      console.log('Setting logo URL to:', cdnLogoUrl);
      setLogoUrl(cdnLogoUrl)
    
      setStep(3)
    } catch (error) {
      console.error('Error fetching brand details:', error)
      setError('Failed to fetch brand details. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBrief = async () => {
    setIsGenerating(true);
    setShowGeneratingDialog(true);
    setError('');
    try {
      const goals = selectedGoals.includes('other') ? [...selectedGoals.filter(g => g !== 'other'), otherGoal] : selectedGoals;
      const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: '2-digit' });
      const documentTitle = `${companyName} UGC Campaign Brief ${currentDate}`;

      const finalLogoUrl = logoUrl || '/placeholder.svg?height=100&width=100';
      console.log('Final logo URL:', finalLogoUrl)

      const response = await fetch('/api/create-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: '1Zz8av1eOLUPH4jeE5g2BWRB8MesFm3A_nMUgZBfkdX8',
          title: documentTitle,
          folderName: '1A8TB6UTU9pW_R-wgGLrIuXJ2Q2UNZTHh',
          replacements: {
            '{{bname}}': companyName,
            '{{website}}': website,
            '{{description}}': brandDetails?.description || '',
            '{{logo}}': finalLogoUrl,
            '{{targetAudience}}': targetAudience,
            '{{campaignGoals}}': goals.join(', '),
            '{{deliverables}}': deliverables,
            '{{creatorProfiles}}': creatorProfiles,
          },
          userEmail: email,
          logoUrl: finalLogoUrl,
          website: website, // Include the website in the API call
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to create brief');
      }

      const { documentUrl } = await response.json();
      router.push(`/brief-confirmation?documentUrl=${encodeURIComponent(documentUrl)}&logoUrl=${encodeURIComponent(finalLogoUrl)}`);
    } catch (error) {
      console.error('Error creating brief:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred while creating the brief. Please try again or contact support.');
      setShowGeneratingDialog(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
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
              <AlertDescription>
                {error}
                {error.includes('Failed to create brief') && (
                  <p className="mt-2">
                    There was an issue with creating the document. Please try again or contact support if the problem persists.
                  </p>
                )}
              </AlertDescription>
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
                      type="button"
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
                        {suggestion.icon && (
                          <Image
                            src={suggestion.icon}
                            alt={`${suggestion.name} icon`}
                            width={24}
                            height={24}
                            className="mr-2"
                            unoptimized
                          />
                        )}
                        <span>{suggestion.name}</span>
                        <span className="ml-auto text-sm text-gray-500">{suggestion.domain}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          {step === 3 && brandDetails && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Company Logo</Label>
                <div className="flex items-center space-x-4">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Logos by Brandfetch"
                      width={100}
                      height={100}
                      className="rounded-md object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="w-[100px] h-[100px] bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                      No Logo
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-lg font-semibold">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyDescription" className="text-lg font-semibold">Company Description</Label>
                <Textarea
                  id="companyDescription"
                  value={brandDetails.description}
                  onChange={(e) => setBrandDetails(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={4}
                  className="text-lg"
                />
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Campaign Goals</Label>
                <div className="flex flex-wrap gap-2">
                  {campaignGoals.map((goal) => (
                    <Button
                      key={goal.id}
                      type="button"
                      variant={selectedGoals.includes(goal.id) ? "default" : "outline"}
                      onClick={() => {
                        setSelectedGoals(prev =>
                          prev.includes(goal.id)
                            ? prev.filter(id => id !== goal.id)
                            : [...prev, goal.id]
                        )
                      }}
                      className="text-lg"
                    >
                      {goal.label}
                    </Button>
                  ))}
                </div>
                {selectedGoals.includes('other') && (
                  <Input
                    value={otherGoal}
                    onChange={(e) => setOtherGoal(e.target.value)}
                    placeholder="Enter other goal"
                    className="mt-2 text-lg"
                  />
                )}
              </div>
              <div  className="space-y-2">
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
              <div className="space-y-2">
                <Label htmlFor="targetAudience" className="text-lg font-semibold">Target Audience</Label>
                <Textarea
                  id="targetAudience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  rows={2}
                  placeholder="Describe your target audience"
                  className="text-lg"
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {step === 1 && (
            <Button onClick={() => setStep(2)} disabled={!name || !email} className="w-full text-lg">
              Next
            </Button>
          )}
          {step === 2 && (
            <Button onClick={handleAddCompanyInfo} disabled={!website || isLoading} className="w-full text-lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                'Add Company Info'
              )}
            </Button>
          )}
          {step === 3 && (
            <Button onClick={() => setStep(4)} className="w-full text-lg">
              Add Campaign Details
            </Button>
          )}
          {step === 4 && (
            <Button onClick={handleCreateBrief} disabled={isGenerating || selectedGoals.length === 0 || !deliverables || !creatorProfiles || !targetAudience} className="w-full text-lg">
              Create Brief 🚀
            </Button>
          )}
        </CardFooter>
      </Card>

      <Dialog open={showGeneratingDialog} onOpenChange={setShowGeneratingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generating Brief</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}