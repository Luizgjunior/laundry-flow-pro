import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Ops! Algo deu errado</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Ocorreu um erro inesperado. Por favor, tente novamente.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => window.history.back()}>Voltar</Button>
            <Button onClick={() => window.location.reload()}>Recarregar</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
