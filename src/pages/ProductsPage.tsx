import { useState } from "react";
import { useModules } from "@/context/ModuleContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Package, Cog, Swords, Layers, ShoppingBag } from "lucide-react";
import WeaponPartsTab from "@/features/products/WeaponPartsTab";
import WeaponsTab from "@/features/products/WeaponsTab";
import WeaponCompositionTab from "@/features/products/WeaponCompositionTab";
import SalesTab from "@/features/products/SalesTab";

export default function ProductsPage() {
  const { isModuleEnabled } = useModules();
  const [activeTab, setActiveTab] = useState("armas");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="text-primary h-6 w-6" />
            Gestão de Produtos
          </h1>
          <p className="text-muted-foreground text-sm">Catálogo de armas, peças, composição e registro de vendas.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary/40 border border-white/10 p-1 h-auto flex-wrap">
          <TabsTrigger value="armas" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <Swords className="h-4 w-4" /> Armas
          </TabsTrigger>
          {isModuleEnabled("pecas_armas") && (
            <TabsTrigger value="pecas" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
              <Cog className="h-4 w-4" /> Peças
            </TabsTrigger>
          )}
          <TabsTrigger value="composicao" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <Layers className="h-4 w-4" /> Composição
          </TabsTrigger>
          <TabsTrigger value="vendas" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <ShoppingBag className="h-4 w-4" /> Vendas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="armas" className="mt-0"><WeaponsTab /></TabsContent>
        {isModuleEnabled("pecas_armas") && (
          <TabsContent value="pecas" className="mt-0"><WeaponPartsTab /></TabsContent>
        )}
        <TabsContent value="composicao" className="mt-0"><WeaponCompositionTab /></TabsContent>
        <TabsContent value="vendas" className="mt-0"><SalesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
