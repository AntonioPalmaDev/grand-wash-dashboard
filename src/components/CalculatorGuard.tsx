import { useState, useEffect, ReactNode } from "react";
import { Calculator, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";

const ACCESS_TOKEN = "MECBD";
const STORAGE_KEY = "calculator_access";

export function hasCalculatorAccess() {
  return typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === ACCESS_TOKEN;
}

export function clearCalculatorAccess() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function CalculatorGuard({ children }: { children: ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean>(() => hasCalculatorAccess());
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Calculadora Mecânica | Grand Wash Dashboard";
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (token.trim().toUpperCase() === ACCESS_TOKEN) {
        localStorage.setItem(STORAGE_KEY, ACCESS_TOKEN);
        setAuthorized(true);
        toast.success("Acesso liberado!");
      } else {
        toast.error("Token inválido. Verifique e tente novamente.");
      }
      setLoading(false);
    }, 200);
  };

  if (authorized) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit">
            <Calculator className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Acesso à Calculadora</CardTitle>
          <CardDescription>
            Insira o token de acesso fornecido para utilizar a Calculadora Mecânica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Token de acesso</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Digite seu token"
                  className="pl-9 uppercase tracking-widest"
                  autoFocus
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !token.trim()}>
              {loading ? "Validando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
