import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { BrainCircuit, FileSpreadsheet, Upload, Trash2, CheckCircle2, AlertCircle, Info, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useSalesDataStore } from '../../store/salesDataStore';
import type { SalesDataRow, SalesSnapshot } from '../../types/mlPricing';
import { toast } from 'sonner';

// ─── Mapeamento de colunas da planilha ──────────────────────────────────────
// O master deve usar uma planilha com essas colunas (nomes em português).
// Colunas opcionais ficam como 0 se ausentes.
const COL_MAP: Record<string, keyof SalesDataRow> = {
  grupo_servico: 'grupoServico',
  'grupo de serviço': 'grupoServico',
  grupo: 'grupoServico',
  praca: 'plaza',
  praça: 'plaza',
  plaza: 'plaza',
  semana: 'semana',
  semana_referencia: 'semana',
  total_os: 'totalOs',
  'total os': 'totalOs',
  os_convertidas: 'osConvertidas',
  'os convertidas': 'osConvertidas',
  taxa_conversao: 'taxaConversao',
  'taxa de conversao': 'taxaConversao',
  adesoes: 'adesoes',
  adesões: 'adesoes',
  taxa_adesao: 'taxaAdesao',
  'taxa de adesão': 'taxaAdesao',
  preco_medio_venda: 'precoMedioVenda',
  'preço médio venda': 'precoMedioVenda',
  preco_venda: 'precoMedioVenda',
  preco_medio_repasse: 'precoMedioRepasse',
  'preço médio repasse': 'precoMedioRepasse',
  preco_repasse: 'precoMedioRepasse',
  prestadores_ativos: 'prestadoresAtivos',
  'prestadores ativos': 'prestadoresAtivos',
  prestadores: 'prestadoresAtivos',
  rede_concorrentes: 'redeConcorrentes',
  'rede concorrentes': 'redeConcorrentes',
  concorrentes: 'redeConcorrentes',
  capacidade_compra_regional: 'capacidadeCompraRegional',
  'capacidade de compra': 'capacidadeCompraRegional',
  capacidade_compra: 'capacidadeCompraRegional',
  receita_total: 'receitaTotal',
  'receita total': 'receitaTotal',
  observacoes: 'observacoes',
  observações: 'observacoes',
};

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 _]/g, '')
    .trim();
}

function parseNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(',', '.').replace(/[^\d.-]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function parseRows(rawRows: Record<string, unknown>[]): { rows: SalesDataRow[]; warnings: string[] } {
  const warnings: string[] = [];
  const rows: SalesDataRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    // Normaliza as chaves
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(raw)) {
      normalized[normalizeHeader(key)] = raw[key];
    }

    // Mapeia para SalesDataRow
    const row: Partial<SalesDataRow> = {};
    for (const [normKey, field] of Object.entries(COL_MAP)) {
      if (normalized[normKey] !== undefined) {
        (row as Record<string, unknown>)[field] = normalized[normKey];
      }
    }

    // Validações obrigatórias
    if (!row.grupoServico) {
      warnings.push(`Linha ${i + 2}: coluna "grupo_servico" ausente — pulada`);
      continue;
    }
    if (!row.plaza) {
      warnings.push(`Linha ${i + 2}: coluna "praca" ausente — pulada`);
      continue;
    }

    // Semana: tenta usar o valor ou data de hoje
    if (!row.semana) {
      row.semana = new Date().toISOString().split('T')[0];
    } else {
      // Se vier como número serial do Excel, converte
      if (typeof row.semana === 'number') {
        const excelEpoch = new Date(1900, 0, 0);
        const msPerDay = 86400000;
        const date = new Date(excelEpoch.getTime() + (row.semana - 1) * msPerDay);
        row.semana = date.toISOString().split('T')[0];
      } else {
        row.semana = String(row.semana);
      }
    }

    // Numéricos com fallback 0
    const numFields: (keyof SalesDataRow)[] = [
      'totalOs', 'osConvertidas', 'taxaConversao', 'adesoes', 'taxaAdesao',
      'precoMedioVenda', 'precoMedioRepasse', 'prestadoresAtivos', 'redeConcorrentes',
      'capacidadeCompraRegional', 'receitaTotal',
    ];
    for (const f of numFields) {
      const raw = (row as Record<string, unknown>)[f];
      if (raw !== undefined) {
        (row as Record<string, unknown>)[f] = parseNumber(raw);
      } else {
        (row as Record<string, unknown>)[f] = 0;
      }
    }

    // Calcula taxas se não fornecidas mas os totais estão disponíveis
    const r = row as SalesDataRow;
    if (r.taxaConversao === 0 && r.totalOs > 0 && r.osConvertidas > 0) {
      r.taxaConversao = r.osConvertidas / r.totalOs;
    }
    if (r.taxaAdesao === 0 && r.totalOs > 0 && r.adesoes > 0) {
      r.taxaAdesao = r.adesoes / r.totalOs;
    }

    rows.push(r);
  }

  return { rows, warnings };
}

// ─── Componente principal ────────────────────────────────────────────────────

interface SalesDataUploadProps {
  masterName: string;
}

export function SalesDataUpload({ masterName }: SalesDataUploadProps) {
  const { snapshots, addSnapshot, removeSnapshot } = useSalesDataStore();
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [expandedSnapshots, setExpandedSnapshots] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

          if (jsonData.length === 0) {
            throw new Error('A planilha está vazia ou sem dados');
          }

          const { rows, warnings: parseWarnings } = parseRows(jsonData);

          if (rows.length === 0) {
            throw new Error(
              'Nenhuma linha válida encontrada. Verifique se a planilha contém as colunas: grupo_servico, praca, preco_medio_venda.'
            );
          }

          // Determina semana de referência (mais frequente)
          const weekCounts: Record<string, number> = {};
          rows.forEach((r) => {
            weekCounts[r.semana] = (weekCounts[r.semana] ?? 0) + 1;
          });
          const semanaReferencia = Object.entries(weekCounts).sort((a, b) => b[1] - a[1])[0][0];

          const snapshot: Omit<SalesSnapshot, 'id'> = {
            uploadedAt: new Date().toISOString(),
            uploadedBy: masterName,
            semanaReferencia,
            rows,
          };

          addSnapshot(snapshot);
          setWarnings(parseWarnings);

          toast.success('Dados de vendas carregados!', {
            description: `${rows.length} linha(s) processada(s) • Semana: ${semanaReferencia}`,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erro ao processar arquivo';
          setError(msg);
          toast.error('Erro ao processar planilha de dados de vendas');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setError('Erro ao ler o arquivo');
        setIsProcessing(false);
      };
      reader.readAsBinaryString(file);
    },
    [addSnapshot, masterName]
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file);
    } else {
      setError('Por favor, envie um arquivo Excel (.xlsx ou .xls)');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleRemoveSnapshot = (id: string) => {
    removeSnapshot(id);
    toast.success('Snapshot removido');
  };

  const recentSnapshots = [...snapshots].reverse().slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', backgroundColor: '#F0FFF4', borderRadius: '12px', border: '1px solid #86EFAC' }}
      >
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BrainCircuit size={20} style={{ color: '#FFFFFF' }} />
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#15803D', margin: 0 }}>Upload de Dados de Vendas — Machine Learning</p>
          <p style={{ fontSize: '12px', color: '#166534', margin: 0 }}>
            Faça o upload semanal para alimentar as sugestões de preço inteligentes
          </p>
        </div>
      </div>

      {/* Instrução de formato */}
      <details style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB', padding: '12px 16px' }}>
        <summary style={{ fontSize: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Info size={13} style={{ color: '#6B7280' }} />
          Ver formato esperado da planilha
        </summary>
        <div style={{ marginTop: '10px', overflowX: 'auto' }}>
          <p style={{ fontSize: '11px', color: '#6B7280', margin: '0 0 6px 0' }}>
            Colunas obrigatórias: <strong>grupo_servico</strong>, <strong>praca</strong>, <strong>preco_medio_venda</strong>.<br />
            Colunas opcionais (enriquecem a sugestão): taxa_conversao, taxa_adesao, prestadores_ativos, rede_concorrentes, capacidade_compra_regional, preco_medio_repasse, semana.
          </p>
          <table style={{ fontSize: '10px', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ backgroundColor: '#E5E7EB' }}>
                {['grupo_servico', 'praca', 'semana', 'preco_medio_venda', 'preco_medio_repasse', 'taxa_conversao', 'taxa_adesao', 'prestadores_ativos', 'rede_concorrentes', 'capacidade_compra_regional'].map((h) => (
                  <th key={h} style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #D1D5DB' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {['Chuveiro Elétrico', 'Praça SP', '2025-01-06', '189.90', '95.00', '0.72', '0.85', '12', '7', '4'].map((v, i) => (
                  <td key={i} style={{ padding: '4px 8px', color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>{v}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px 14px', borderRadius: '8px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }}>
          <AlertCircle size={15} style={{ color: '#DC2626', flexShrink: 0, marginTop: '1px' }} />
          <span style={{ fontSize: '13px', color: '#DC2626' }}>{error}</span>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#92400E', margin: '0 0 4px 0' }}>Avisos de importação:</p>
          {warnings.slice(0, 5).map((w, i) => (
            <p key={i} style={{ fontSize: '11px', color: '#92400E', margin: '2px 0' }}>• {w}</p>
          ))}
          {warnings.length > 5 && (
            <p style={{ fontSize: '11px', color: '#92400E', margin: '2px 0' }}>…e mais {warnings.length - 5} avisos</p>
          )}
        </div>
      )}

      {/* Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px ${dragActive ? 'solid' : 'dashed'} #78BE20`,
          borderRadius: '12px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          backgroundColor: dragActive ? 'rgba(120, 190, 32, 0.05)' : '#FAFAFA',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(120,190,32,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isProcessing ? (
            <div style={{ width: '24px', height: '24px', border: '2px solid #E5E7EB', borderTop: '2px solid #78BE20', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
            <Upload size={22} style={{ color: '#78BE20' }} />
          )}
        </div>
        {isProcessing ? (
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#001022', margin: 0 }}>Processando…</p>
        ) : (
          <>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#001022', margin: 0 }}>Arraste a planilha de dados de vendas aqui</p>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>ou clique para selecionar (.xlsx / .xls)</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* Snapshots carregados */}
      {recentSnapshots.length > 0 && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
          <button
            onClick={() => setExpandedSnapshots((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={15} style={{ color: '#78BE20' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                {snapshots.length} snapshot(s) carregado(s)
              </span>
            </div>
            {expandedSnapshots ? <ChevronUp size={15} style={{ color: '#6B7280' }} /> : <ChevronDown size={15} style={{ color: '#6B7280' }} />}
          </button>

          {expandedSnapshots && (
            <div style={{ borderTop: '1px solid #E5E7EB', padding: '8px 0' }}>
              {recentSnapshots.map((snap) => (
                <div
                  key={snap.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', gap: '12px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <CheckCircle2 size={13} style={{ color: '#78BE20', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', margin: 0 }}>
                        <Calendar size={10} style={{ display: 'inline', marginRight: '4px', color: '#9CA3AF' }} />
                        Semana: {snap.semanaReferencia}
                      </p>
                      <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>
                        {snap.rows.length} linhas • por {snap.uploadedBy} •{' '}
                        {new Date(snap.uploadedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveSnapshot(snap.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#9CA3AF', flexShrink: 0 }}
                    title="Remover snapshot"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
