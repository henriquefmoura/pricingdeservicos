import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Trash2, Upload, FileSpreadsheet, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { usePricingCodesStore, PricingCode, PricingCodeTipo } from '../store/pricingCodesStore';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

export function PricingCodesManager() {
  const { user } = useAuthStore();
  const { codes, addCode, addCodes, removeCode, getCodesByStatus, clearCodes } = usePricingCodesStore();
  
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
    if (cleaned.includes('servi')) return 'Serviço';
    return 'Serviço'; // default
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportPreview([]);

    const reader = new FileReader();
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
          const tipo = String(row['Tipo'] ?? row['tipo'] ?? '');
          const descricao = String(row['Descrição'] ?? row['Descricao'] ?? row['descricao'] ?? row['Descriçao'] ?? '');
          const unidade = String(row['Unid'] ?? row['Unidade'] ?? row['unid'] ?? row['unidade'] ?? 'un');
          const codAtrelado = String(row['Cód Atrelado'] ?? row['Cod Atrelado'] ?? row['CodAtrelado'] ?? row['cod_atrelado'] ?? '');
          const codAvulso = String(row['Cód Avulso'] ?? row['Cod Avulso'] ?? row['CodAvulso'] ?? row['cod_avulso'] ?? '');

          if (!descricao && !codAtrelado && !codAvulso) continue; // skip empty rows

          parsed.push({
            tipo: normalizeTipo(tipo),
            descricao: descricao.trim(),
            unidade: unidade.trim() || 'un',
            codigoAtrelado: codAtrelado.trim() || undefined,
            codigoAvulso: codAvulso.trim() || undefined,
            prazo: '',
            createdBy: user?.name || 'Master Admin',
            prices: {},
          });
        }

        if (parsed.length === 0) {
          setImportError('Nenhum registro válido encontrado na planilha. Verifique se as colunas estão com os nomes corretos: Tipo, Descrição, Unid, Cód Atrelado, Cód Avulso.');
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

  const handleConfirmImport = (prazo: string) => {
    const codesWithPrazo = importPreview.map((c) => ({
      ...c,
      prazo: prazo || '',
    }));
    addCodes(codesWithPrazo);
    setImportPreview([]);
    setIsImportDialogOpen(false);
    toast.success(`${codesWithPrazo.length} código(s) importados com sucesso!`);
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
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // Helper to display code(s) - shows both together when both present
  const getCodesDisplay = (code: PricingCode) => {
    const hasAtrelado = !!code.codigoAtrelado;
    const hasAvulso = !!code.codigoAvulso;

    if (hasAtrelado && hasAvulso) {
      return { atrelado: code.codigoAtrelado!, avulso: code.codigoAvulso!, label: 'Ambos' };
    }
    if (hasAtrelado) {
      return { atrelado: code.codigoAtrelado!, avulso: null, label: 'Apenas Atrelado' };
    }
    if (hasAvulso) {
      return { atrelado: null, avulso: code.codigoAvulso!, label: 'Apenas Avulso' };
    }
    return { atrelado: null, avulso: null, label: '-' };
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
                  {codes.map((code) => {
                    const filledPlazas = Object.keys(code.prices || {}).length;
                    const progressPercentage = (filledPlazas / 27) * 100;

                    return (
                      <TableRow key={code.id}>
                        <TableCell>
                          <Badge className={getTipoBadgeColor(code.tipo)}>
                            {code.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {code.descricao}
                          </p>
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
                              <span>{filledPlazas}/27 praças</span>
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
                          <div className="flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCode(code.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

// ----- Import Preview Dialog -----
interface ImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewCodes: Omit<PricingCode, 'id' | 'createdAt' | 'status'>[];
  getTipoBadgeColor: (tipo: PricingCode['tipo']) => string;
  onConfirm: (prazo: string) => void;
}

function ImportPreviewDialog({ open, onOpenChange, previewCodes, getTipoBadgeColor, onConfirm }: ImportPreviewDialogProps) {
  const [prazo, setPrazo] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Pré-visualização da Importação
          </DialogTitle>
          <DialogDescription>
            {previewCodes.length} código(s) encontrados na planilha. Defina o prazo e confirme a importação.
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

          {/* Preview table */}
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Unid</TableHead>
                  <TableHead>Cód. Atrelado</TableHead>
                  <TableHead>Cód. Avulso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewCodes.map((code, index) => (
                  <TableRow key={index}>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(prazo)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar {previewCodes.length} Código(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}