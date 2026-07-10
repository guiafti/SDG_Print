
/**
 * Utilitário para Impressão Térmica ESC/POS (58mm)
 * Baseado nas instruções: 32 colunas, ASCII, Comandos ESC/POS
 */

const ESC = 0x1b;
const GS = 0x1d;

export const PRINTER_CONFIG = {
  vendorId: 0x28e9,
  productId: 0x0289,
  cols: 32
};

export class PrinterService {
  private device: any = null;

  async connect() {
    try {
      this.device = await (navigator as any).usb.requestDevice({
        filters: [{ vendorId: PRINTER_CONFIG.vendorId, productId: PRINTER_CONFIG.productId }]
      });

      await this.device.open();
      await this.device.selectConfiguration(1);
      await this.device.claimInterface(0);
      
      // Inicializar impressora (ESC @)
      await this.sendRaw(new Uint8Array([ESC, 0x40]));
      return true;
    } catch (error) {
      console.error("Erro ao conectar na impressora:", error);
      return false;
    }
  }

  async sendRaw(data: Uint8Array) {
    if (!this.device) throw new Error("Impressora não conectada");
    // Enviar para o endpoint 1 (comum em impressoras térmicas)
    await this.device.transferOut(1, data);
  }

  // Traduz string para ASCII (substituindo acentos conforme o guia)
  encode(text: string): Uint8Array {
    const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, ""); // Remove acentos
    const bytes = new Uint8Array(normalized.length);
    for (let i = 0; i < normalized.length; i++) {
      const code = normalized.charCodeAt(i);
      bytes[i] = code < 128 ? code : 63; // 63 é '?' para caracteres não ASCII
    }
    return bytes;
  }

  async printLine(text: string = "") {
    const data = this.encode(text + "\n");
    await this.sendRaw(data);
  }

  // Formata uma linha com texto na esquerda e direita (total 32 colunas)
  async printLeftRight(left: string, right: string) {
    const spaceCount = PRINTER_CONFIG.cols - (left.length + right.length);
    const spaces = " ".repeat(Math.max(0, spaceCount));
    await this.printLine(left + spaces + right);
  }

  async printCentered(text: string) {
    const spaceCount = Math.floor((PRINTER_CONFIG.cols - text.length) / 2);
    const spaces = " ".repeat(Math.max(0, spaceCount));
    await this.printLine(spaces + text);
  }

  async printSeparator() {
    await this.printLine("-".repeat(PRINTER_CONFIG.cols));
  }

  async feedAndCut() {
    // Avançar 5 linhas conforme o guia
    await this.sendRaw(new Uint8Array([ESC, 0x64, 0x05]));
    // Se a impressora tiver guilhotina (GS V 66 0)
    await this.sendRaw(new Uint8Array([GS, 0x56, 0x42, 0x00]));
  }

  async printReceipt(venda: any) {
    if (!this.device) {
      const connected = await this.connect();
      if (!connected) return;
    }

    // Header
    await this.sendRaw(new Uint8Array([ESC, 0x45, 0x01])); // Negrito ON
    await this.printCentered("IMAGINART");
    await this.sendRaw(new Uint8Array([ESC, 0x45, 0x00])); // Negrito OFF
    await this.printCentered("Grafica & Personalizados");
    await this.printLine();
    
    await this.printLine(`Data: ${new Date().toLocaleDateString('pt-BR')}`);
    await this.printLine(`Venda: #${venda.id}`);
    if (venda.cliente) await this.printLine(`Cli: ${venda.cliente}`);
    await this.printSeparator();

    // Itens
    for (const item of venda.itens) {
      // Nome do item (pode ocupar mais de uma linha se for longo, mas vamos truncar/quebrar)
      await this.printLine(`${item.qty}x ${item.nome.substring(0, 26)}`);
      await this.printLeftRight("", item.precoTotal);
    }
    await this.printSeparator();

    // Totais
    await this.printLeftRight("SUBTOTAL:", venda.subtotal);
    if (venda.desconto > 0) {
      await this.printLeftRight("DESCONTO:", "-" + venda.descontoTotal);
    }
    
    await this.sendRaw(new Uint8Array([ESC, 0x45, 0x01])); // Negrito ON
    await this.printLeftRight("TOTAL:", venda.total);
    await this.sendRaw(new Uint8Array([ESC, 0x45, 0x00])); // Negrito OFF
    
    await this.printLine();
    await this.printCentered("Obrigado pela preferencia!");
    await this.feedAndCut();
  }
}

export const printerService = new PrinterService();
