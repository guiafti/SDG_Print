import { ipcMain, dialog, BrowserWindow } from 'electron';
import db from './db';
import fs from 'fs';

export function registerIpcHandlers() {
  // ... rest of handlers

  ipcMain.handle('get-produtos', () => {
    return db.prepare('SELECT * FROM produtos').all();
  });

  ipcMain.handle('add-produto', (_, produto) => {
    const { nome, categoria, preco, estoque } = produto;
    const info = db.prepare('INSERT INTO produtos (nome, categoria, preco, estoque) VALUES (?, ?, ?, ?)').run(nome, categoria, preco, estoque);
    return Number(info.lastInsertRowid);
  });

  ipcMain.handle('update-produto', (_, produto) => {
    const { id, nome, categoria, preco, estoque } = produto;
    return db.prepare('UPDATE produtos SET nome = ?, categoria = ?, preco = ?, estoque = ? WHERE id = ?').run(nome, categoria, preco, estoque, id);
  });

  ipcMain.handle('delete-produto', (_, id) => {
    return db.prepare('DELETE FROM produtos WHERE id = ?').run(id);
  });

  // Clientes
  ipcMain.handle('get-clientes', () => {
    return db.prepare('SELECT * FROM clientes').all();
  });

  ipcMain.handle('add-cliente', (_, cliente) => {
    const { nome, email, telefone, documento, data_nascimento, tags } = cliente;
    const info = db.prepare('INSERT INTO clientes (nome, email, telefone, documento, data_nascimento, tags) VALUES (?, ?, ?, ?, ?, ?)').run(nome, email, telefone, documento, data_nascimento, tags);
    return Number(info.lastInsertRowid);
  });

  ipcMain.handle('update-cliente', (_, cliente) => {
    const { id, nome, email, telefone, documento, data_nascimento, tags } = cliente;
    return db.prepare('UPDATE clientes SET nome = ?, email = ?, telefone = ?, documento = ?, data_nascimento = ?, tags = ? WHERE id = ?').run(nome, email, telefone, documento, data_nascimento, tags, id);
  });

  ipcMain.handle('delete-cliente', (_, id) => {
    return db.prepare('DELETE FROM clientes WHERE id = ?').run(id);
  });

  ipcMain.handle('get-cliente-historico', (_, clienteId) => {
    return db.prepare(`
      SELECT v.*, group_concat(p.nome || ' (x' || iv.quantidade || ')') as itens
      FROM vendas v
      JOIN itens_venda iv ON v.id = iv.venda_id
      JOIN produtos p ON iv.produto_id = p.id
      WHERE v.cliente_id = ?
      GROUP BY v.id
      ORDER BY v.data DESC
    `).all(clienteId);
  });

  // Orçamentos
  ipcMain.handle('get-orcamentos', () => {
    return db.prepare(`
      SELECT o.*, c.nome as cliente_nome
      FROM orcamentos o
      LEFT JOIN clientes c ON o.cliente_id = c.id
      ORDER BY o.data DESC
    `).all();
  });

  ipcMain.handle('add-orcamento', (_, data) => {
    const { cliente_id, cliente_nome_manual, total, validade, observacoes, itens } = data;
    
    const transaction = db.transaction(() => {
      const orcInfo = db.prepare(`
        INSERT INTO orcamentos (cliente_id, cliente_nome_manual, total, validade, observacoes)
        VALUES (?, ?, ?, ?, ?)
      `).run(cliente_id, cliente_nome_manual, total, validade, observacoes);
      
      const orcId = orcInfo.lastInsertRowid;
      
      const insertItem = db.prepare(`
        INSERT INTO itens_orcamento (orcamento_id, descricao, quantidade, preco_unitario)
        VALUES (?, ?, ?, ?)
      `);
      
      for (const item of itens) {
        insertItem.run(orcId, item.descricao, item.quantidade, item.preco_unitario);
      }
      
      return Number(orcId);
    });
    
    return transaction();
  });

  ipcMain.handle('update-status-orcamento', (_, { id, status }) => {
    return db.prepare('UPDATE orcamentos SET status = ? WHERE id = ?').run(status, id);
  });

  ipcMain.handle('get-orcamento-detalhes', (_, id) => {
    const orcamento = db.prepare(`
      SELECT o.*, c.nome as cliente_nome, c.telefone as cliente_telefone, c.email as cliente_email
      FROM orcamentos o
      LEFT JOIN clientes c ON o.cliente_id = c.id
      WHERE o.id = ?
    `).get(id);
    
    const itens = db.prepare('SELECT * FROM itens_orcamento WHERE orcamento_id = ?').all(id);
    
    return { orcamento, itens };
  });

  // Impressão PDF PROFISSIONAL (Geração em Janela Oculta)
  ipcMain.handle('generate-pdf', async (event, { htmlContent, fileName }) => {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Salvar Orçamento Profissional',
      defaultPath: fileName || `Orcamento_Imaginart_${Date.now()}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });

    if (!filePath) return false;

    // Cria uma janela oculta para renderizar o PDF de forma isolada
    let workerWindow: any = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false
      }
    });

    // Carrega o HTML customizado
    await workerWindow.loadURL(`data:text/html;charset=utf-8,${encodeHeight(htmlContent)}`);

    function encodeHeight(html: string) {
        return html.replace(/#/g, '%23'); // Fix para caracteres especiais no data URL
    }

    try {
      const data = await workerWindow.webContents.printToPDF({
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        printBackground: true,
        pageSize: 'A4'
      });
      fs.writeFileSync(filePath, data);
      workerWindow.close();
      workerWindow = null;
      return true;
    } catch (error) {
      console.error(error);
      workerWindow.close();
      return false;
    }
  });

  // Vendas
  ipcMain.handle('finalizar-venda', (_, vendaData) => {
    const { cliente_id, subtotal, desconto, total, forma_pagamento, itens } = vendaData;
    
    const transaction = db.transaction(() => {
      // 1. Inserir venda
      const vendaInfo = db.prepare(`
        INSERT INTO vendas (cliente_id, subtotal, desconto, total, forma_pagamento)
        VALUES (?, ?, ?, ?, ?)
      `).run(cliente_id, subtotal, desconto, total, forma_pagamento);
      
      const vendaId = vendaInfo.lastInsertRowid;
      
      // 2. Inserir itens e baixar estoque
      const insertItem = db.prepare(`
        INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario)
        VALUES (?, ?, ?, ?)
      `);
      
      const updateEstoque = db.prepare(`
        UPDATE produtos SET estoque = estoque - ? WHERE id = ?
      `);
      
      for (const item of itens) {
        insertItem.run(vendaId, item.produto_id, item.quantidade, item.preco_unitario);
        updateEstoque.run(item.quantidade, item.produto_id);
      }
      
      // 3. Registrar no financeiro
      db.prepare(`
        INSERT INTO financeiro (descricao, tipo, valor)
        VALUES (?, 'receita', ?)
      `).run(`Venda #${vendaId}`, total);
      
      return Number(vendaId);
    });
    
    return transaction();
  });

  // Financeiro
  ipcMain.handle('get-financeiro', () => {
    return db.prepare('SELECT * FROM financeiro ORDER BY data DESC').all();
  });
  
  ipcMain.handle('add-transacao', (_, transacao) => {
    const { descricao, tipo, valor } = transacao;
    return db.prepare('INSERT INTO financeiro (descricao, tipo, valor) VALUES (?, ?, ?)').run(descricao, tipo, valor);
  });

  // Exportação
  ipcMain.handle('save-csv', async (_, { content, defaultName }) => {
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: defaultName || 'export.csv',
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    });
    
    if (filePath) {
      fs.writeFileSync(filePath, content, 'utf-8');
      return true;
    }
    return false;
  });

  // Configurações
  ipcMain.handle('select-logo', async () => {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Selecionar Logomarca',
      filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg'] }],
      properties: ['openFile']
    });
    
    if (filePaths && filePaths.length > 0) {
      const filePath = filePaths[0];
      const imageBuffer = fs.readFileSync(filePath);
      const extension = filePath.split('.').pop();
      const base64Image = `data:image/${extension};base64,${imageBuffer.toString('base64')}`;
      return base64Image;
    }
    return null;
  });

  ipcMain.handle('get-configuracoes', () => {
    return db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
  });

  ipcMain.handle('save-configuracoes', (_, config) => {
    const { nome_fantasia, cnpj, telefone, email, chave_pix, banco_pix, titular_pix, logo_url } = config;
    const exists = db.prepare('SELECT id FROM configuracoes WHERE id = 1').get();
    
    if (exists) {
      return db.prepare(`
        UPDATE configuracoes 
        SET nome_fantasia = ?, cnpj = ?, telefone = ?, email = ?, chave_pix = ?, banco_pix = ?, titular_pix = ?, logo_url = ?
        WHERE id = 1
      `).run(nome_fantasia, cnpj, telefone, email, chave_pix, banco_pix, titular_pix, logo_url);
    } else {
      return db.prepare(`
        INSERT INTO configuracoes (id, nome_fantasia, cnpj, telefone, email, chave_pix, banco_pix, titular_pix, logo_url)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(nome_fantasia, cnpj, telefone, email, chave_pix, banco_pix, titular_pix, logo_url);
    }
  });

  // Pedidos de Produção
  ipcMain.handle('get-pedidos-producao', () => {
    const pedidos = db.prepare(`
      SELECT p.*, c.nome as cliente_nome, c.telefone as cliente_telefone, c.email as cliente_email
      FROM pedidos_producao p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      ORDER BY 
        CASE p.prioridade 
          WHEN 'urgente' THEN 1 
          WHEN 'alta' THEN 2 
          WHEN 'media' THEN 3 
          WHEN 'baixa' THEN 4 
        END,
        p.data_criacao DESC
    `).all();

    const getItens = db.prepare('SELECT * FROM itens_pedido_producao WHERE pedido_id = ?');
    return pedidos.map((p: any) => ({
      ...p,
      itens: getItens.all(p.id)
    }));
  });

  ipcMain.handle('add-pedido-producao', (_, data) => {
    const { cliente_id, cliente_nome_manual, data_entrega, status, prioridade, observacoes, total, orcamento_id, venda_id, itens } = data;
    
    const transaction = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO pedidos_producao (cliente_id, cliente_nome_manual, data_entrega, status, prioridade, observacoes, total, orcamento_id, venda_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        cliente_id || null, 
        cliente_nome_manual || null, 
        data_entrega || null, 
        status || 'fila', 
        prioridade || 'media', 
        observacoes || null, 
        total || 0,
        orcamento_id || null,
        venda_id || null
      );
      
      const pedidoId = info.lastInsertRowid;
      const insertItem = db.prepare(`
        INSERT INTO itens_pedido_producao (pedido_id, descricao, quantidade, detalhes_tecnicos)
        VALUES (?, ?, ?, ?)
      `);
      
      for (const item of itens) {
        insertItem.run(pedidoId, item.descricao, item.quantidade, item.detalhes_tecnicos || null);
      }
      
      return Number(pedidoId);
    });
    
    return transaction();
  });

  ipcMain.handle('update-status-pedido-producao', (_, { id, status }) => {
    return db.prepare('UPDATE pedidos_producao SET status = ? WHERE id = ?').run(status, id);
  });

  ipcMain.handle('update-prioridade-pedido-producao', (_, { id, prioridade }) => {
    return db.prepare('UPDATE pedidos_producao SET prioridade = ? WHERE id = ?').run(prioridade, id);
  });

  ipcMain.handle('update-detalhes-item-pedido', (_, { id, detalhes_tecnicos }) => {
    return db.prepare('UPDATE itens_pedido_producao SET detalhes_tecnicos = ? WHERE id = ?').run(detalhes_tecnicos, id);
  });

  ipcMain.handle('delete-pedido-producao', (_, id) => {
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM itens_pedido_producao WHERE pedido_id = ?').run(id);
      return db.prepare('DELETE FROM pedidos_producao WHERE id = ?').run(id);
    });
    return transaction();
  });
}
