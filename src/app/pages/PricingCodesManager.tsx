import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Trash2, Upload, FileSpreadsheet, Calendar, AlertCircle, CheckCircle2, ChevronsUpDown, ChevronDown, FolderOpen, Link, MessageSquare, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { usePricingCodesStore, PricingCode, PricingCodeTipo, ALL_PLAZAS, UNGROUPED_KEY } from '../store/pricingCodesStore';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Checkbox } from '../components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';

export function PricingCodesManager() {
  const { user } = useAuthStore();
  const { codes, addCode, addCodes, removeCode, updateCodeMeta, getCodesByStatus, clearCodes } = usePricingCodesStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<Omit<PricingCode, 'id' | 'createdAt' | 'status'>[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newCode, setNewCode] = useState<Partial<PricingCode>>({
    tipo: 'Serviço',
    unidade: 'un',
    prazo: '',
    descricao: '',
    codigoAvulso: '',
    codigoAtrelado: '',
    grupoServico: '',
  });

  const pendingCodes = getCodesByStatus('pendente');
  const inProgressCodes = getCodesByStatus('em_andamento');
  const completedCodes = getCodesByStatus('concluido');

  const handleAddCode = () => {
    if (newCode.descricao && (newCode.codigoAvulso || newCode.codigoAtrelado) && newCode.prazo && user) {
      addCode({
        tipo: newCode.tipo as PricingCodeTipo,
        descricao: newCode.descricao,
        unidade: newCode.unidade || 'un',
        codigoAvulso: newCode.codigoAvulso || undefined,
        codigoAtrelado: newCode.codigoAtrelado || undefined,
        grupoServico: newCode.grupoServico?.trim() || undefined,
        prazo: newCode.prazo,
        createdBy: user.name,
        prices: {},
      });

      // Reset form
      setNewCode({
        tipo: 'Serviço',
        unidade: 'un',
        prazo: '',
        descricao: '',
        codigoAvulso: '',
        codigoAtrelado: '',
        grupoServico: '',
      });
      setIsDialogOpen(false);
    }
  };

  // Normalizar tipo da planilha para o tipo aceito pelo sistema
  const normalizeTipo = (raw: string): PricingCodeTipo => {
    const cleaned = (raw || '').trim().toLowerCase();
    if (cleaned.includes('visita')) return 'Visita Técnica';
    if (cleaned.includes('inst') && cleaned.includes('pague')) return 'Inst + Pague -';
    if (cleaned.includes('emergencial') || cleaned.includes('express')) return 'Emergencial';
    if (cleaned.includes('complementar')) return 'Complementar';
    if (cleaned.includes('deslocamento') || cleaned.includes('desloc')) return 'Deslocamento';
    if (cleaned.includes('reforma')) return 'Reforma';
    if (cleaned.includes('servi')) return 'Serviço';
    return 'Serviço'; // default
  };

  // Helper to find column value by trying multiple possible column names
  const findColumnValue = (row: Record<string, unknown>, possibleNames: string[], fallback = ''): string => {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== '') return String(row[name]);
    }
    return fallback;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportPreview([]);

    const reader = new FileReader();
    reader.onerror = () => {
      setImportError('Erro ao ler o arquivo. Tente novamente.');
    };
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          setImportError('O arquivo Excel está vazio.');
          return;
        }

        // Map rows to PricingCode format
        const parsed: Omit<PricingCode, 'id' | 'createdAt' | 'status'>[] = [];

        for (const row of jsonData) {
          // Try to find columns by common names (flexible matching)
          const grupoServico = findColumnValue(row, ['Grupo de Serviço', 'Grupo de Servico', 'Grupo Serviço', 'Grupo Servico', 'grupo_servico', 'GrupoServico', 'Grupo']);
          const tipo = findColumnValue(row, ['Tipo', 'tipo']);
          const descricao = findColumnValue(row, ['Descrição', 'Descricao', 'descricao', 'Descriçao']);
          const unidade = findColumnValue(row, ['Unid', 'Unidade', 'unid', 'unidade'], 'un');
          const codAtrelado = findColumnValue(row, ['Cód Atrelado', 'Cod Atrelado', 'CodAtrelado', 'cod_atrelado']);
          const codAvulso = findColumnValue(row, ['Cód Avulso', 'Cod Avulso', 'CodAvulso', 'cod_avulso']);

          // Skip rows without description
          if (!descricao.trim()) continue;

          parsed.push({
            tipo: normalizeTipo(tipo),
            descricao: descricao.trim(),
            unidade: unidade.trim() || 'un',
            codigoAtrelado: codAtrelado.trim() || undefined,
            codigoAvulso: codAvulso.trim() || undefined,
            grupoServico: grupoServico.trim() || undefined,
            prazo: '',
            createdBy: user?.name || 'Master Admin',
            prices: {},
          });
        }

        if (parsed.length === 0) {
          setImportError('Nenhum registro válido encontrado na planilha. Verifique se as colunas estão com os nomes corretos: Tipo, Descrição. Colunas opcionais: Grupo de Serviço, Unid, Cód Atrelado, Cód Avulso.');
          return;
        }

        setImportPreview(parsed);
        setIsImportDialogOpen(true);
      } catch (err) {
        setImportError('Erro ao processar o arquivo. Verifique se é um arquivo Excel válido (.xlsx ou .xls).');
      }
    };

    reader.readAsBinaryString(file);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = (prazo: string, selectedPlazas: string[]) => {
    const codesWithPrazo = importPreview.map((c) => ({
      ...c,
      prazo: prazo || '',
      targetPlazas: selectedPlazas,
    }));
    addCodes(codesWithPrazo);
    setImportPreview([]);
    setIsImportDialogOpen(false);
    toast.success(`${codesWithPrazo.length} código(s) importados com sucesso para ${selectedPlazas.length} praça(s)!`);
  };

  const handleImportExcel = () => {
    fileInputRef.current?.click();
  };

  const getStatusBadge = (status: PricingCode['status']) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Pendente</Badge>;
      case 'em_andamento':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Em Andamento</Badge>;
      case 'concluido':
        return <Badge variant="outline" className="text-green-600 border-green-600">Concluído</Badge>;
    }
  };

  const getTipoBadgeColor = (tipo: PricingCode['tipo']) => {
    switch (tipo) {
      case 'Visita Técnica':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Serviço':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Inst + Pague -':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Emergencial':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Complementar':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Deslocamento':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Reforma':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // Helper to display code(s) - priority: avulso > atrelado > service name only
  const getCodesDisplay = (code: PricingCode) => {
    const hasAtrelado = !!code.codigoAtrelado;
    const hasAvulso = !!code.codigoAvulso;

    if (hasAtrelado && hasAvulso) {
      // When both exist, display both but avulso takes priority as the utilized code
      return { atrelado: code.codigoAtrelado!, avulso: code.codigoAvulso!, label: 'Avulso (prioritário)' };
    }
    if (hasAvulso) {
      return { atrelado: null, avulso: code.codigoAvulso!, label: 'Apenas Avulso' };
    }
    if (hasAtrelado) {
      // When no avulso, bring atrelado
      return { atrelado: code.codigoAtrelado!, avulso: null, label: 'Apenas Atrelado' };
    }
    // When neither exists, just the service name
    return { atrelado: null, avulso: null, label: 'Apenas Nome' };
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Códigos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{codes.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{pendingCodes.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{inProgressCodes.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{completedCodes.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações principais */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Códigos para Precificação</CardTitle>
              <CardDescription>
                Adicione códigos de serviço que precisam ser precificados pelos administradores
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {/* Hidden file input for Excel import */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button variant="outline" onClick={handleImportExcel}>
                <Upload className="w-4 h-4 mr-2" />
                Importar Excel
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Código
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Código</DialogTitle>
                    <DialogDescription>
                      Preencha as informações do código de serviço que precisa ser precificado
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="grupoServico">Grupo de Serviço</Label>
                      <Input
                        id="grupoServico"
                        value={newCode.grupoServico}
                        onChange={(e) => setNewCode({ ...newCode, grupoServico: e.target.value })}
                        placeholder="Ex: Chuveiro/Torneira Elétrica"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tipo">Tipo *</Label>
                        <Select
                          value={newCode.tipo}
                          onValueChange={(value) => setNewCode({ ...newCode, tipo: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Visita Técnica">Visita Técnica</SelectItem>
                            <SelectItem value="Serviço">Serviço</SelectItem>
                            <SelectItem value="Reforma">Reforma</SelectItem>
                            <SelectItem value="Inst + Pague -">Inst + Pague -</SelectItem>
                            <SelectItem value="Emergencial">Emergencial</SelectItem>
                            <SelectItem value="Complementar">Complementar</SelectItem>
                            <SelectItem value="Deslocamento">Deslocamento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unidade">Unidade *</Label>
                        <Input
                          id="unidade"
                          value={newCode.unidade}
                          onChange={(e) => setNewCode({ ...newCode, unidade: e.target.value })}
                          placeholder="un, m2, km, etc."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição *</Label>
                      <Input
                        id="descricao"
                        value={newCode.descricao}
                        onChange={(e) => setNewCode({ ...newCode, descricao: e.target.value })}
                        placeholder="Ex: Renovação dos itens do banheiro"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="codigoAvulso">Código Avulso</Label>
                        <Input
                          id="codigoAvulso"
                          value={newCode.codigoAvulso}
                          onChange={(e) => setNewCode({ ...newCode, codigoAvulso: e.target.value })}
                          placeholder="Ex: 50041154"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="codigoAtrelado">Código Atrelado</Label>
                        <Input
                          id="codigoAtrelado"
                          value={newCode.codigoAtrelado}
                          onChange={(e) => setNewCode({ ...newCode, codigoAtrelado: e.target.value })}
                          placeholder="Ex: 49050960"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prazo">Prazo para Preenchimento *</Label>
                      <Input
                        id="prazo"
                        value={newCode.prazo}
                        onChange={(e) => setNewCode({ ...newCode, prazo: e.target.value })}
                        placeholder="Ex: 16/03 à 31/03"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddCode}>Adicionar Código</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum código cadastrado
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Adicione códigos de serviço para que os administradores possam precificá-los
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Código
              </Button>
            </div>
          ) : (
            <GroupedCodesView
              codes={codes}
              getTipoBadgeColor={getTipoBadgeColor}
              getStatusBadge={getStatusBadge}
              removeCode={removeCode}
              updateCodeMeta={updateCodeMeta}
            />
          )}
        </CardContent>
      </Card>

      {/* Alerta se houver códigos pendentes */}
      {pendingCodes.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-900 mb-1">
                  Códigos aguardando precificação
                </h4>
                <p className="text-sm text-orange-800">
                  Existem {pendingCodes.length} código(s) aguardando que os administradores
                  realizem a precificação. Os administradores podem acessar esses códigos no
                  dashboard deles.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import error alert */}
      {importError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">Erro na importação</h4>
                <p className="text-sm text-red-800">{importError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import preview dialog */}
      <ImportPreviewDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        previewCodes={importPreview}
        getTipoBadgeColor={getTipoBadgeColor}
        onConfirm={handleConfirmImport}
      />
    </div>
  );
}

// ----- Grouped Codes View -----
interface GroupedCodesViewProps {
  codes: PricingCode[];
  getTipoBadgeColor: (tipo: PricingCode['tipo']) => string;
  getStatusBadge: (status: PricingCode['status']) => React.ReactNode;
  removeCode: (id: string) => void;
  updateCodeMeta: (id: string, meta: { fichaTecnica?: string; comentario?: string }) => void;
}

function GroupedCodesView({ codes, getTipoBadgeColor, getStatusBadge, removeCode, updateCodeMeta }: GroupedCodesViewProps) {
  // Dialog state for ficha técnica and comentário
  const [editingFicha, setEditingFicha] = useState<{ id: string; url: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: string; text: string } | null>(null);

  const handleSaveFicha = () => {
    if (!editingFicha) return;
    updateCodeMeta(editingFicha.id, { fichaTecnica: editingFicha.url.trim() || undefined });
    setEditingFicha(null);
  };

  const handleSaveComment = () => {
    if (!editingComment) return;
    updateCodeMeta(editingComment.id, { comentario: editingComment.text.trim() || undefined });
    setEditingComment(null);
  };

  // Group codes by grupoServico
  const grouped = codes.reduce<Record<string, PricingCode[]>>((acc, code) => {
    const group = code.grupoServico || UNGROUPED_KEY;
    if (!acc[group]) acc[group] = [];
    acc[group].push(code);
    return acc;
  }, {});

  const groupNames = Object.keys(grouped).sort((a, b) => {
    if (a === UNGROUPED_KEY) return 1;
    if (b === UNGROUPED_KEY) return -1;
    return a.localeCompare(b);
  });

  // If no groups are defined, render a flat table
  const hasGroups = groupNames.some((g) => g !== UNGROUPED_KEY);

  const renderCodesTable = (groupCodes: PricingCode[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Unid</TableHead>
            <TableHead>Cód. Atrelado</TableHead>
            <TableHead>Cód. Avulso</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progresso</TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupCodes.map((code) => {
            const filledPlazas = Object.keys(code.prices || {}).length;
            const totalPlazas = code.targetPlazas?.length || ALL_PLAZAS.length;
            const progressPercentage = (filledPlazas / totalPlazas) * 100;

            return (
              <TableRow key={code.id}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Badge className={getTipoBadgeColor(code.tipo)}>
                      {code.tipo}
                    </Badge>
                    {code.tipo === 'Serviço' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title={code.fichaTecnica ? 'Ver / editar ficha técnica' : 'Adicionar ficha técnica'}
                        onClick={() => setEditingFicha({ id: code.id, url: code.fichaTecnica || '' })}
                        className={`h-6 w-6 p-0 ${code.fichaTecnica ? 'text-blue-600 hover:text-blue-700' : 'text-gray-400 hover:text-blue-600'}`}
                      >
                        <Link className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {code.descricao}
                    </p>
                    {code.comentario && (
                      <span title={code.comentario}>
                        <MessageSquare className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">{code.unidade}</TableCell>
                <TableCell className="text-sm font-mono text-gray-600">
                  {code.codigoAtrelado || '-'}
                </TableCell>
                <TableCell className="text-sm font-mono font-semibold text-gray-900">
                  {code.codigoAvulso || '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="w-3 h-3" />
                    {code.prazo}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(code.status)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{filledPlazas}/{totalPlazas} praças</span>
                      <span>{progressPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          progressPercentage === 100
                            ? 'bg-green-600'
                            : progressPercentage > 0
                            ? 'bg-blue-600'
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      title={code.comentario ? 'Ver / editar comentário' : 'Adicionar comentário'}
                      onClick={() => setEditingComment({ id: code.id, text: code.comentario || '' })}
                      className={`h-7 w-7 p-0 ${code.comentario ? 'text-amber-500 hover:text-amber-600' : 'text-gray-400 hover:text-amber-500'}`}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCode(code.id)}
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  if (!hasGroups) {
    return (
      <>
        {renderCodesTable(codes)}
        {renderDialogs()}
      </>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {groupNames.map((groupName) => {
          const groupCodes = grouped[groupName];
          const isUngrouped = groupName === UNGROUPED_KEY;
          const displayName = isUngrouped ? 'Sem Grupo' : groupName;

          return (
            <Collapsible key={groupName} defaultOpen>
              <div className="border-2 border-indigo-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CollapsibleTrigger asChild>
                  <button
                    className="flex items-center justify-between w-full px-5 py-4 bg-indigo-50 hover:bg-indigo-100 transition-colors text-left group border-l-4 border-l-indigo-500"
                    aria-label={`Grupo ${displayName}, ${groupCodes.length} serviço(s)`}
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-6 h-6 text-indigo-600" />
                      <span className="font-bold text-lg text-gray-900">{displayName}</span>
                      <Badge variant="outline" className="text-sm px-3 py-1 font-semibold border-indigo-300 text-indigo-700 bg-white">
                        {groupCodes.length} serviço(s)
                      </Badge>
                    </div>
                    <ChevronDown className="w-5 h-5 text-indigo-500 transition-transform group-data-[state=closed]:rotate-[-90deg]" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {renderCodesTable(groupCodes)}
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
      {renderDialogs()}
    </>
  );

  function renderDialogs() {
    return (
      <>
        {/* Ficha Técnica Dialog */}
        <Dialog open={!!editingFicha} onOpenChange={(open) => { if (!open) setEditingFicha(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link className="w-5 h-5 text-blue-600" />
                Ficha Técnica do Serviço
              </DialogTitle>
              <DialogDescription>
                Informe o link da ficha técnica. Ao salvar, o ícone ficará em destaque na linha do serviço.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label htmlFor="ficha-url">URL da Ficha Técnica</Label>
              <Input
                id="ficha-url"
                value={editingFicha?.url ?? ''}
                onChange={(e) => setEditingFicha((prev) => prev ? { ...prev, url: e.target.value } : prev)}
                placeholder="https://exemplo.com/ficha-tecnica"
                type="url"
              />
              {editingFicha?.url && (
                <a
                  href={editingFicha.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir link em nova aba
                </a>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingFicha(null)}>
                Cancelar
              </Button>
              {editingFicha?.url && (
                <Button
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => {
                    updateCodeMeta(editingFicha.id, { fichaTecnica: undefined });
                    setEditingFicha(null);
                  }}
                >
                  Remover link
                </Button>
              )}
              <Button onClick={handleSaveFicha}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Comentário Dialog */}
        <Dialog open={!!editingComment} onOpenChange={(open) => { if (!open) setEditingComment(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                Comentário do Serviço
              </DialogTitle>
              <DialogDescription>
                Adicione observações ou instruções sobre este serviço para auxiliar administradores e usuários na precificação.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label htmlFor="comentario-text">Comentário</Label>
              <Textarea
                id="comentario-text"
                value={editingComment?.text ?? ''}
                onChange={(e) => setEditingComment((prev) => prev ? { ...prev, text: e.target.value } : prev)}
                placeholder="Ex: Atenção — verificar compatibilidade de tensão antes de precificar..."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingComment(null)}>
                Cancelar
              </Button>
              {editingComment?.text && (
                <Button
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => {
                    updateCodeMeta(editingComment.id, { comentario: undefined });
                    setEditingComment(null);
                  }}
                >
                  Remover comentário
                </Button>
              )}
              <Button onClick={handleSaveComment}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
}

// ----- Import Preview Dialog -----
interface ImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewCodes: Omit<PricingCode, 'id' | 'createdAt' | 'status'>[];
  getTipoBadgeColor: (tipo: PricingCode['tipo']) => string;
  onConfirm: (prazo: string, selectedPlazas: string[]) => void;
}

function ImportPreviewDialog({ open, onOpenChange, previewCodes, getTipoBadgeColor, onConfirm }: ImportPreviewDialogProps) {
  const [prazo, setPrazo] = useState('');
  const [selectedPlazas, setSelectedPlazas] = useState<Set<string>>(new Set(ALL_PLAZAS));
  const [plazaPopoverOpen, setPlazaPopoverOpen] = useState(false);

  const allSelected = selectedPlazas.size === ALL_PLAZAS.length;
  const noneSelected = selectedPlazas.size === 0;

  const togglePlaza = (plaza: string) => {
    setSelectedPlazas((prev) => {
      const next = new Set(prev);
      if (next.has(plaza)) {
        next.delete(plaza);
      } else {
        next.add(plaza);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedPlazas(new Set());
    } else {
      setSelectedPlazas(new Set(ALL_PLAZAS));
    }
  };

  const getPlazaLabel = () => {
    if (allSelected) return 'Todas as praças';
    if (noneSelected) return 'Nenhuma praça selecionada';
    if (selectedPlazas.size <= 3) return Array.from(selectedPlazas).join(', ');
    return `${selectedPlazas.size} praças selecionadas`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Pré-visualização da Importação
          </DialogTitle>
          <DialogDescription>
            {previewCodes.length} serviço(s) encontrados na planilha. Defina o prazo, selecione as praças e confirme a importação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Prazo input */}
          <div className="space-y-2">
            <Label htmlFor="import-prazo">Prazo para Preenchimento</Label>
            <Input
              id="import-prazo"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              placeholder="Ex: 16/03 à 31/03"
            />
          </div>

          {/* Praças multi-select */}
          <div className="space-y-2">
            <Label>Praças de Destino</Label>
            <Popover open={plazaPopoverOpen} onOpenChange={setPlazaPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={plazaPopoverOpen}
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">{getPlazaLabel()}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                  {/* Select/Deselect all */}
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 cursor-pointer border-b pb-2 mb-1"
                    onClick={toggleAll}
                  >
                    <Checkbox
                      checked={allSelected}
                      aria-label="Selecionar todas as praças"
                    />
                    <span className="text-sm font-medium">
                      {allSelected ? 'Desmarcar todas' : 'Selecionar todas'}
                    </span>
                  </div>
                  {/* Individual plazas */}
                  {ALL_PLAZAS.map((plaza) => (
                    <div
                      key={plaza}
                      className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 cursor-pointer"
                      onClick={() => togglePlaza(plaza)}
                    >
                      <Checkbox
                        checked={selectedPlazas.has(plaza)}
                        aria-label={`Praça ${plaza}`}
                      />
                      <span className="text-sm">{plaza}</span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-gray-500">
              {selectedPlazas.size} de {ALL_PLAZAS.length} praças selecionadas
            </p>
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grupo de Serviço</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Unid</TableHead>
                  <TableHead>Cód. Atrelado</TableHead>
                  <TableHead>Cód. Avulso</TableHead>
                  <TableHead>Código Utilizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewCodes.map((code, index) => {
                  const hasAvulso = !!code.codigoAvulso;
                  const hasAtrelado = !!code.codigoAtrelado;
                  // Priority: avulso > atrelado > service name only
                  const codigoUtilizado = hasAvulso
                    ? code.codigoAvulso!
                    : hasAtrelado
                      ? code.codigoAtrelado!
                      : code.descricao;
                  const codigoTipo = hasAvulso ? 'Avulso' : hasAtrelado ? 'Atrelado' : 'Apenas Nome';

                  return (
                    <TableRow key={index}>
                      <TableCell className="text-sm font-medium text-indigo-700">
                        {code.grupoServico || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTipoBadgeColor(code.tipo)}>
                          {code.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">
                        {code.descricao}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{code.unidade}</TableCell>
                      <TableCell className="text-sm font-mono text-gray-600">
                        {code.codigoAtrelado || '-'}
                      </TableCell>
                      <TableCell className="text-sm font-mono font-semibold text-gray-900">
                        {code.codigoAvulso || '-'}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        <span className={
                          hasAvulso
                            ? 'font-semibold text-green-700'
                            : hasAtrelado
                              ? 'font-medium text-blue-700'
                              : 'italic text-gray-500'
                        }>
                          {codigoUtilizado}
                        </span>
                        <span className="ml-1 text-xs text-gray-400">({codigoTipo})</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(prazo, Array.from(selectedPlazas))} disabled={noneSelected}>
            <Upload className="w-4 h-4 mr-2" />
            Importar {previewCodes.length} Serviço(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}