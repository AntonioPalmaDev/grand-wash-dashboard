import React, { useState, useMemo } from 'react';
import { Calculator, ShoppingCart, Trash2, Plus, Minus, Wrench, Gauge, DollarSign, Hammer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FixedItem = {
  id: string;
  name: string;
  price: number;
};

const ITENS_COMUNS: FixedItem[] = [
  { id: 'chave_inglesa', name: 'Chave Inglesa', price: 700 },
  { id: 'elevador', name: 'Elevador Hidráulico', price: 900 },
  { id: 'ferramentas', name: 'Ferramentas', price: 400 },
  { id: 'ferramentas_premium', name: 'Ferramentas Premium', price: 1100 },
  { id: 'pe_cabra', name: 'Pé de Cabra', price: 1200 },
  { id: 'pneu', name: 'Pneu', price: 375 },
];

const ACOES_SIMPLES: FixedItem[] = [
  { id: 'reparo_veiculo', name: 'Reparo do Veículo', price: 1000 },
  { id: 'pneu_instalado', name: 'Pneu Instalado', price: 375 },
];

// Margem aplicada às tunagens (lógica atual mantida: custo * 1.5)
const TUNING_MARGIN = 1.5;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

type Cart = Record<string, number>;

export default function MechanicCalculator() {
  const [comunsCart, setComunsCart] = useState<Cart>({});
  const [acoesCart, setAcoesCart] = useState<Cart>({});
  const [painelInput, setPainelInput] = useState<string>('');

  const painelValue = useMemo(() => {
    const parsed = parseFloat(painelInput.replace(/\./g, '').replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }, [painelInput]);

  const add = (setter: React.Dispatch<React.SetStateAction<Cart>>, id: string) =>
    setter((p) => ({ ...p, [id]: (p[id] || 0) + 1 }));

  const remove = (setter: React.Dispatch<React.SetStateAction<Cart>>, id: string) =>
    setter((p) => {
      const next = { ...p };
      if (!next[id]) return next;
      if (next[id] <= 1) delete next[id];
      else next[id] -= 1;
      return next;
    });

  const clearOne = (setter: React.Dispatch<React.SetStateAction<Cart>>, id: string) =>
    setter((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });

  const sumCart = (cart: Cart, list: FixedItem[]) =>
    list.reduce((acc, item) => acc + (cart[item.id] || 0) * item.price, 0);

  const totalComuns = sumCart(comunsCart, ITENS_COMUNS);
  const totalAcoes = sumCart(acoesCart, ACOES_SIMPLES);
  const totalTunagens = painelValue * TUNING_MARGIN;
  const totalGeral = totalComuns + totalAcoes + totalTunagens;

  const clearAll = () => {
    setComunsCart({});
    setAcoesCart({});
    setPainelInput('');
  };

  const copiarValores = () => {
    const linhas: string[] = [];
    if (totalTunagens > 0) linhas.push(`Tunagens: ${formatCurrency(totalTunagens)}`);
    if (totalComuns > 0) linhas.push(`Itens Comuns: ${formatCurrency(totalComuns)}`);
    if (totalAcoes > 0) linhas.push(`Ações Simples: ${formatCurrency(totalAcoes)}`);
    linhas.push(`TOTAL GERAL: ${formatCurrency(totalGeral)}`);
    navigator.clipboard?.writeText(linhas.join('\n'));
  };

  const renderFixedList = (
    title: string,
    icon: React.ReactNode,
    items: FixedItem[],
    cart: Cart,
    setter: React.Dispatch<React.SetStateAction<Cart>>,
  ) => (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const qty = cart[item.id] || 0;
          return (
            <div
              key={item.id}
              className="flex flex-col p-3 border rounded-lg hover:border-primary/50 transition-colors bg-card"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm">{item.name}</span>
                <Badge variant="outline" className="font-semibold text-xs">
                  {formatCurrency(item.price)}
                </Badge>
              </div>
              <div className="mt-auto pt-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => remove(setter, item.id)}
                    disabled={qty === 0}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-5 text-center font-semibold text-sm">{qty}</span>
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => add(setter, item.id)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                {qty > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {formatCurrency(item.price * qty)}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => clearOne(setter, item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" className="h-7 text-xs px-2" onClick={() => add(setter, item.id)}>
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-full">
          <Calculator className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calculadora Black Dragons</h1>
          <p className="text-muted-foreground">Orçamentos de customização e reparos automotivos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Lado Esquerdo: Categorias */}
        <div className="xl:col-span-2 space-y-6">
          {renderFixedList(
            'Itens Comuns',
            <Wrench className="w-5 h-5 text-zinc-500" />,
            ITENS_COMUNS,
            comunsCart,
            setComunsCart,
          )}

          {renderFixedList(
            'Ações Simples',
            <Hammer className="w-5 h-5 text-amber-500" />,
            ACOES_SIMPLES,
            acoesCart,
            setAcoesCart,
          )}

          {/* Tunagens */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gauge className="w-5 h-5 text-red-500" />
                Tunagens
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="painel">Valor do Painel</Label>
                <Input
                  id="painel"
                  inputMode="decimal"
                  placeholder="Ex: 50000"
                  value={painelInput}
                  onChange={(e) => setPainelInput(e.target.value)}
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground">
                  Informe o valor exibido no painel do jogo. O valor cobrado ao cliente aplica a margem padrão.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="text-xs text-muted-foreground">Custo (Painel)</div>
                  <div className="font-semibold">{formatCurrency(painelValue)}</div>
                </div>
                <div className="p-3 rounded-lg border bg-primary/5 border-primary/30">
                  <div className="text-xs text-muted-foreground">Cobrar do Cliente</div>
                  <div className="font-bold text-primary">{formatCurrency(totalTunagens)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito: Resumo */}
        <div className="xl:col-span-1">
          <Card className="sticky top-6 shadow-md border-primary/20">
            <CardHeader className="bg-primary/5 border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShoppingCart className="w-5 h-5" />
                Resumo do Orçamento
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tunagens</span>
                  <span className="font-semibold">{formatCurrency(totalTunagens)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Itens Comuns</span>
                  <span className="font-semibold">{formatCurrency(totalComuns)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ações Simples</span>
                  <span className="font-semibold">{formatCurrency(totalAcoes)}</span>
                </div>

                <Separator className="my-2" />

                <div className="flex justify-between items-center pt-1">
                  <span className="font-bold text-lg">TOTAL GERAL</span>
                  <span className="font-bold text-2xl text-primary">{formatCurrency(totalGeral)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" className="w-full" onClick={clearAll} disabled={totalGeral === 0}>
                  Limpar
                </Button>
                <Button className="w-full gap-2" onClick={copiarValores} disabled={totalGeral === 0}>
                  <DollarSign className="w-4 h-4" /> Copiar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
