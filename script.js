/*************************************************
 *  MENU (HAMBÚRGUER)
 *************************************************/
const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");

if (hamburger) {
    hamburger.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}



/*************************************************
 *  VARIÁVEIS GERAIS (existem apenas se estiver na página)
 *************************************************/
const selectMes =
    document.getElementById("selectMesRegistro") ||
    document.getElementById("selectMes") ||
    document.getElementById("selectMesConfig") ||
    null;

const selectMesConfig = document.getElementById("selectMesConfig");

const metaInput = document.getElementById("metaMes");
const valorDiaInput = document.getElementById("valorDia");
const gastoGasolinaInput = document.getElementById("gastoGasolina");

const btnAdicionar = document.getElementById("btnAdicionar");
const btnAdicionarGasto = document.getElementById("btnAdicionarGasto");
const btnAdicionarTransferencia = document.getElementById("btnAdicionarTransferencia");
const btnAdicionarMecanica = document.getElementById("btnAdicionarMecanica");
const btnLimpar = document.getElementById("btnLimpar");
const btnExportar = document.getElementById("btnExportar");

const totalGanhosSpan = document.getElementById("totalGanhos");
const totalGastosSpan = document.getElementById("totalGastos");
const lucroLiquidoSpan = document.getElementById("lucroLiquido");
const metaExibidaSpan = document.getElementById("metaExibida");
const progressoPercentSpan = document.getElementById("progressoPercent");
const progressFillDiv = document.getElementById("progressFill");
const totalTransferidoSpan = document.getElementById("totalTransferido");
const diasTrabalhadosSpan = document.getElementById("diasTrabalhados");

const listaGanhosUl = document.getElementById("listaGanhos");
const listaGastosUl = document.getElementById("listaGastos");
const listaTransferenciasUl = document.getElementById("listaTransferencias");
const listaMecanicasUl = document.getElementById("listaMecanicas");

const transferenciaInput = document.getElementById("transferenciaValor");
const mecanicaInput = document.getElementById("despesaMecanica");

/*************************************************
 *   DADOS DO MÊS
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
 *  FUNÇÕES PRINCIPAIS
 *************************************************/
function getMesAtual() {
    return new Date().toISOString().slice(0, 7);
}

function formatarMesAno(m) {
    const [ano, mes] = m.split("-");
    return `${mes}/${ano}`;
}

function formatarData(dataISO) {
    const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    const d = new Date(dataISO);
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    return `${dia}/${mes} (${dias[d.getDay()]})`;
}


/*************************************************
 *  LISTAR MESES
 *************************************************/
function listarMeses() {
    const meses = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("mob_")) meses.push(key.slice(4));
    }

    const atual = getMesAtual();
    if (!meses.includes(atual)) meses.push(atual);

    return meses.sort().reverse();
}


/*************************************************
 *  POPULAR SELECTS
 *************************************************/
function popularSelectsMes() {
    const meses = listarMeses();
    const mesAtual = getMesAtual();

    if (selectMes) {
        selectMes.innerHTML = "";
        meses.forEach(m => {
            const op = document.createElement("option");
            op.value = m;
            op.textContent = formatarMesAno(m);
            selectMes.appendChild(op);
        });
        selectMes.value = mesAtual;
    }

    if (selectMesConfig) {
        selectMesConfig.innerHTML = "";
        meses.forEach(m => {
            const op = document.createElement("option");
            op.value = m;
            op.textContent = formatarMesAno(m);
            selectMesConfig.appendChild(op);
        });
        selectMesConfig.value = mesAtual;
    }
}


/*************************************************
 *  SALVAR & CARREGAR DADOS DO MÊS
 *************************************************/
function carregarDadosMes(mes) {
    const data = localStorage.getItem("mob_" + mes);

    dadosMes = data
        ? JSON.parse(data)
        : { meta: 0, ganhos: [], gastos: [], transferencias: [], mecanicas: [] };

    notificouMeta = false;
    atualizarResumo();
}

function salvarDadosMes() {
    const mes = selectMes ? selectMes.value : getMesAtual();
    localStorage.setItem("mob_" + mes, JSON.stringify(dadosMes));
}


/*************************************************
 *  ATUALIZAR RESUMO + PROGRESSO
 *************************************************/
function atualizarResumo() {
    const totalGanhos = dadosMes.ganhos.reduce((s, v) => s + v.valor, 0);
    const totalGastos = dadosMes.gastos.reduce((s, v) => s + v.valor, 0);
    const totalTransfer = dadosMes.transferencias.reduce((s, v) => s + v.valor, 0);
    const totalMecanica = dadosMes.mecanicas.reduce((s, v) => s + v.valor, 0);

    const lucroMeta = totalGanhos - totalGastos - totalMecanica;

    if (totalGanhosSpan) totalGanhosSpan.textContent = totalGanhos.toFixed(2);
    if (totalGastosSpan) totalGastosSpan.textContent = totalGastos.toFixed(2);
    if (lucroLiquidoSpan) lucroLiquidoSpan.textContent = lucroMeta.toFixed(2);
    if (metaExibidaSpan) metaExibidaSpan.textContent = dadosMes.meta.toFixed(2);
    if (totalTransferidoSpan) totalTransferidoSpan.textContent = totalTransfer.toFixed(2);

    const progresso = dadosMes.meta > 0 ? Math.min((lucroMeta / dadosMes.meta) * 100, 100) : 0;

    if (progressoPercentSpan) progressoPercentSpan.textContent = progresso.toFixed(1) + "%";
    if (progressFillDiv) progressFillDiv.style.width = progresso + "%";

    atualizarListas();
}


/*************************************************
 *  LISTAS (GANHOS, GASTOS...)
 *************************************************/
function atualizarListas() {
    if (listaGanhosUl) listaGanhosUl.innerHTML = "";
    if (listaGastosUl) listaGastosUl.innerHTML = "";
    if (listaTransferenciasUl) listaTransferenciasUl.innerHTML = "";
    if (listaMecanicasUl) listaMecanicasUl.innerHTML = "";

    dadosMes.ganhos.forEach(item => {
        if (!listaGanhosUl) return;
        const li = document.createElement("li");
        li.classList.add("ganho");
        li.innerHTML = `
          <span class="desc">Dia ${formatarData(item.data)}</span>
          <span class="valor">R$ ${item.valor.toFixed(2)}</span>`;
        listaGanhosUl.appendChild(li);
    });

    dadosMes.gastos.forEach(item => {
        if (!listaGastosUl) return;
        const li = document.createElement("li");
        li.classList.add("gasolina");
        li.innerHTML = `
          <span class="desc">Gasolina ${formatarData(item.data)}</span>
          <span class="valor">R$ ${item.valor.toFixed(2)}</span>`;
        listaGastosUl.appendChild(li);
    });

    dadosMes.transferencias.forEach(item => {
        if (!listaTransferenciasUl) return;
        const li = document.createElement("li");
        li.classList.add("transferencia");
        li.innerHTML = `
          <span class="desc">Transferência ${formatarData(item.data)}</span>
          <span class="valor">R$ ${item.valor.toFixed(2)}</span>`;
        listaTransferenciasUl.appendChild(li);
    });

    dadosMes.mecanicas.forEach(item => {
        if (!listaMecanicasUl) return;
        const li = document.createElement("li");
        li.classList.add("mecanica");
        li.innerHTML = `
          <span class="desc">Mecânica ${formatarData(item.data)}</span>
          <span class="valor">R$ ${item.valor.toFixed(2)}</span>`;
        listaMecanicasUl.appendChild(li);
    });
}



/*************************************************
 *  EVENTOS DE REGISTRO
 *************************************************/
if (btnAdicionar) {
    btnAdicionar.addEventListener("click", () => {
        const val = parseFloat(valorDiaInput.value);
        if (!val || val <= 0) return alert("Valor inválido");

        const data = new Date().toISOString();
        dadosMes.ganhos.push({ valor: val, data });
        salvarDadosMes();
        valorDiaInput.value = "";
        atualizarResumo();
    });
}

if (btnAdicionarGasto) {
    btnAdicionarGasto.addEventListener("click", () => {
        const val = parseFloat(gastoGasolinaInput.value);
        if (!val || val <= 0) return alert("Valor inválido");

        dadosMes.gastos.push({ valor: val, data: new Date().toISOString() });
        salvarDadosMes();
        gastoGasolinaInput.value = "";
        atualizarResumo();
    });
}

if (btnAdicionarTransferencia) {
    btnAdicionarTransferencia.addEventListener("click", () => {
        const val = parseFloat(transferenciaInput.value);
        if (!val || val <= 0) return alert("Valor inválido");

        dadosMes.transferencias.push({ valor: val, data: new Date().toISOString() });
        salvarDadosMes();
        transferenciaInput.value = "";
        atualizarResumo();
    });
}

if (btnAdicionarMecanica) {
    btnAdicionarMecanica.addEventListener("click", () => {
        const val = parseFloat(mecanicaInput.value);
        if (!val || val <= 0) return alert("Valor inválido");

        dadosMes.mecanicas.push({ valor: val, data: new Date().toISOString() });
        salvarDadosMes();
        mecanicaInput.value = "";
        atualizarResumo();
    });
}



/*************************************************
 *   CALENDÁRIO – FUNCIONAMENTO
 *************************************************/
(function initCalendar() {
    const calendarEl = document.getElementById("calendar");
    if (!calendarEl) return; // se não estiver na página, sai

    const monthLabel = document.getElementById("monthLabelCal");
    const prevBtn = document.getElementById("prevMonthCal");
    const nextBtn = document.getElementById("nextMonthCal");

    let mesAtual = getMesAtual();

    function loadWorked(mes) {
        return JSON.parse(localStorage.getItem("worked_" + mes)) || {};
    }

    function saveWorked(mes, obj) {
        localStorage.setItem("worked_" + mes, JSON.stringify(obj));
    }

    function renderCalendar(mesRef) {
        const [ano, mes] = mesRef.split("-").map(Number);
        const worked = loadWorked(mesRef);

        const firstDay = new Date(ano, mes - 1, 1).getDay();
        const totalDias = new Date(ano, mes, 0).getDate();

        calendarEl.innerHTML = "";
        monthLabel.textContent = new Date(ano, mes - 1, 1)
            .toLocaleString("pt-BR", { month: "long", year: "numeric" });

        for (let i = 0; i < firstDay; i++) {
            const div = document.createElement("div");
            div.classList.add("calendar-day");
            div.style.visibility = "hidden";
            calendarEl.appendChild(div);
        }

        for (let d = 1; d <= totalDias; d++) {
            const dd = String(d).padStart(2, "0");
            const mm = String(mes).padStart(2, "0");
            const key = `${ano}-${mm}-${dd}`;

            const div = document.createElement("div");
            div.classList.add("calendar-day");
            div.textContent = d;

            if (worked[key]) div.classList.add("worked");

            div.onclick = () => {
                if (worked[key]) delete worked[key];
                else worked[key] = true;

                saveWorked(mesRef, worked);
                renderCalendar(mesRef);

                if (diasTrabalhadosSpan)
                    diasTrabalhadosSpan.textContent = Object.keys(worked).length;
            };

            calendarEl.appendChild(div);
        }

        if (diasTrabalhadosSpan)
            diasTrabalhadosSpan.textContent = Object.keys(worked).length;
    }

    prevBtn.onclick = () => {
        const [ano, mes] = mesAtual.split("-").map(Number);
        mesAtual = new Date(ano, mes - 2, 1).toISOString().slice(0, 7);
        renderCalendar(mesAtual);
    };

    nextBtn.onclick = () => {
        const [ano, mes] = mesAtual.split("-").map(Number);
        mesAtual = new Date(ano, mes, 1).toISOString().slice(0, 7);
        renderCalendar(mesAtual);
    };

    renderCalendar(mesAtual);
})();



/*************************************************
 *  INICIALIZAÇÃO FINAL (APENAS UMA VEZ!)
 *************************************************/
(function initApp() {
    popularSelectsMes();

    const mesInicial =
        selectMes && selectMes.value ? selectMes.value : getMesAtual();

    carregarDadosMes(mesInicial);
    atualizarResumo();

    console.log("✔ APP iniciado com sucesso!");
})();
