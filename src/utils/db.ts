/**
 * Camada de dados usando localStorage para versão Web.
 * Substitui o Electron IPC + better-sqlite3 do app desktop.
 */

// ===================== Helpers =====================

function getCollection<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function setCollection<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

function getNextId(key: string): number {
  const counterKey = `${key}_counter`
  const current = parseInt(localStorage.getItem(counterKey) || '0', 10)
  const next = current + 1
  localStorage.setItem(counterKey, next.toString())
  return next
}

function getSingleton<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

function setSingleton<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data))
}

function now(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19)
}

// ===================== Inicialização =====================

export function initDb(): void {
  if (localStorage.getItem('db_initialized')) return

  const initialProducts = [
    { nome: 'Impressão Preto', categoria: 'Impressões', preco: 0.50, estoque: 1000 },
    { nome: 'Imp. Preto (> 100 un.)', categoria: 'Impressões', preco: 0.30, estoque: 1000 },
    { nome: 'Impressão Papel Kraft', categoria: 'Impressões', preco: 4.00, estoque: 1000 },
    { nome: 'Imp. Color. Papel Chamex', categoria: 'Impressões', preco: 2.00, estoque: 1000 },
    { nome: 'Imp. Color. Offset 180g', categoria: 'Impressões', preco: 4.00, estoque: 1000 },
    { nome: 'Imp. Color. Offset 240g', categoria: 'Impressões', preco: 5.00, estoque: 1000 },
    { nome: 'Imp. Color. Fotográfico 230g', categoria: 'Impressões', preco: 5.00, estoque: 1000 },
    { nome: 'Imp. Color. A3 (Planta/Proj.)', categoria: 'Impressões', preco: 5.00, estoque: 1000 },
    { nome: 'Imp. Color. A3 Papel Chamex', categoria: 'Impressões', preco: 8.00, estoque: 1000 },
    { nome: 'Imp. Color. A3 Fotográfico', categoria: 'Impressões', preco: 15.00, estoque: 1000 },
    { nome: 'Copo Long Drink Pers.', categoria: 'Personalizados', preco: 6.50, estoque: 100 },
    { nome: 'Canequinha 300ml Pers.', categoria: 'Personalizados', preco: 6.50, estoque: 100 },
    { nome: 'Taça Espumante Pers.', categoria: 'Personalizados', preco: 7.50, estoque: 100 },
    { nome: 'Taça Gin Leitosa Pers.', categoria: 'Personalizados', preco: 12.00, estoque: 100 },
    { nome: 'Taça Gin Degradê Pers.', categoria: 'Personalizados', preco: 15.00, estoque: 100 },
    { nome: 'Caneca Porcelana Pers.', categoria: 'Personalizados', preco: 40.00, estoque: 100 },
    { nome: 'Caixinha Pronta (Caneca)', categoria: 'Personalizados', preco: 5.00, estoque: 100 },
    { nome: 'Azulejo 20x20cm Pers.', categoria: 'Personalizados', preco: 35.00, estoque: 100 },
    { nome: 'Almofadinha 20cm Pers.', categoria: 'Personalizados', preco: 30.00, estoque: 100 },
    { nome: 'Almofadinha 30cm Pers.', categoria: 'Personalizados', preco: 40.00, estoque: 100 },
    { nome: 'Encadernação (A partir)', categoria: 'Acabamentos', preco: 5.00, estoque: 1000 },
    { nome: 'Plastificação Doc. Pequeno', categoria: 'Acabamentos', preco: 3.00, estoque: 1000 },
    { nome: 'Plastificação A4', categoria: 'Acabamentos', preco: 5.00, estoque: 1000 },
    { nome: 'Crachá de PVC', categoria: 'Acabamentos', preco: 25.00, estoque: 100 },
  ]

  const produtos = initialProducts.map((p, i) => ({
    id: i + 1,
    ...p,
  }))

  setCollection('produtos', produtos)
  localStorage.setItem('produtos_counter', produtos.length.toString())
  localStorage.setItem('db_initialized', 'true')
}

// ===================== Produtos =====================

export function getProdutos() {
  return getCollection<any>('produtos')
}

export function addProduto(produto: { nome: string; categoria: string; preco: number; estoque: number }): number {
  const produtos = getCollection<any>('produtos')
  const id = getNextId('produtos')
  produtos.push({ id, ...produto })
  setCollection('produtos', produtos)
  return id
}

export function updateProduto(produto: { id: number; nome: string; categoria: string; preco: number; estoque: number }) {
  const produtos = getCollection<any>('produtos')
  const idx = produtos.findIndex((p: any) => p.id === produto.id)
  if (idx !== -1) {
    produtos[idx] = { ...produtos[idx], ...produto }
    setCollection('produtos', produtos)
  }
}

export function deleteProduto(id: number) {
  const produtos = getCollection<any>('produtos').filter((p: any) => p.id !== id)
  setCollection('produtos', produtos)
}

// ===================== Clientes =====================

export function getClientes() {
  return getCollection<any>('clientes')
}

export function addCliente(cliente: any): number {
  const clientes = getCollection<any>('clientes')
  const id = getNextId('clientes')
  clientes.push({ id, ...cliente })
  setCollection('clientes', clientes)
  return id
}

export function updateCliente(cliente: any) {
  const clientes = getCollection<any>('clientes')
  const idx = clientes.findIndex((c: any) => c.id === cliente.id)
  if (idx !== -1) {
    clientes[idx] = { ...clientes[idx], ...cliente }
    setCollection('clientes', clientes)
  }
}

export function deleteCliente(id: number) {
  const clientes = getCollection<any>('clientes').filter((c: any) => c.id !== id)
  setCollection('clientes', clientes)
}

export function getClienteHistorico(clienteId: number) {
  const vendas = getCollection<any>('vendas').filter((v: any) => v.cliente_id === clienteId)
  const itensVenda = getCollection<any>('itens_venda')
  const produtos = getCollection<any>('produtos')

  return vendas.map((v: any) => {
    const itens = itensVenda
      .filter((iv: any) => iv.venda_id === v.id)
      .map((iv: any) => {
        const prod = produtos.find((p: any) => p.id === iv.produto_id)
        return `${prod?.nome || 'Item'} (x${iv.quantidade})`
      })
      .join(', ')

    return { ...v, itens }
  }).sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
}

// ===================== Vendas =====================

export function finalizarVenda(vendaData: any): number {
  const { cliente_id, subtotal, desconto, total, forma_pagamento, itens } = vendaData

  // 1. Inserir venda
  const vendas = getCollection<any>('vendas')
  const vendaId = getNextId('vendas')
  vendas.push({
    id: vendaId,
    data: now(),
    cliente_id,
    subtotal,
    desconto,
    total,
    forma_pagamento,
  })
  setCollection('vendas', vendas)

  // 2. Inserir itens e baixar estoque
  const itensVenda = getCollection<any>('itens_venda')
  const produtos = getCollection<any>('produtos')

  for (const item of itens) {
    const itemId = getNextId('itens_venda')
    itensVenda.push({
      id: itemId,
      venda_id: vendaId,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
    })

    const prodIdx = produtos.findIndex((p: any) => p.id === item.produto_id)
    if (prodIdx !== -1) {
      produtos[prodIdx].estoque = Math.max(0, produtos[prodIdx].estoque - item.quantidade)
    }
  }

  setCollection('itens_venda', itensVenda)
  setCollection('produtos', produtos)

  // 3. Registrar no financeiro
  const financeiro = getCollection<any>('financeiro')
  const finId = getNextId('financeiro')
  financeiro.push({
    id: finId,
    data: now(),
    descricao: `Venda #${vendaId}`,
    tipo: 'receita',
    valor: total,
    status: 'pago',
  })
  setCollection('financeiro', financeiro)

  return vendaId
}

// ===================== Financeiro =====================

export function getFinanceiro() {
  return getCollection<any>('financeiro').sort(
    (a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime()
  )
}

export function addTransacao(transacao: { descricao: string; tipo: string; valor: number }) {
  const financeiro = getCollection<any>('financeiro')
  const id = getNextId('financeiro')
  financeiro.push({ id, data: now(), ...transacao, status: 'pago' })
  setCollection('financeiro', financeiro)
  return id
}

// ===================== Orçamentos =====================

export function getOrcamentos() {
  const orcamentos = getCollection<any>('orcamentos')
  const clientes = getCollection<any>('clientes')

  return orcamentos
    .map((o: any) => {
      const cliente = clientes.find((c: any) => c.id === o.cliente_id)
      return { ...o, cliente_nome: cliente?.nome || null }
    })
    .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
}

export function addOrcamento(data: any): number {
  const { cliente_id, cliente_nome_manual, total, validade, observacoes, itens } = data
  const orcamentos = getCollection<any>('orcamentos')
  const orcId = getNextId('orcamentos')

  orcamentos.push({
    id: orcId,
    data: now(),
    cliente_id: cliente_id || null,
    cliente_nome_manual: cliente_nome_manual || null,
    total,
    status: 'pendente',
    validade,
    observacoes,
  })
  setCollection('orcamentos', orcamentos)

  // Inserir itens
  const itensOrc = getCollection<any>('itens_orcamento')
  for (const item of itens) {
    const itemId = getNextId('itens_orcamento')
    itensOrc.push({
      id: itemId,
      orcamento_id: orcId,
      descricao: item.descricao,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
    })
  }
  setCollection('itens_orcamento', itensOrc)

  return orcId
}

export function updateStatusOrcamento({ id, status }: { id: number; status: string }) {
  const orcamentos = getCollection<any>('orcamentos')
  const idx = orcamentos.findIndex((o: any) => o.id === id)
  if (idx !== -1) {
    orcamentos[idx].status = status
    setCollection('orcamentos', orcamentos)
  }
}

export function getOrcamentoDetalhes(id: number) {
  const orcamentos = getCollection<any>('orcamentos')
  const clientes = getCollection<any>('clientes')
  const itensOrc = getCollection<any>('itens_orcamento')

  const orcamento = orcamentos.find((o: any) => o.id === id)
  if (!orcamento) return { orcamento: null, itens: [] }

  const cliente = clientes.find((c: any) => c.id === orcamento.cliente_id)
  const itens = itensOrc.filter((i: any) => i.orcamento_id === id)

  return {
    orcamento: {
      ...orcamento,
      cliente_nome: cliente?.nome || null,
      cliente_telefone: cliente?.telefone || null,
      cliente_email: cliente?.email || null,
    },
    itens,
  }
}

// ===================== Configurações =====================

export function getConfiguracoes() {
  return getSingleton<any>('configuracoes')
}

export function saveConfiguracoes(config: any) {
  setSingleton('configuracoes', config)
}

// ===================== Pedidos de Produção =====================

export function getPedidosProducao() {
  const pedidos = getCollection<any>('pedidos_producao')
  const clientes = getCollection<any>('clientes')
  const itensPedido = getCollection<any>('itens_pedido_producao')

  const prioridadeOrder: Record<string, number> = { urgente: 1, alta: 2, media: 3, baixa: 4 }

  return pedidos
    .map((p: any) => {
      const cliente = clientes.find((c: any) => c.id === p.cliente_id)
      return {
        ...p,
        cliente_nome: cliente?.nome || null,
        cliente_telefone: cliente?.telefone || null,
        cliente_email: cliente?.email || null,
        itens: itensPedido.filter((i: any) => i.pedido_id === p.id),
      }
    })
    .sort((a: any, b: any) => {
      const pa = prioridadeOrder[a.prioridade] || 5
      const pb = prioridadeOrder[b.prioridade] || 5
      if (pa !== pb) return pa - pb
      return new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()
    })
}

export function addPedidoProducao(data: any): number {
  const { cliente_id, cliente_nome_manual, data_entrega, status, prioridade, observacoes, total, orcamento_id, venda_id, itens } = data
  const pedidos = getCollection<any>('pedidos_producao')
  const pedidoId = getNextId('pedidos_producao')

  pedidos.push({
    id: pedidoId,
    data_criacao: now(),
    data_entrega: data_entrega || null,
    cliente_id: cliente_id || null,
    cliente_nome_manual: cliente_nome_manual || null,
    orcamento_id: orcamento_id || null,
    venda_id: venda_id || null,
    status: status || 'fila',
    prioridade: prioridade || 'media',
    observacoes: observacoes || null,
    total: total || 0,
  })
  setCollection('pedidos_producao', pedidos)

  // Inserir itens
  const itensPedido = getCollection<any>('itens_pedido_producao')
  for (const item of itens) {
    const itemId = getNextId('itens_pedido_producao')
    itensPedido.push({
      id: itemId,
      pedido_id: pedidoId,
      descricao: item.descricao,
      quantidade: item.quantidade,
      detalhes_tecnicos: item.detalhes_tecnicos || null,
    })
  }
  setCollection('itens_pedido_producao', itensPedido)

  return pedidoId
}

export function updateStatusPedidoProducao({ id, status }: { id: number; status: string }) {
  const pedidos = getCollection<any>('pedidos_producao')
  const idx = pedidos.findIndex((p: any) => p.id === id)
  if (idx !== -1) {
    pedidos[idx].status = status
    setCollection('pedidos_producao', pedidos)
  }
}

export function updatePrioridadePedidoProducao({ id, prioridade }: { id: number; prioridade: string }) {
  const pedidos = getCollection<any>('pedidos_producao')
  const idx = pedidos.findIndex((p: any) => p.id === id)
  if (idx !== -1) {
    pedidos[idx].prioridade = prioridade
    setCollection('pedidos_producao', pedidos)
  }
}

export function updateDetalhesItemPedido({ id, detalhes_tecnicos }: { id: number; detalhes_tecnicos: string }) {
  const itens = getCollection<any>('itens_pedido_producao')
  const idx = itens.findIndex((i: any) => i.id === id)
  if (idx !== -1) {
    itens[idx].detalhes_tecnicos = detalhes_tecnicos
    setCollection('itens_pedido_producao', itens)
  }
}

export function deletePedidoProducao(id: number) {
  const pedidos = getCollection<any>('pedidos_producao').filter((p: any) => p.id !== id)
  const itens = getCollection<any>('itens_pedido_producao').filter((i: any) => i.pedido_id !== id)
  setCollection('pedidos_producao', pedidos)
  setCollection('itens_pedido_producao', itens)
}

// ===================== Utilitários Web =====================

export function saveCsvWeb(content: string, defaultName: string): boolean {
  try {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = defaultName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

export function generatePdfWeb(htmlContent: string): void {
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}
