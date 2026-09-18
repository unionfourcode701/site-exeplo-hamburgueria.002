// --- 1. BASE DE DADOS DO CARDÁPIO ---
const menuData = [
  { id: 1, name: "X-Burguer Artesanal", price: 25.00, desc: "Pão brioche, carne 180g, queijo cheddar e molho especial.", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
  { id: 2, name: "X-Salada Especial", price: 22.00, desc: "Hamburguer 150g, queijo, alface, tomate e maionese da casa.", img: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400" },
  { id: 3, name: "Batata Frita Grande", price: 16.00, desc: "Porção de batata frita crocante com bacon e cheddar.", img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400" },
  { id: 4, name: "Refrigerante Lata 350ml", price: 6.00, desc: "Coca-Cola, Guaraná ou Soda.", img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" },
  { id: 5, name: "Suco Natural 500ml", price: 8.50, desc: "Sabores: Laranja, Limão ou Maracujá.", img: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400" }
];

// --- 2. ESTADO DA APLICAÇÃO ---
let cart = [];
// Recupera histórico de vendas salvas hoje ou inicia um array vazio
let salesHistory = JSON.parse(localStorage.getItem("salesHistory")) || [];

// --- 3. REFERÊNCIAS DO DOM ---
const menuGrid = document.getElementById("menu-grid");
const cartCount = document.getElementById("cart-count");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");

// Modais
const modalCarrinho = document.getElementById("modal-carrinho");
const modalAdmin = document.getElementById("modal-admin");
const btnCarrinho = document.getElementById("btn-carrinho");
const btnAdmin = document.getElementById("btn-admin");
const closeCarrinho = document.getElementById("close-carrinho");
const closeAdmin = document.getElementById("close-admin");

// Elementos Admin
const kpiRevenue = document.getElementById("kpi-revenue");
const kpiOrders = document.getElementById("kpi-orders");
const kpiAvg = document.getElementById("kpi-avg");
const salesHistoryBody = document.getElementById("sales-history-body");
const btnCloseShift = document.getElementById("btn-close-shift");
const reportOutput = document.getElementById("report-output");
const reportText = document.getElementById("report-text");

// --- 4. INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
  renderMenu();
  updateCart();
  updateDashboard();
});

// Renderizar itens do Cardápio
function renderMenu() {
  menuGrid.innerHTML = "";
  menuData.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${item.img}" alt="${item.name}">
      <div class="card-body">
        <h3 class="card-title">${item.name}</h3>
        <p class="card-desc">${item.desc}</p>
        <div class="card-footer">
          <span class="card-price">R$ ${item.price.toFixed(2).replace('.', ',')}</span>
          <button class="btn-primary" onclick="addToCart(${item.id})">
            <i class="ph ph-plus"></i> Adicionar
          </button>
        </div>
      </div>
    `;
    menuGrid.appendChild(card);
  });
}

// --- 5. LÓGICA DO CARRINHO ---
function addToCart(id) {
  const product = menuData.find(p => p.id === id);
  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  updateCart();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.id !== id);
    }
  }
  updateCart();
}

function updateCart() {
  // Atualiza contagem no ícone
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
  cartCount.textContent = totalQty;

  // Atualiza lista interna do carrinho
  cartItems.innerHTML = "";
  let totalCalculated = 0;

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Seu carrinho está vazio.</p>";
  } else {
    cart.forEach(item => {
      const itemTotal = item.price * item.qty;
      totalCalculated += itemTotal;

      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <div>
          <strong>${item.name}</strong><br>
          <small>R$ ${item.price.toFixed(2)} x ${item.qty}</small>
        </div>
        <div class="cart-item-controls">
          <button onclick="changeQty(${item.id}, -1)">-</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${item.id}, 1)">+</button>
        </div>
      `;
      cartItems.appendChild(div);
    });
  }

  cartTotal.textContent = `R$ ${totalCalculated.toFixed(2).replace('.', ',')}`;
}

// --- 6. CHECKOUT E ENVIO DE PEDIDO ---
document.getElementById("form-checkout").addEventListener("submit", (e) => {
  e.preventDefault();

  if (cart.length === 0) {
    alert("Adicione pelo menos um item ao carrinho!");
    return;
  }

  const clientName = document.getElementById("client-name").value;
  const paymentMethod = document.getElementById("payment-method").value;
  const orderType = document.getElementById("order-type").value;
  
  const totalValue = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Criar Objeto do Pedido
  const newOrder = {
    id: Date.now(),
    time: timeString,
    client: clientName,
    type: orderType,
    payment: paymentMethod,
    items: [...cart],
    total: totalValue
  };

  // Salva no histórico de vendas (Automação do Financeiro)
  salesHistory.push(newOrder);
  localStorage.setItem("salesHistory", JSON.stringify(salesHistory));

  // Gerar mensagem para WhatsApp
  let message = `*--- NOVO PEDIDO ---*\n`;
  message += `*Cliente:* ${clientName}\n`;
  message += `*Tipo:* ${orderType}\n`;
  message += `*Pagamento:* ${paymentMethod}\n\n`;
  message += `*Itens:*\n`;
  
  cart.forEach(item => {
    message += `- ${item.qty}x ${item.name} (R$ ${(item.price * item.qty).toFixed(2)})\n`;
  });
  
  message += `\n*Total: R$ ${totalValue.toFixed(2)}*`;

  // Limpar carrinho e fechar modal
  cart = [];
  updateCart();
  document.getElementById("form-checkout").reset();
  modalCarrinho.classList.remove("active");

  // Atualizar os relatórios em tempo real
  updateDashboard();

  // Redirecionar para WhatsApp (Substituir '5581999999999' pelo seu número real)
  const phone = "5581999999999"; 
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
});

// --- 7. AUTOMATIZAÇÃO DE FECHAMENTO DE EXPEDIENTE ---
function updateDashboard() {
  const totalRevenue = salesHistory.reduce((acc, order) => acc + order.total, 0);
  const totalOrders = salesHistory.length;
  const avgTicket = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

  kpiRevenue.textContent = `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`;
  kpiOrders.textContent = totalOrders;
  kpiAvg.textContent = `R$ ${avgTicket.toFixed(2).replace('.', ',')}`;

  // Preencher tabela
  salesHistoryBody.innerHTML = "";
  salesHistory.forEach(order => {
    const itemsSummary = order.items.map(i => `${i.qty}x ${i.name}`).join(", ");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${order.time}</td>
      <td>${order.client}</td>
      <td>${order.type}</td>
      <td>${order.payment}</td>
      <td>${itemsSummary}</td>
      <td>R$ ${order.total.toFixed(2)}</td>
    `;
    salesHistoryBody.appendChild(tr);
  });
}

// Fechamento de caixa
btnCloseShift.addEventListener("click", () => {
  if (salesHistory.length === 0) {
    alert("Nenhuma venda registrada no expediente atual para fechar.");
    return;
  }

  const confirmClose = confirm("Tem certeza que deseja encerrar o expediente de hoje? Isso gerará o relatório final e limpará o caixa para o próximo dia.");

  if (confirmClose) {
    const totalRevenue = salesHistory.reduce((acc, order) => acc + order.total, 0);
    const totalOrders = salesHistory.length;

    // Contagem por Forma de Pagamento
    const paymentTotals = {};
    salesHistory.forEach(o => {
      paymentTotals[o.payment] = (paymentTotals[o.payment] || 0) + o.total;
    });

    let paymentBreakdown = "";
    for (const [method, val] of Object.entries(paymentTotals)) {
      paymentBreakdown += `- ${method}: R$ ${val.toFixed(2)}\n`;
    }

    // Gerar Texto de Relatório
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const report = 
`===================================
 RELATÓRIO DE FECHAMENTO DO DIA
 Data: ${dateStr}
===================================
Total de Pedidos: ${totalOrders}
Faturamento Total: R$ ${totalRevenue.toFixed(2)}
Ticket Médio: R$ ${(totalRevenue / totalOrders).toFixed(2)}

--- TOTAL POR FORMA DE PAGAMENTO ---
${paymentBreakdown}
===================================`;

    reportText.textContent = report;
    reportOutput.classList.remove("hidden");

    // Resetar histórico local
    localStorage.removeItem("salesHistory");
    salesHistory = [];
    updateDashboard();

    alert("Expediente encerrado com sucesso! Veja o relatório exibido abaixo.");
  }
});

// --- 8. GERENCIAMENTO DE MODAIS ---
btnCarrinho.addEventListener("click", () => modalCarrinho.classList.add("active"));
closeCarrinho.addEventListener("click", () => modalCarrinho.classList.remove("active"));

btnAdmin.addEventListener("click", () => modalAdmin.classList.add("active"));
closeAdmin.addEventListener("click", () => modalAdmin.classList.remove("active"));

// Fechar modais ao clicar fora
window.addEventListener("click", (e) => {
  if (e.target === modalCarrinho) modalCarrinho.classList.remove("active");
  if (e.target === modalAdmin) modalAdmin.classList.remove("active");
});