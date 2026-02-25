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
  primaryButton?: { label: string; onClick: () => void };
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
  const hasBothButtons = !!primaryButton && !!secondaryButton;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        {title && (
          <DialogHeader>
            <div className="text-center font-semibold text-lg text-foreground">
              {title}
            </div>
          </DialogHeader>
        )}
        <p className="whitespace-pre-line text-center text-muted-foreground">
          {message}
        </p>
        <DialogFooter
          className={
            hasBothButtons ? undefined : 'sm:justify-center'
          }
        >
          {secondaryButton && (
            <Button
              className={`${hasBothButtons ? 'w-1/2' : 'w-1/2'} bg-foreground text-background hover:bg-foreground/90`}
              size="xl"
              onClick={secondaryButton.onClick}
            >
              {secondaryButton.label}
            </Button>
          )}
          {primaryButton && (
            <Button
              className={hasBothButtons ? 'w-1/2' : 'w-1/2'}
              size="xl"
              onClick={primaryButton.onClick}
            >
              {primaryButton.label}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
