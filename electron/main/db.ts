import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'sistema_imaginart.db');
const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      categoria TEXT,
      preco REAL NOT NULL,
      estoque INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT,
      telefone TEXT,
      documento TEXT,
      data_nascimento TEXT,
      tags TEXT
    );

    CREATE TABLE IF NOT EXISTS vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT DEFAULT (datetime('now', 'localtime')),
      cliente_id INTEGER,
      subtotal REAL NOT NULL,
      desconto REAL DEFAULT 0,
      total REAL NOT NULL,
      forma_pagamento TEXT,
      FOREIGN KEY (cliente_id) REFERENCES clientes (id)
    );

    CREATE TABLE IF NOT EXISTS itens_venda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venda_id INTEGER NOT NULL,
      produto_id INTEGER NOT NULL,
      quantidade INTEGER NOT NULL,
      preco_unitario REAL NOT NULL,
      FOREIGN KEY (venda_id) REFERENCES vendas (id),
      FOREIGN KEY (produto_id) REFERENCES produtos (id)
    );

    CREATE TABLE IF NOT EXISTS financeiro (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT DEFAULT (datetime('now', 'localtime')),
      descricao TEXT NOT NULL,
      tipo TEXT CHECK(tipo IN ('receita', 'despesa')) NOT NULL,
      valor REAL NOT NULL,
      status TEXT DEFAULT 'pago'
    );

    CREATE TABLE IF NOT EXISTS orcamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT DEFAULT (datetime('now', 'localtime')),
      cliente_id INTEGER,
      cliente_nome_manual TEXT,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pendente',
      validade TEXT,
      observacoes TEXT,
      FOREIGN KEY (cliente_id) REFERENCES clientes (id)
    );

    CREATE TABLE IF NOT EXISTS itens_orcamento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orcamento_id INTEGER NOT NULL,
      descricao TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      preco_unitario REAL NOT NULL,
      FOREIGN KEY (orcamento_id) REFERENCES orcamentos (id)
    );

    CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY DEFAULT 1,
      nome_fantasia TEXT,
      cnpj TEXT,
      telefone TEXT,
      email TEXT,
      chave_pix TEXT,
      banco_pix TEXT,
      titular_pix TEXT,
      logo_url TEXT,
      UNIQUE(id)
    );

    CREATE TABLE IF NOT EXISTS pedidos_producao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_criacao TEXT DEFAULT (datetime('now', 'localtime')),
      data_entrega TEXT,
      cliente_id INTEGER,
      cliente_nome_manual TEXT,
      orcamento_id INTEGER,
      venda_id INTEGER,
      status TEXT DEFAULT 'fila' CHECK(status IN ('fila', 'design', 'impressao', 'acabamento', 'pronto', 'entregue')),
      prioridade TEXT DEFAULT 'media' CHECK(prioridade IN ('baixa', 'media', 'alta', 'urgente')),
      observacoes TEXT,
      total REAL DEFAULT 0,
      FOREIGN KEY (cliente_id) REFERENCES clientes (id),
      FOREIGN KEY (orcamento_id) REFERENCES orcamentos (id),
      FOREIGN KEY (venda_id) REFERENCES vendas (id)
    );

    CREATE TABLE IF NOT EXISTS itens_pedido_producao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      descricao TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      detalhes_tecnicos TEXT,
      FOREIGN KEY (pedido_id) REFERENCES pedidos_producao (id) ON DELETE CASCADE
    );
  `);

  // Initial data if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM produtos').get() as { count: number };
  if (count.count === 0) {
    const insert = db.prepare('INSERT INTO produtos (nome, categoria, preco, estoque) VALUES (?, ?, ?, ?)');
    const initialProducts = [
        ['Impressão Preto', 'Impressões', 0.50, 1000],
        ['Imp. Preto (> 100 un.)', 'Impressões', 0.30, 1000],
        ['Impressão Papel Kraft', 'Impressões', 4.00, 1000],
        ['Imp. Color. Papel Chamex', 'Impressões', 2.00, 1000],
        ['Imp. Color. Offset 180g', 'Impressões', 4.00, 1000],
        ['Imp. Color. Offset 240g', 'Impressões', 5.00, 1000],
        ['Imp. Color. Fotográfico 230g', 'Impressões', 5.00, 1000],
        ['Imp. Color. A3 (Planta/Proj.)', 'Impressões', 5.00, 1000],
        ['Imp. Color. A3 Papel Chamex', 'Impressões', 8.00, 1000],
        ['Imp. Color. A3 Fotográfico', 'Impressões', 15.00, 1000],
        ['Copo Long Drink Pers.', 'Personalizados', 6.50, 100],
        ['Canequinha 300ml Pers.', 'Personalizados', 6.50, 100],
        ['Taça Espumante Pers.', 'Personalizados', 7.50, 100],
        ['Taça Gin Leitosa Pers.', 'Personalizados', 12.00, 100],
        ['Taça Gin Degradê Pers.', 'Personalizados', 15.00, 100],
        ['Caneca Porcelana Pers.', 'Personalizados', 40.00, 100],
        ['Caixinha Pronta (Caneca)', 'Personalizados', 5.00, 100],
        ['Azulejo 20x20cm Pers.', 'Personalizados', 35.00, 100],
        ['Almofadinha 20cm Pers.', 'Personalizados', 30.00, 100],
        ['Almofadinha 30cm Pers.', 'Personalizados', 40.00, 100],
        ['Encadernação (A partir)', 'Acabamentos', 5.00, 1000],
        ['Plastificação Doc. Pequeno', 'Acabamentos', 3.00, 1000],
        ['Plastificação A4', 'Acabamentos', 5.00, 1000],
        ['Crachá de PVC', 'Acabamentos', 25.00, 100]
    ];
    
    for (const prod of initialProducts) {
        insert.run(...prod);
    }
  }
}

export default db;
