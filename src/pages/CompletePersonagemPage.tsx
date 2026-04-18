import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, LogOut } from "lucide-react";

export default function CompletePersonagemPage() {
  const { user, signOut, refreshPersonagem } = useAuth();
  const [nome, setNome] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!nome.trim() || nome.trim().length < 2) {
      setError("Informe um nome válido.");
      return;
    }
    if (!user) return;
    setLoading(true);

    // Verificar duplicidade
    const { data: existing } = await supabase
      .from("profiles")
      .select("id, user_id")
      .ilike("nome_personagem", nome.trim())
      .maybeSingle();
    if (existing && existing.user_id !== user.id) {
      setError("Este Nome do Personagem já está em uso.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ nome_personagem: nome.trim(), nome: nome.trim() })
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    await refreshPersonagem();
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass-card rounded-xl p-8 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-primary/15 text-primary">
            <User className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Complete seu perfil</h1>
          <p className="text-sm text-muted-foreground">
            Defina seu <strong>Nome do Personagem</strong>. Ele será usado como sua identificação principal no sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome do Personagem *</Label>
            <Input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Antonio Palma"
              required
              minLength={2}
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">Único no sistema. Não poderá ser repetido.</p>
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Continuar"}
          </Button>
          <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </form>
      </div>
    </div>
  );
}
