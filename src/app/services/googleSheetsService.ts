/**
 * Serviço para integração com Google Sheets
 * 
 * SETUP NECESSÁRIO:
 * 1. Criar um projeto no Google Cloud Console (https://console.cloud.google.com)
 * 2. Habilitar a Google Sheets API
 * 3. Criar credenciais (API Key) para acesso público
 * 4. Tornar a planilha pública (ou configurar OAuth para acesso privado)
 * 
 * FORMATO DA URL DA PLANILHA:
 * https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
 */

export interface GoogleSheetsConfig {
  apiKey: string;
  spreadsheetId: string;
  sheetName: string; // Nome da aba (ex: "Dados", "Preços", etc)
}

export interface SheetData {
  headers: string[];
  rows: any[][];
}

export class GoogleSheetsService {
  private config: GoogleSheetsConfig | null = null;

  /**
   * Configura as credenciais do Google Sheets
   */
  setConfig(config: GoogleSheetsConfig) {
    this.config = config;
  }

  /**
   * Obtém a configuração atual
   */
  getConfig(): GoogleSheetsConfig | null {
    return this.config;
  }

  /**
   * Busca dados da planilha do Google Sheets
   */
  async fetchSheetData(): Promise<SheetData> {
    if (!this.config) {
      throw new Error('Google Sheets não configurado. Configure primeiro usando setConfig()');
    }

    const { apiKey, spreadsheetId, sheetName } = this.config;

    try {
      // URL da API do Google Sheets v4
      const range = `${sheetName}!A:ZZ`; // Busca todas as colunas de A até ZZ
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

      console.log('🔄 Buscando dados do Google Sheets...');
      
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro ao buscar dados: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      if (!data.values || data.values.length === 0) {
        throw new Error('Planilha vazia ou sem dados');
      }

      // Primeira linha são os cabeçalhos
      const headers = data.values[0];
      // Restante são os dados
      const rows = data.values.slice(1);

      console.log('✅ Dados carregados:', {
        headers,
        rowCount: rows.length,
        columnCount: headers.length,
      });

      return { headers, rows };
    } catch (error) {
      console.error('❌ Erro ao buscar dados do Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Converte os dados brutos da planilha em objetos
   * Cada linha vira um objeto com as chaves sendo os headers
   */
  convertToObjects(sheetData: SheetData): Record<string, any>[] {
    const { headers, rows } = sheetData;

    return rows.map((row) => {
      const obj: Record<string, any> = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || ''; // Preenche com string vazia se não houver valor
      });
      return obj;
    });
  }

  /**
   * Busca e converte os dados em um único passo
   */
  async fetchAndConvert(): Promise<Record<string, any>[]> {
    const sheetData = await this.fetchSheetData();
    return this.convertToObjects(sheetData);
  }

  /**
   * Testa a conexão com a planilha
   */
  async testConnection(): Promise<{ success: boolean; message: string; preview?: any }> {
    try {
      const sheetData = await this.fetchSheetData();
      const firstRows = sheetData.rows.slice(0, 3); // Primeiras 3 linhas para preview
      
      return {
        success: true,
        message: `Conexão bem-sucedida! ${sheetData.rows.length} linhas encontradas.`,
        preview: {
          headers: sheetData.headers,
          sampleRows: firstRows,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Extrai o Spreadsheet ID de uma URL do Google Sheets
   */
  static extractSpreadsheetId(url: string): string | null {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  /**
   * Valida se uma API Key está no formato correto
   */
  static isValidApiKey(apiKey: string): boolean {
    // API Keys do Google geralmente têm 39 caracteres
    return apiKey.length >= 20 && /^[A-Za-z0-9_-]+$/.test(apiKey);
  }
}

// Singleton global para ser usado em toda a aplicação
export const googleSheetsService = new GoogleSheetsService();
