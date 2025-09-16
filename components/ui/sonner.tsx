'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-lg group-[.toaster]:border-2 group-[.toaster]:border-primary/20 group-[.toaster]:backdrop-blur-sm group-[.toaster]:bg-opacity-95 group-[.toaster]:backdrop-saturate-150 group-[.toaster]:animate-in group-[.toaster]:fade-in-0 group-[.toaster]:zoom-in-95 group-[.toaster]:slide-in-from-top-1/2',
          description: 'group-[.toast]:text-muted-foreground group-[.toast]:font-medium',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-bold group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:rounded-md group-[.toast]:shadow-md group-[.toast]:hover:bg-primary/90 group-[.toast]:transition-colors group-[.toast]:border-2 group-[.toast]:border-primary/50 group-[.toast]:hover:border-primary group-[.toast]:outline-none group-[.toast]:ring-2 group-[.toast]:ring-primary/20 group-[.toast]:hover:ring-primary/40',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-foreground group-[.toast]:font-medium group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:rounded-md group-[.toast]:shadow-sm group-[.toast]:hover:bg-muted/80 group-[.toast]:transition-colors group-[.toast]:border group-[.toast]:border-border group-[.toast]:hover:border-foreground/30 group-[.toast]:outline-none',
          title: 'group-[.toast]:font-bold group-[.toast]:text-lg',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
