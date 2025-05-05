// Copied from shadcn/ui toast primitive: https://ui.shadcn.com/docs/components/toast
import { toast as sonnerToast } from "sonner"

interface ToastOptions {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function toast(options: ToastOptions) {
  const { title, description, variant, ...props } = options

  return sonnerToast(title, {
    description,
    classNames: {
      toast: variant === "destructive"
        ? "bg-destructive text-destructive-foreground"
        : "",
    },
    ...props,
  })
}

export function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    error: (message: string) => {
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    },
    success: (message: string) => {
      toast({
        title: "Success",
        description: message,
      })
    },
  }
}