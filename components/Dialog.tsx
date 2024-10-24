import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface BriefDialogProps {
  isGenerating: boolean
  showBriefDialog: boolean
  setShowBriefDialog: (show: boolean) => void
  generatedBrief: string
}

export function BriefDialog({ isGenerating, showBriefDialog, setShowBriefDialog, generatedBrief }: BriefDialogProps) {
  return (
    <Dialog open={isGenerating || showBriefDialog} onOpenChange={setShowBriefDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isGenerating ? "Generating" : "Brief Generated"}</DialogTitle>
        </DialogHeader>
        {isGenerating ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <Button onClick={() => setShowBriefDialog(false)} className="w-full text-lg">
              Close
            </Button>
            <div className="max-h-[400px] overflow-y-auto">
              <pre className="whitespace-pre-wrap">{generatedBrief}</pre>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}