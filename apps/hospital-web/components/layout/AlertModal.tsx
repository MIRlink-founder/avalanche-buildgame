'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@mire/ui';
import { ReactNode } from 'react';

export interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: ReactNode;
  primaryButton?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  secondaryButton?: { label: string; onClick: () => void };
}

export function AlertModal({
  open,
  onOpenChange,
  title,
  message,
  primaryButton,
  secondaryButton,
}: AlertModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="text-center font-semibold text-lg text-foreground">
            {title}
          </div>
        </DialogHeader>
        <p className="text-center text-muted-foreground">{message}</p>
        <DialogFooter>
          {secondaryButton && (
            <Button
              variant="outline"
              className="w-1/2"
              size="xl"
              onClick={secondaryButton.onClick}
            >
              {secondaryButton.label}
            </Button>
          )}
          {primaryButton && (
            <Button
              className="w-1/2"
              size="xl"
              onClick={primaryButton.onClick}
              disabled={primaryButton.disabled}
            >
              {primaryButton.label}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
