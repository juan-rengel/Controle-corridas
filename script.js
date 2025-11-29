/*************************************************
 *  MENU (HAMBÚRGUER) – funciona em todas as páginas
 *************************************************/
const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");
const pageSections = document.querySelectorAll(".page");

function showPage(pageId) {
  pageSections.forEach(sec => {
    sec.classList.toggle("active", sec.id === "page-" + pageId);
  });
}

if (hamburger && sidebar) {
  hamburger.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  sidebar.querySelectorAll("a[data-page]").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("data-page");
      showPage(target);
      sidebar.classList.remove("open");
    });
  });
}

/*************************************************
 *  VARIÁVEIS GERAIS (existem ou não, depende da página)
 *************************************************/
// SELECT do mês pode existir ou não (Dashboard, Registros, Configurações)
const selectMes =
  document.getElementById("selectMesRegistro") ||
  document.getElementById("selectMes") ||
  document.getElementById("selectMesConfig") ||
  null;

const selectMesConfig = document.getElementById("selectMesConfig");

const metaInput = document.getElementById('metaMes');
const valorDiaInput = document.getElementById('valorDia');
const btnAdicionar = document.getElementById('btnAdicionar');
const gastoGasolinaInput = document.getElementById('gastoGasolina');
const btnAdicionarGasto = document.getElementById('btnAdicionarGasto');
const btnLimpar = document.getElementById('btnLimpar');
const btnExportar = document.getElementById('btnExportar');

const totalGanhosSpan = document.getElementById('totalGanhos');
const totalGastosSpan = document.getElementById('totalGastos');
const lucroLiquidoSpan = document.getElementById('lucroLiquido');
const metaExibidaSpan = document.getElementById('metaExibida');
const diasTrabalhadosSpan = document.getElementById('diasTrabalhados');
const progressoPercentSpan = document.getElementById('progressoPercent');
const progressFillDiv = document.getElementById('progressFill');
const totalTransferidoSpan = document.getElementById('totalTransferido');

const listaGanhosUl = document.getElementById('listaGanhos');
const listaGastosUl = document.getElementById('listaGastos');
const listaTransferenciasUl = document.getElementById('listaTransferencias');
const listaMecanicasUl = document.getElementById('listaMecanicas');

const transferenciaInput = document.getElementById("transferenciaValor");
const mecanicaInput = document.getElementById("despesaMecanica");
const btnAdicionarTransferencia = document.getElementById("btnAdicionarTransferencia");
const btnAdicionarMecanica = document.getElementById("btnAdicionarMecanica");

/*************************************************
 *  ESTRUTURA DE DADOS DO MÊS
 *************************************************/
let dadosMes = { 
  meta: 0, 
  ganhos: [], 
  gastos: [], 
  transferencias: [], 
  mecanicas: [] 
};

let notificouMeta = false;

/*************************************************
 *  FUNÇÕES UTILITÁRIAS GERAIS
 *************************************************/
function getMesAtual() {
  const d = new Date();
  return d.toISOString().slice(0,7);
}

// Dias trabalhados (usado em Registros E Calendário)
function loadWorkedDays(mes) {
  return JSON.parse(localStorage.getItem("worked_" + mes)) || {};
}

function saveWorkedDays(mes, dados) {
  localStorage.setItem("worked_" + mes, JSON.stringify(dados));
}

// Lista meses com dados (mob_YYYY-MM)
function listarMeses() {
  const meses = [];
  for(let i=0; i<localStorage.length; i++) {
    const key = localStorage.key(i);
    if(key.startsWith("mob_")) {
      meses.push(key.slice(4));
    }
  }
  const atual = getMesAtual();
  if (!meses.includes(atual)) meses.push(atual);
  return meses.sort().reverse();
}

// "YYYY-MM" -> "MM/YYYY"
function formatarMesAno(mesAno) {
  const [ano, mes] = mesAno.split("-");
  return `${mes}/${ano}`;
}

// ISO -> "DD/MM (DiaSemana)"
function formatarData(dataISO) {
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
  const d = new Date(dataISO);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const diaSemana = diasSemana[d.getDay()];
  return `${dia}/${mes} (${diaSemana})`;
}

// ISO -> "DD/MM/YYYY"
function formatarDataCSV(dataISO) {
  const d = new Date(dataISO);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/*************************************************
 *  POPULAR SELECTS DE MÊS (Registros / Config)
 *************************************************/
function popularSelectsMes() {
  const meses = listarMeses();
  const mesAtual = getMesAtual();

  // SELECT DA PÁGINA DE REGISTRO
  if (selectMes) {
    selectMes.innerHTML = "";
    meses.forEach(m => {
      const option = document.createElement("option");
      option.value = m;
      option.textContent = formatarMesAno(m);
      selectMes.appendChild(option);
    });
    selectMes.value = mesAtual;
  }

  // SELECT DA PÁGINA DE CONFIGURAÇÕES
  if (selectMesConfig) {
    selectMesConfig.innerHTML = "";
    meses.forEach(m => {
      const option = document.createElement("option");
      option.value = m;
      option.textContent = formatarMesAno(m);
      selectMesConfig.appendChild(option);
    });
    selectMesConfig.value = mesAtual;
  }
}

/*************************************************
 *  CARREGAR / SALVAR DADOS DO MÊS
 *************************************************/
function carregarDadosMes(mes) {
  const data = localStorage.getItem("mob_" + mes);
  if (data) {
    const parsed = JSON.parse(data);
    dadosMes = {
      meta: parsed.meta || 0,
      ganhos: parsed.ganhos || [],
      gastos: parsed.gastos || [],
      transferencias: parsed.transferencias || [],
      mecanicas: parsed.mecanicas || []
    };
  } else {
    dadosMes = { meta: 0, ganhos: [], gastos: [], transferencias: [], mecanicas: [] };
  }
  notificouMeta = false;
  atualizarResumo();
}

function salvarDadosMes() {
  const mesBase = selectMes ? selectMes.value : getMesAtual();
  localStorage.setItem("mob_" + mesBase, JSON.stringify(dadosMes));
}

/*************************************************
 *  RESUMO + PROGRESSO
 *************************************************/
function atualizarResumo() {
  const totalGanhos = dadosMes.ganhos.reduce((a,b) => a + b.valor, 0);
  const totalGastos = dadosMes.gastos.reduce((a,b) => a + b.valor, 0);
  const totalTransferencias = dadosMes.transferencias.reduce((a,b) => a + b.valor, 0);
  const totalMecanicas = dadosMes.mecanicas.reduce((a,b) => a + b.valor, 0);

  // Lucro que conta para a meta (SEM transferências)
  const lucroMeta = totalGanhos - totalGastos - totalMecanicas;

  if (totalGanhosSpan) totalGanhosSpan.textContent = totalGanhos.toFixed(2);
  if (totalGastosSpan) totalGastosSpan.textContent = totalGastos.toFixed(2);
  if (lucroLiquidoSpan) lucroLiquidoSpan.textContent = lucroMeta.toFixed(2);
  if (metaExibidaSpan) metaExibidaSpan.textContent = dadosMes.meta.toFixed(2);
  if (totalTransferidoSpan) totalTransferidoSpan.textContent = totalTransferencias.toFixed(2);

  const progresso = dadosMes.meta > 0 ? Math.min((lucroMeta / dadosMes.meta) * 100, 100) : 0;

  if (progressoPercentSpan) progressoPercentSpan.textContent = progresso.toFixed(1) + "%";
  if (progressFillDiv) progressFillDiv.style.width = progresso + "%";

  atualizarListas();
}

/*************************************************
 *  LISTAS (Ganhos, Gastos, Transfer, Mecânica)
 *************************************************/
function atualizarListas() {
  // Se estiver em página sem listas (ex: só calendário), não faça nada
  if (!listaGanhosUl && !listaGastosUl && !listaTransferenciasUl && !listaMecanicasUl) {
    return;
  }

  if (listaGanhosUl) listaGanhosUl.innerHTML = "";
  if (listaGastosUl) listaGastosUl.innerHTML = "";
  if (listaTransferenciasUl) listaTransferenciasUl.innerHTML = "";
  if (listaMecanicasUl) listaMecanicasUl.innerHTML = "";

  // GANHOS
  if (listaGanhosUl) {
    dadosMes.ganhos.forEach(({ valor, data }) => {
      const li = document.createElement("li");
      li.classList.add("ganho");
      li.innerHTML = `
        <span class="desc">Dia ${formatarData(data)}:</span>
        <span class="valor">R$ ${valor.toFixed(2)}</span>`;
      listaGanhosUl.appendChild(li);
    });
  }

  // GASTOS
  if (listaGastosUl) {
    dadosMes.gastos.forEach(({ valor, data }) => {
      const li = document.createElement("li");
      li.classList.add("gasolina");
      li.innerHTML = `
        <span class="desc">Gasolina ${formatarData(data)}:</span>
        <span class="valor">R$ ${valor.toFixed(2)}</span>`;
      listaGastosUl.appendChild(li);
    });
  }

  // TRANSFERÊNCIAS
  if (listaTransferenciasUl) {
    dadosMes.transferencias.forEach(({ valor, data }) => {
      const li = document.createElement("li");
      li.classList.add("transferencia");
      li.innerHTML = `
        <span class="desc">Transferência ${formatarData(data)}:</span>
        <span class="valor">R$ ${valor.toFixed(2)}</span>`;
      listaTransferenciasUl.appendChild(li);
    });
  }

  // MECÂNICA
  if (listaMecanicasUl) {
    dadosMes.mecanicas.forEach(({ valor, data }) => {
      const li = document.createElement("li");
      li.classList.add("mecanica");
      li.innerHTML = `
        <span class="desc">Mecânica ${formatarData(data)}:</span>
        <span class="valor">R$ ${valor.toFixed(2)}</span>`;
      listaMecanicasUl.appendChild(li);
    });
  }
}

/*************************************************
 *  EVENTOS – MÊS / META / REGISTROS
 *************************************************/

// Trocar de mês (Registros / Config)
if (selectMes) {
  selectMes.addEventListener("change", () => {
    carregarDadosMes(selectMes.value);
    // NÃO chamamos renderCalendar aqui (calendário é página separada)
  });
}

// Meta
if (metaInput) {
  metaInput.addEventListener("input", () => {
    let val = parseFloat(metaInput.value);
    if (isNaN(val) || val < 0) val = 0;
    dadosMes.meta = val;
    salvarDadosMes();
    notificouMeta = false;
    atualizarResumo();
  });
}

// Adicionar ganho diário
if (btnAdicionar) {
  btnAdicionar.addEventListener("click", () => {
    let val = parseFloat(valorDiaInput.value);

    if (isNaN(val) || val <= 0) {
      alert("Informe um valor válido para o dia.");
      return;
    }

    const dataAgora = new Date();
    const dataISO = dataAgora.toISOString();

    // Salva o ganho
    dadosMes.ganhos.push({ valor: val, data: dataISO });
    salvarDadosMes();
    valorDiaInput.value = "";
    atualizarResumo();

    // Marca automaticamente dia trabalhado (armazenado)
    const mesRef = selectMes ? selectMes.value : getMesAtual();
    const [ano, mes] = mesRef.split("-").map(Number);
    const dia = dataAgora.getDate();

    const mesStr = String(mes).padStart(2, "0");
    const diaStr = String(dia).padStart(2, "0");
    const key = `${ano}-${mesStr}-${diaStr}`;

    let worked = loadWorkedDays(mesRef);
    worked[key] = true;
    saveWorkedDays(mesRef, worked);

    if (diasTrabalhadosSpan) {
      diasTrabalhadosSpan.textContent = Object.keys(worked).length;
    }
  });
}

// Gasto combustível
if (btnAdicionarGasto) {
  btnAdicionarGasto.addEventListener("click", () => {
    let val = parseFloat(gastoGasolinaInput.value);
    if (isNaN(val) || val <= 0) {
      alert("Informe um valor válido para o gasto.");
      return;
    }
    const dataAgora = new Date();
    dadosMes.gastos.push({ valor: val, data: dataAgora.toISOString() });
    gastoGasolinaInput.value = "";
    salvarDadosMes();
    atualizarResumo();
  });
}

// Transferência
if (btnAdicionarTransferencia) {
  btnAdicionarTransferencia.addEventListener("click", () => {
    let val = parseFloat(transferenciaInput.value);
    if (isNaN(val) || val <= 0) {
      alert("Informe um valor válido para transferência.");
      return;
    }

    const dataAgora = new Date();
    dadosMes.transferencias.push({ valor: val, data: dataAgora.toISOString() });

    transferenciaInput.value = "";
    salvarDadosMes();
    atualizarResumo();
  });
}

// Despesa mecânica
if (btnAdicionarMecanica) {
  btnAdicionarMecanica.addEventListener("click", () => {
    let val = parseFloat(mecanicaInput.value);
    if (isNaN(val) || val <= 0) {
      alert("Informe um valor válido para a despesa.");
      return;
    }

    const dataAgora = new Date();
    dadosMes.mecanicas.push({ valor: val, data: dataAgora.toISOString() });

    mecanicaInput.value = "";
    salvarDadosMes();
    atualizarResumo();
  });
}

// Limpar mês
if (btnLimpar) {
  btnLimpar.addEventListener("click", () => {
    const mesAlvo = selectMesConfig ? selectMesConfig.value : (selectMes ? selectMes.value : getMesAtual());
    if (confirm(`Deseja realmente limpar os dados do mês ${formatarMesAno(mesAlvo)}?`)) {
      localStorage.removeItem("mob_" + mesAlvo);
      localStorage.removeItem("worked_" + mesAlvo);
      carregarDadosMes(mesAlvo);
      popularSelectsMes();
      if (diasTrabalhadosSpan) diasTrabalhadosSpan.textContent = "0";
      // Não chama renderCalendar aqui (calendário recarrega quando abrir a página)
    }
  });
}

// Exportar CSV
if (btnExportar) {
  btnExportar.addEventListener("click", () => {
    const mesAlvo = selectMesConfig ? selectMesConfig.value : (selectMes ? selectMes.value : getMesAtual());
    exportarCSV(mesAlvo);
  });
}

function exportarCSV(mesRef) {
  // Garante que estamos com dados do mês correto
  carregarDadosMes(mesRef);

  let csvContent = "data:text/csv;charset=utf-8,";

  // Cabeçalho
  csvContent += "Tipo,Descrição,Data,Valor\n";

  csvContent += `Meta,Meta Mensal,,${dadosMes.meta.toFixed(2)}\n`;

  dadosMes.ganhos.forEach(({ valor, data }, i) => {
    csvContent += `Ganho,Dia ${i + 1},${formatarDataCSV(data)},${valor.toFixed(2)}\n`;
  });

  dadosMes.gastos.forEach(({ valor, data }, i) => {
    csvContent += `Gasto,Gasto ${i + 1},${formatarDataCSV(data)},${valor.toFixed(2)}\n`;
  });

  dadosMes.transferencias.forEach(({ valor, data }, i) => {
    csvContent += `Transferência,Transferência ${i + 1},${formatarDataCSV(data)},${valor.toFixed(2)}\n`;
  });

  dadosMes.mecanicas.forEach(({ valor, data }, i) => {
    csvContent += `Despesa Mecânica,Despesa ${i + 1},${formatarDataCSV(data)},${valor.toFixed(2)}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `mob_dados_${mesRef}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/*************************************************
 *   CALENDÁRIO – FUNCIONAMENTO INDEPENDENTE
 *************************************************/
(function initCalendarPage() {

  const calendarEl = document.getElementById("calendar");
  const monthLabelCal = document.getElementById("monthLabelCal");
  const prevMonthCal = document.getElementById("prevMonthCal");
  const nextMonthCal = document.getElementById("nextMonthCal");
  const diasTrabalhadosSpanLocal = document.getElementById("diasTrabalhados");

  // Se não estiver na página de calendário, não executa
  if (!calendarEl || !monthLabelCal) return;

  console.log("📅 Calendário iniciado!");

  let mesAtual = new Date().toISOString().slice(0,7);

  function renderCalendar(mesRef) {
    const [ano, mes] = mesRef.split("-").map(Number);
    const worked = loadWorkedDays(mesRef);

    const date = new Date(ano, mes - 1, 1);
    const totalDias = new Date(ano, mes, 0).getDate();
    const firstDay = date.getDay();

    calendarEl.innerHTML = "";

    monthLabelCal.textContent = date.toLocaleString("pt-BR", {
      month: "long",
      year: "numeric",
    });

    // Dias vazios
    for (let i = 0; i < firstDay; i++) {
      const div = document.createElement("div");
      div.classList.add("calendar-day");
      div.style.visibility = "hidden";
      calendarEl.appendChild(div);
    }

    // Dias reais
    for (let d = 1; d <= totalDias; d++) {
      const diaStr = String(d).padStart(2, "0");
      const mesStr = String(mes).padStart(2, "0");
      const key = `${ano}-${mesStr}-${diaStr}`;

      const div = document.createElement("div");
      div.classList.add("calendar-day");
      div.textContent = d;

      if (worked[key]) div.classList.add("worked");

      div.onclick = () => {
        const atual = loadWorkedDays(mesRef);
        if (atual[key]) delete atual[key];
        else atual[key] = true;
        saveWorkedDays(mesRef, atual);
        renderCalendar(mesRef);
      };

      calendarEl.appendChild(div);
    }

    const qtd = Object.keys(worked).length;
    if (diasTrabalhadosSpanLocal) diasTrabalhadosSpanLocal.textContent = qtd;
  }

  renderCalendar(mesAtual);

  if (prevMonthCal) {
    prevMonthCal.onclick = () => {
      const [ano, mes] = mesAtual.split("-").map(Number);
      mesAtual = new Date(ano, mes - 2, 1).toISOString().slice(0,7);
      renderCalendar(mesAtual);
    };
  }

  if (nextMonthCal) {
    nextMonthCal.onclick = () => {
      const [ano, mes] = mesAtual.split("-").map(Number);
      mesAtual = new Date(ano, mes, 1).toISOString().slice(0,7);
      renderCalendar(mesAtual);
    };
  }

})();

/*************************************************
 *   INICIALIZAÇÃO GERAL DO APP
 *************************************************/
(function initApp() {
  console.log("🔥 INICIANDO APP...");

  popularSelectsMes();

  const mesBase =
      selectMes && selectMes.value
          ? selectMes.value
          : getMesAtual();

  console.log("📅 Mês carregado:", mesBase);

  carregarDadosMes(mesBase);
  atualizarResumo();
})();
