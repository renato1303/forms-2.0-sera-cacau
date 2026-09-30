import React from 'react';
import { LeadData } from '../types';
import { 
  User, Mail, Phone, Building2, Briefcase, DollarSign, 
  ShieldAlert, Zap, Activity
} from 'lucide-react';

interface SummaryProps {
  lead: LeadData;
}

export default function LeadSummary({ lead }: SummaryProps) {
  const safeLead = lead || {} as LeadData;
  const summaryFields = [
    { label: 'Nome Completo', value: safeLead.nome || 'Não informado', icon: User, color: 'text-[#C88452]' },
    { label: 'WhatsApp', value: safeLead.whatsapp || safeLead.telefone || 'Não informado', icon: Phone, color: 'text-[#C88452]' },
    { label: 'E-mail', value: safeLead.email || 'Não informado', icon: Mail, color: 'text-[#C88452]' },
    { label: 'Nome da Empresa', value: safeLead.empresa || 'Não informada', icon: Building2, color: 'text-[#C88452]' },
    { label: 'Segmento de Atuação', value: safeLead.segmento || 'Não informado', icon: Briefcase, color: 'text-[#C88452]' },
    { label: 'Trabalha com Cacau?', value: safeLead.trabalhaComCacau || 'Não informado', icon: Activity, color: 'text-[#C88452]' },
    { label: 'Faturamento Mensal', value: safeLead.faturamento || 'Não informado', icon: DollarSign, color: 'text-[#C88452]' },
  ];

  return (
    <div className="w-full text-left mt-6" id="lead-diagnostico-summary">
      <div className="flex items-center gap-2 mb-4 bg-[#C88452]/10 border border-[#C88452]/20 rounded-xl px-4 py-3">
        <Zap className="w-5 h-5 text-[#C88452] shrink-0 animate-pulse" />
        <p className="text-xs text-neutral-200 tracking-wide leading-relaxed font-sans font-medium">
          Diagnóstico pronto para a sua operação estratégica. Com base nos seus dados de faturamento (<span className="text-[#C88452] font-bold">{safeLead.faturamento || 'Não informado'}</span>) e processos, preparamos um plano de crescimento sob medida.
        </p>
      </div>

      <div className="dark-glass-panel rounded-2xl p-5 shadow-2xl relative overflow-hidden border border-white/10 text-white">
        
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <h3 className="font-display font-medium text-xs tracking-widest text-neutral-400 uppercase flex items-center gap-2">
            <img src="/logo-icon.png" alt="" className="w-4 h-4 object-contain brightness-0 invert opacity-80" />
            <span>DIAGNÓSTICO E QUALIFICAÇÃO SERÁ CACAU</span>
          </h3>
          <span className="text-[10px] font-mono text-[#C88452] bg-[#C88452]/15 border border-[#C88452]/30 rounded px-2 py-0.5 font-bold">
            ANALISADO
          </span>
        </div>

        {/* Response Review Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
          {summaryFields.map((field, idx) => {
            const IconComponent = field.icon;
            return (
              <div 
                key={idx} 
                className="flex items-start gap-3 bg-white/[0.04] border border-white/10 hover:border-white/20 rounded-xl p-3 transition-colors group"
                id={`summary-item-${idx}`}
              >
                <div className={`p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:bg-[#C88452]/15 group-hover:border-[#C88452]/30 transition-colors ${field.color}`}>
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider mb-0.5">
                    {field.label}
                  </p>
                  <p className="text-xs font-sans font-semibold text-neutral-200 truncate whitespace-normal leading-tight">
                    {field.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Compliance Footer */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10 text-[10px] font-mono text-[#C88452]">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>SISTEMA DE CONFORMIDADE ATIVO (LGPD)</span>
        </div>
      </div>
    </div>
  );
}
