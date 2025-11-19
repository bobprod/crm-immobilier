import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

interface LoadingStateProps {
  variant?: "spinner" | "skeleton" | "card" | "inline";
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({ 
  variant = "spinner", 
  message = "Chargement en cours...",
  size = "md" 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  if (variant === "spinner") {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    );
  }

  if (variant === "skeleton") {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="flex space-x-4">
          <Skeleton className="h-24 w-1/3" />
          <Skeleton className="h-24 w-1/3" />
          <Skeleton className="h-24 w-1/3" />
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </CardContent>
      </Card>
    );
  }

  return null;
}

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({ isLoading, message, children }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <LoadingState message={message} />
        </div>
      )}
    </div>
  );
}
