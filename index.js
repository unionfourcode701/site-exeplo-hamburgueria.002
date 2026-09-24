// --- 1. BASE DE DADOS DO CARDÁPIO COM CATEGORIAS ---
let menuData = []; // Agora começa vazio e será preenchido pela API

// --- 2. ESTADO DA APLICAÇÃO ---
let cart = [];
let salesHistory = JSON.parse(localStorage.getItem("salesHistory")) || [];
let currentCategory = "todos";

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
  carregarCardapioDaAPI(); // Agora puxa do banco de dados!
  setupCategoryFilters();
  updateCart();
  updateDashboard();
});

// Busca os produtos da API
async function carregarCardapioDaAPI() {
  try {
    const resposta = await fetch("http://127.0.0.1:8000/api/produtos");
    if (resposta.ok) {
      menuData = await resposta.json();
      renderMenu(); // Desenha na tela após puxar da API
    }
  } catch (error) {
    console.error("Erro ao carregar cardápio:", error);
  }
}

// Renderizar itens do Cardápio com filtro
function renderMenu(category = "todos") {
  menuGrid.innerHTML = "";
  
  const filtered = category === "todos" 
    ? menuData 
    : menuData.filter(item => item.category === category);

  filtered.forEach(item => {
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

// Evento para o Dono cadastrar um novo prato
document.getElementById("form-novo-produto")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const novoProduto = {
    nome: document.getElementById("prod-nome").value,
    preco: parseFloat(document.getElementById("prod-preco").value),
    categoria: document.getElementById("prod-categoria").value,
    imagem: document.getElementById("prod-imagem").value,
    descricao: document.getElementById("prod-descricao").value
  };

  try {
    const resposta = await fetch("http://127.0.0.1:8000/api/produtos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoProduto)
    });

    if (resposta.ok) {
      alert("Prato adicionado com sucesso!");
      document.getElementById("form-novo-produto").reset();
      carregarCardapioDaAPI(); // Atualiza a tela na hora
    }
  } catch (error) {
    alert("Erro ao salvar o produto.");
  }
});

// Ouvintes para os botões de filtro
function setupCategoryFilters() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.dataset.category;
      renderMenu(currentCategory);
    });
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

  btnCarrinho.animate([
    { transform: 'scale(1)' },
    { transform: 'scale(1.3)' },
    { transform: 'scale(1)' }
  ], { duration: 250 });
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

// --- 6. CHECKOUT E COMPORTAMENTO DINÂMICO ---

// Elementos dos campos condicionais
const orderTypeSelect = document.getElementById("order-type");
const groupDelivery = document.getElementById("group-delivery");
const groupTable = document.getElementById("group-table");
const inputAddress = document.getElementById("client-address");
const inputTable = document.getElementById("client-table");

const paymentMethodSelect = document.getElementById("payment-method");
const groupCash = document.getElementById("group-cash");
const inputCashChange = document.getElementById("cash-change");

// Alternar campos conforme o Tipo de Pedido (Delivery, Mesa ou Balcão)
orderTypeSelect.addEventListener("change", () => {
  const selectedType = orderTypeSelect.value;
  
  if (selectedType.includes("Delivery")) {
    groupDelivery.classList.remove("hidden");
    groupTable.classList.add("hidden");
    inputAddress.required = true;
    inputTable.required = false;
  } else if (selectedType.includes("Mesa")) {
    groupDelivery.classList.add("hidden");
    groupTable.classList.remove("hidden");
    inputAddress.required = false;
    inputTable.required = true;
  } else {
    // Retirada no balcão
    groupDelivery.classList.add("hidden");
    groupTable.classList.add("hidden");
    inputAddress.required = false;
    inputTable.required = false;
  }
});

// Alternar campo de troco conforme a Forma de Pagamento
paymentMethodSelect.addEventListener("change", () => {
  if (paymentMethodSelect.value === "Dinheiro") {
    groupCash.classList.remove("hidden");
  } else {
    groupCash.classList.add("hidden");
    inputCashChange.value = "";
  }
});

// Envio do Pedido
document.getElementById("form-checkout").addEventListener("submit", (e) => {
  e.preventDefault();

  if (cart.length === 0) {
    alert("Adicione pelo menos um item ao carrinho!");
    return;
  }

  const clientName = document.getElementById("client-name").value;
  const orderType = orderTypeSelect.value;
  const address = inputAddress.value.trim();
  const tableNum = inputTable.value.trim();
  const paymentMethod = paymentMethodSelect.value;
  const cashChange = inputCashChange.value.trim();
  const orderNotes = document.getElementById("order-notes").value.trim();
  
  const totalValue = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Criar Objeto do Pedido para o painel de gestão
  const newOrder = {
    id: Date.now(),
    time: timeString,
    client: clientName,
    type: orderType,
    payment: paymentMethod,
    items: [...cart],
    total: totalValue
  };

  // Salvar no histórico
  salesHistory.push(newOrder);
  localStorage.setItem("salesHistory", JSON.stringify(salesHistory));

  // Montar mensagem formatada e limpa para o WhatsApp
  let message = `🍔 *NOVO PEDIDO - LANCHONETE EXPRESS*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `👤 *Cliente:* ${clientName}\n`;
  message += `📍 *Tipo:* ${orderType}\n`;

  if (orderType.includes("Delivery") && address) {
    message += `🏠 *Endereço:* ${address}\n`;
  } else if (orderType.includes("Mesa") && tableNum) {
    message += `🪑 *Mesa:* Nº ${tableNum}\n`;
  }

  message += `💳 *Pagamento:* ${paymentMethod}\n`;
  if (paymentMethod === "Dinheiro" && cashChange) {
    message += `💵 *Troco para:* ${cashChange}\n`;
  }

  if (orderNotes) {
    message += `📝 *Observação:* ${orderNotes}\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🛒 *ITENS DO PEDIDO:*\n`;
  cart.forEach(item => {
    message += `▪ ${item.qty}x ${item.name} — R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}\n`;
  });

  message += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💰 *TOTAL: R$ ${totalValue.toFixed(2).replace('.', ',')}*\n`;

  // Limpar carrinho e fechar modal
  cart = [];
  updateCart();
  document.getElementById("form-checkout").reset();
  
  // Reseta campos visíveis para o padrão (Delivery visível, Troco escondido)
  groupDelivery.classList.remove("hidden");
  groupTable.classList.add("hidden");
  groupCash.classList.add("hidden");

  modalCarrinho.classList.remove("active");
  updateDashboard();

  // Coloque o número com DDD para o teste ao vivo
  const phone = "5581992275530"; 
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

// --- 9. LÓGICA DE AUTENTICAÇÃO E ÁREA DO DONO ---
const modalLogin = document.getElementById("modal-login");
const btnLoginNav = document.getElementById("btn-login-nav");
const closeLogin = document.getElementById("close-login");
const toggleRegister = document.getElementById("toggle-register");
const registerFields = document.getElementById("register-fields");
const btnAuthSubmit = document.getElementById("btn-auth-submit");
const formAuth = document.getElementById("form-auth");

let isRegistering = false;

// Controle do Modal de Login
btnLoginNav.addEventListener("click", () => modalLogin.classList.add("active"));
closeLogin.addEventListener("click", () => modalLogin.classList.remove("active"));

// Alternar entre Login e Cadastro
toggleRegister.addEventListener("click", () => {
  isRegistering = !isRegistering;
  if (isRegistering) {
    registerFields.classList.remove("hidden");
    btnAuthSubmit.textContent = "Criar Conta";
    toggleRegister.textContent = "Fazer Login";
  } else {
    registerFields.classList.add("hidden");
    btnAuthSubmit.textContent = "Entrar";
    toggleRegister.textContent = "Cadastre-se";
  }
});

// Comunicação com a API (Login e Cadastro)
formAuth.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = document.getElementById("auth-email").value;
  const senha = document.getElementById("auth-senha").value;
  const btnSubmit = document.getElementById("btn-auth-submit");
  
  // Muda o texto do botão para mostrar que está a carregar
  const textoOriginal = btnSubmit.textContent;
  btnSubmit.textContent = "Aguarde...";
  btnSubmit.disabled = true;

  try {
    if (isRegistering) {
      // --- LÓGICA DE CADASTRO ---
      const nome = document.getElementById("auth-nome").value;
      const telefone = document.getElementById("auth-telefone").value;
      const endereco = document.getElementById("auth-endereco").value;

      const resposta = await fetch("http://127.0.0.1:8000/api/registar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone, endereco, email, senha })
      });

      if (resposta.ok) {
        alert("Conta criada com sucesso! Faça login para continuar.");
        toggleRegister.click(); // Volta para a tela de login
      } else {
        const erro = await resposta.json();
        alert("Erro: " + erro.detail);
      }

    } else {
      // --- LÓGICA DE LOGIN ---
      const resposta = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
      });

      if (resposta.ok) {
        const dadosUsuario = await resposta.json();
        
        // Verifica se é o dono
        if (dadosUsuario.tipo_conta === "dono") {
          document.getElementById("btn-admin").classList.remove("hidden");
          btnLoginNav.innerHTML = `<i class="ph ph-user"></i> Dono`;
          alert(`Bem-vindo, ${dadosUsuario.nome}! O painel de gestão foi liberado.`);
        } else {
          // É cliente
          document.getElementById("btn-admin").classList.add("hidden");
          btnLoginNav.innerHTML = `<i class="ph ph-user"></i> Minha Conta`;
          
          // Preenche os dados do cliente no carrinho automaticamente
          document.getElementById("client-name").value = dadosUsuario.nome;
          if(dadosUsuario.endereco) {
            document.getElementById("client-address").value = dadosUsuario.endereco;
          }
          alert(`Bem-vindo, ${dadosUsuario.nome}!`);
        }
        
        modalLogin.classList.remove("active");
        formAuth.reset();
      } else {
        alert("E-mail ou senha incorretos.");
      }
    }
  } catch (error) {
    alert("Erro ao conectar com o servidor. Verifique se a API está a rodar.");
    console.error(error);
  } finally {
    // Restaura o botão
    btnSubmit.textContent = textoOriginal;
    btnSubmit.disabled = false;
  }
});

// Fecha modal de login ao clicar fora
window.addEventListener("click", (e) => {
  if (e.target === modalLogin) modalLogin.classList.remove("active");
});