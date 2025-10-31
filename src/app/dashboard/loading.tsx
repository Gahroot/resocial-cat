import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  const messages = [
    'Stretching and yawning... 😺',
    'Pouncing on your stats... 🐾',
    'Chasing the data... 🐱',
    'Hunting for automations... 😸',
  ];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Modern spinner with gradient background */}
        <div className="relative">
          {/* Gradient pulse background */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-xl animate-pulse" />

          {/* Spinner container with glassmorphism */}
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-surface/80 backdrop-blur-sm border border-border/50 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={2.5} />
          </div>
        </div>

        {/* Loading text with modern styling */}
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-foreground">{randomMessage}</p>
          <div className="flex items-center justify-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
