"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@mire/ui/components/dialog"
import { Button } from "@mire/ui/components/button"
import { ScrollArea } from "@mire/ui/components/scroll-area"
import { Separator } from "@mire/ui/components/separator"
import { ReactNode } from "react"

interface TermsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  content: ReactNode
  onAgree?: () => void
}

export function TermsModal({
  open,
  onOpenChange,
  title,
  content,
  onAgree,
}: TermsModalProps) {
  const handleAgree = () => {
    onAgree?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] !max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Separator />
        <ScrollArea className="h-[60vh] pr-4">
          <div className="whitespace-pre-wrap text-gray-800">{content}</div>
        </ScrollArea>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onOpenChange(false)}
          >
            닫기
          </Button>
          {onAgree && (
            <Button size="lg" onClick={handleAgree}>
              동의
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
