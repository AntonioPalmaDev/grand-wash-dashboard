import React, { useState } from 'react';
import { Calculator, ShoppingCart, Trash2, Plus, Minus, Wrench, Car, Gauge, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type ModItem = {
  id: string;
  name: string;
  price: number;
};

const MECHANIC_DATA = {
  comuns: [
    { id: 'pe_cabra', name: 'Pé de cabra', price: 1075 },
    { id: 'chave_inglesa', name: 'Chave inglesa', price: 600 },
    { id: 'elevador', name: 'Elevador hidráulico', price: 700 },
    { id: 'reparo_comum', name: 'Caixa de reparo comum', price: 200 },
    { id: 'reparo_rara', name: 'Caixa de reparo rara', price: 800 },
    { id: 'pneu', name: 'Pneu', price: 175 },
  ],
  esteticas: [
    { id: 'buzina', name: 'Buzina', price: 2000 },
    { id: 'pinturas', name: 'Pinturas', price: 5000 },
    { id: 'ativar_xenon', name: 'Ativar xenon', price: 2000 },
    { id: 'cor_xenon', name: 'Cor xenon', price: 2000 },
    { id: 'rodas', name: 'Rodas', price: 2000 },
    { id: 'placa', name: 'Placa personalizada', price: 1000 },
  ],
  performance: [
    { id: 'motor_1', name: 'Motor Nível 1', price: 16250 },
    { id: 'motor_2', name: 'Motor Nível 2', price: 26000 },
    { id: 'motor_3', name: 'Motor Nível 3', price: 39000 },
    { id: 'motor_4', name: 'Motor Nível 4', price: 55250 },
    { id: 'freio_1', name: 'Freio Nível 1', price: 16250 },
    { id: 'freio_2', name: 'Freio Nível 2', price: 26000 },
    { id: 'freio_3', name: 'Freio Nível 3', price: 39000 },
    { id: 'transmissao_1', name: 'Transmissão Nível 1', price: 16250 },
    { id: 'transmissao_2', name: 'Transmissão Nível 2', price: 26000 },
    { id: 'transmissao_3', name: 'Transmissão Nível 3', price: 39000 },
    { id: 'suspensao_1', name: 'Suspensão Nível 1', price: 16250 },
    { id: 'suspensao_2', name: 'Suspensão Nível 2', price: 26000 },
    { id: 'suspensao_3', name: 'Suspensão Nível 3', price: 39000 },
    { id: 'suspensao_4', name: 'Suspensão Nível 4', price: 55250 },
    { id: 'blindagem_1', name: 'Blindagem Nível 1', price: 16250 },
    { id: 'blindagem_2', name: 'Blindagem Nível 2', price: 26000 },
    { id: 'blindagem_3', name: 'Blindagem Nível 3', price: 39000 },
    { id: 'blindagem_4', name: 'Blindagem Nível 4', price: 55250 },
    { id: 'blindagem_5', name: 'Blindagem Nível 5', price: 71500 },
    { id: 'turbo', name: 'Turbo', price: 10000 },
  ],
};

// Porcentagem de lucro estipulada (50%)
const PROFIT_MARGIN = 0.5; 

export default function MechanicCalculator() {
  const [cart, setCart] = useState<Record<string, { item: ModItem; quantity: number }>>({});

  const addToCart = (item: ModItem) => {
    setCart((prev) => ({
      ...prev,
      [item.id]: {
        item,
        quantity: (prev[item.id]?.quantity || 0) + 1,
      },
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[itemId].quantity > 1) {
        newCart[itemId].quantity -= 1;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const clearItem = (itemId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[itemId];
      return newCart;
    });
  };

  const clearAll = () => setCart({});

  // Cálculos
  const totalCost = Object.values(cart).reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);
  const totalProfit = totalCost * PROFIT_MARGIN;
  const clientPrice = totalCost + totalProfit;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const renderProductList = (title: string, icon: React.ReactNode, items: ModItem[]) => (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-3 bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col p-3 border rounded-lg hover:border-primary/50 transition-colors bg-card">
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-sm">{item.name}</span>
              <Badge variant="outline" className="font-semibold text-xs">
                {formatCurrency(item.price)}
              </Badge>
            </div>
            <div className="mt-auto pt-2 flex justify-between items-center text-xs text-muted-foreground">
              <span>Ao cliente: <strong className="text-foreground">{formatCurrency(item.price * 1.5)}</strong></span>
              <Button size="sm" variant="secondary" className="h-7 text-xs px-2" onClick={() => addToCart(item)}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
          </div>
        ))}
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
          <p className="text-muted-foreground">Orçamentos de customização e reparos automotivos (Margem de 50%)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Lado Esquerdo: Produtos */}
        <div className="xl:col-span-2 space-y-6">
          <ScrollArea className="h-[calc(100vh-220px)] pr-4">
            {renderProductList("Itens Comuns", <Wrench className="w-5 h-5 text-zinc-500" />, MECHANIC_DATA.comuns)}
            {renderProductList("Modificações Estéticas", <Car className="w-5 h-5 text-blue-500" />, MECHANIC_DATA.esteticas)}
            {renderProductList("Performance & Blindagem", <Gauge className="w-5 h-5 text-red-500" />, MECHANIC_DATA.performance)}
          </ScrollArea>
        </div>

        {/* Lado Direito: Carrinho e Resumo */}
        <div className="xl:col-span-1">
          <Card className="sticky top-6 shadow-md border-primary/20">
            <CardHeader className="bg-primary/5 border-b pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ShoppingCart className="w-5 h-5" />
                  Orçamento
                </CardTitle>
                <Badge variant={Object.keys(cart).length > 0 ? "default" : "secondary"}>
                  {Object.values(cart).reduce((acc, curr) => acc + curr.quantity, 0)} itens
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <ScrollArea className="h-[300px] p-4">
                {Object.keys(cart).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-60">
                    <ShoppingCart className="w-10 h-10 mb-2" />
                    <p>Nenhum item adicionado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.values(cart).map(({ item, quantity }) => (
                      <div key={item.id} className="flex flex-col bg-muted/40 p-3 rounded-md border text-sm">
                        <div className="flex justify-between font-medium mb-1">
                          <span>{item.name}</span>
                          <span>{formatCurrency(item.price * quantity * 1.5)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-muted-foreground">Custo base: {formatCurrency(item.price)}</span>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => removeFromCart(item.id)}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-4 text-center font-semibold">{quantity}</span>
                            <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => addToCart(item)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive ml-1" onClick={() => clearItem(item.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              <Separator />
              
              <div className="p-5 space-y-4 bg-muted/10 rounded-b-xl">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Custo das Peças:</span>
                    <span>{formatCurrency(totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <span>Lucro da Oficina (50%):</span>
                    <span>+ {formatCurrency(totalProfit)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-bold text-lg">Total a Cobrar:</span>
                    <span className="font-bold text-2xl text-primary">{formatCurrency(clientPrice)}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="outline" className="w-full" onClick={clearAll} disabled={Object.keys(cart).length === 0}>
                    Limpar
                  </Button>
                  <Button className="w-full gap-2" disabled={Object.keys(cart).length === 0}>
                    <DollarSign className="w-4 h-4" /> Copiar Valor
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}