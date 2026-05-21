import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Company } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Clock,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Calendar
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLogsOverlayProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogsOverlay = ({ company, isOpen, onClose }: AuditLogsOverlayProps) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (company && isOpen) {
      fetchLogs();
    }
  }, [company, isOpen]);

  const fetchLogs = async () => {
    if (!company) return;
    setLoading(true);
    try {
      // For now we fetch from audit_logs table
      // You might need to filter by some criteria if available
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar logs",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('delete') || act.includes('remover') || act.includes('excluir')) return 'text-red-400';
    if (act.includes('insert') || act.includes('create') || act.includes('adicionar')) return 'text-green-400';
    if (act.includes('update') || act.includes('edit')) return 'text-blue-400';
    return 'text-slate-400';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-white/10 text-slate-200 sm:rounded-3xl max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden">
        <div className="p-8 border-b border-white/5 space-y-6">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-3xl font-black text-white flex items-center gap-3">
              <Terminal className="w-8 h-8 text-primary" /> Auditoria de Logs
            </DialogTitle>
            <p className="text-slate-400 font-medium">Histórico real de ações no ambiente {company?.name}.</p>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Filtrar por ação, usuário ou entidade..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/5 border-white/10 text-white pl-10 h-11 rounded-xl focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-white/10 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl h-11 px-4 gap-2">
                <Filter className="w-4 h-4" /> Filtros
              </Button>
              <Button variant="outline" className="border-white/10 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl h-11 px-4 gap-2" onClick={fetchLogs}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl h-11 px-5 font-bold gap-2">
                <Download className="w-4 h-4" /> Exportar
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-black/40 backdrop-blur-sm overflow-hidden flex flex-col m-8 mt-0 rounded-2xl border border-white/5">
          <div className="bg-slate-900/50 p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" /> Timestamp
              </div>
              <div className="flex items-center gap-2">
                <User className="w-3 h-3" /> User
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3" /> Action
              </div>
            </div>
            <span className="text-[10px] font-bold text-primary animate-pulse">Live Feed</span>
          </div>

          <ScrollArea className="flex-1 font-mono text-xs">
            <div className="p-4 space-y-1.5">
              {loading && logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Iniciando terminal...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-20 text-slate-500 italic">
                  &gt; No logs found in this context.
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={log.id} className="group flex items-start gap-4 p-2 rounded hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-primary">
                    <span className="text-slate-600 shrink-0 select-none">[{format(new Date(log.created_at), 'HH:mm:ss')}]</span>
                    <span className="text-blue-400 shrink-0 w-24 truncate">{log.user_email?.split('@')[0] || 'system'}</span>
                    <span className={`shrink-0 font-bold ${getActionColor(log.action)}`}>{log.action.toUpperCase()}</span>
                    <span className="text-slate-400 italic shrink-0">-</span>
                    <span className="text-slate-300 truncate">
                      {log.entity} {log.entity_id ? `(${log.entity_id.substring(0, 8)})` : ''} 
                      {log.before_data && <span className="text-slate-500 ml-2 text-[10px]">changes: {JSON.stringify(log.before_data).substring(0, 50)}...</span>}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="bg-slate-900/50 p-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Showing {logs.length} entries</p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-slate-500 hover:text-white hover:bg-white/10">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-[10px] font-bold text-white px-2">Page 1</span>
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-slate-500 hover:text-white hover:bg-white/10">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 flex justify-end">
          <Button onClick={onClose} className="rounded-xl px-8 h-11 bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 transition-all">
            Fechar Terminal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
