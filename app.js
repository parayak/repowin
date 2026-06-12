/**
 * CAPITALFLOW CORE ENGINE - INTEGRADO SIN DEPENDENCIAS DE MÓDULO (ANTI-CORS)
 */

const CapitalFlowApp = {
    // Clave Única de Persistencia de Datos
    STORAGE_KEY: 'CAPITALFLOW_DATA',

    // Estado General en Memoria Líquida
    State: {
        mes_actual: "",
        saldo_inicial: null,
        transacciones: []
    },

    // Mapeo del DOM Directo
    DOM: {
        modal: document.getElementById('modal-apertura'),
        formApertura: document.getElementById('form-apertura'),
        saldoInicialInput: document.getElementById('saldo-inicial-input'),
        errorApertura: document.getElementById('error-apertura'),
        btnEditarSaldo: document.getElementById('btn-editar-saldo'),
        displaySaldoInicial: document.getElementById('display-saldo-inicial'),
        displayTotalGastos: document.getElementById('display-total-gastos'),
        displaySaldoActual: document.getElementById('display-saldo-actual'),
        alertaCritica: document.getElementById('alerta-critica'),
        cardNet: document.querySelector('.card-net'),
        formTransaccion: document.getElementById('form-transaccion'),
        listaTransacciones: document.getElementById('lista-transacciones'),
        btnExportar: document.getElementById('btn-exportar'),
        btnImportar: document.getElementById('btn-importar')
    },

    // ==========================================================================
    // CAPA DE ALMACENAMIENTO (STORAGE)
    // ==========================================================================
    cargarStorage() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        const hoy = new Date();
        const mesActualKey = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

        if (!data) {
            this.State = { mes_actual: mesActualKey, saldo_inicial: null, transacciones: [] };
            return;
        }

        const parsed = JSON.parse(data);
        if (parsed.mes_actual !== mesActualKey) {
            this.State = { mes_actual: mesActualKey, saldo_inicial: null, transacciones: [] };
        } else {
            this.State = parsed;
        }
    },

    guardarStorage() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.State));
    },

    // ==========================================================================
    // CAPA DE RENDERIZACIÓN Y SEGURIDAD DOM (UI)
    // ==========================================================================
    sanitizar(stringCrudo) {
        const temp = document.createElement('div');
        temp.textContent = stringCrudo;
        return temp.innerHTML;
    },

    toggleModal(mostrar, valorActual = null) {
        if (mostrar) {
            this.DOM.modal.classList.remove('hidden');
            this.DOM.modal.setAttribute('aria-hidden', 'false');
            if (valorActual !== null) this.DOM.saldoInicialInput.value = valorActual;
        } else {
            this.DOM.modal.classList.add('hidden');
            this.DOM.modal.setAttribute('aria-hidden', 'true');
            this.DOM.formApertura.reset();
        }
    },

    renderizar() {
        const saldoInicial = this.State.saldo_inicial || 0;
        
        const totalIngresos = this.State.transacciones
            .filter(t => t.tipo === 'ingreso')
            .reduce((sum, t) => sum + t.monto, 0);

        const totalGastos = this.State.transacciones
            .filter(t => t.tipo === 'gasto')
            .reduce((sum, t) => sum + t.monto, 0);

        const saldoActual = saldoInicial + totalIngresos - totalGastos;
        const activarAlerta = totalGastos > (saldoInicial * 0.80);

        // Actualizar Tarjetas
        this.DOM.displaySaldoInicial.textContent = `$${saldoInicial.toFixed(2)}`;
        this.DOM.displayTotalGastos.textContent = `$${totalGastos.toFixed(2)}`;
        this.DOM.displaySaldoActual.textContent = `$${saldoActual.toFixed(2)}`;

        // Gestión de Alerta Crítica (WCAG AA)
        if (activarAlerta) {
            this.DOM.alertaCritica.classList.remove('hidden');
            this.DOM.cardNet.classList.add('alert-active');
        } else {
            this.DOM.alertaCritica.classList.add('hidden');
            this.DOM.cardNet.classList.remove('alert-active');
        }

        // Renderizar Tabla Historial con DocumentFragment (Evita Reflow Masivo)
        this.DOM.listaTransacciones.textContent = '';
        
        if (this.State.transacciones.length === 0) {
            const fila = document.createElement('tr');
            fila.innerHTML = `<td colspan="4" class="text-center" style="color: var(--text-secondary);">Ningún movimiento asentado en este período.</td>`;
            this.DOM.listaTransacciones.appendChild(fila);
            return;
        }

        const fragmento = document.createDocumentFragment();
        const ordenadas = [...this.State.transacciones].reverse();

        ordenadas.forEach(tx => {
            const fila = document.createElement('tr');
            const descSanitizada = tx.descripcion ? this.sanitizar(tx.descripcion) : `<small style="color:var(--text-secondary)">S/D</small>`;
            const catSanitizada = this.sanitizar(tx.categoria);
            const claseMonto = tx.tipo === 'ingreso' ? 'tx-ingreso' : 'tx-gasto';
            const signo = tx.tipo === 'ingreso' ? '+' : '-';

            fila.innerHTML = `
                <td class="font-mono">${tx.fecha}</td>
                <td>
                    <strong>${catSanitizada}</strong><br>
                    <span style="font-size:0.85rem; color:var(--text-secondary);">${descSanitizada}</span>
                </td>
                <td class="text-right font-mono ${claseMonto}">${signo}$${tx.monto.toFixed(2)}</td>
                <td class="text-center">
                    <button class="btn btn-danger btn-eliminar-tx" data-id="${tx.id}">Eliminar</button>
                </td>
            `;

            fila.querySelector('.btn-eliminar-tx').addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                this.eliminarTransaccion(id);
            });

            fragmento.appendChild(fila);
        });

        this.DOM.listaTransacciones.appendChild(fragmento);
    },

    establecerFechaHoy() {
        const hoy = new Date();
        const dia = String(hoy.getDate()).padStart(2, '0');
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        document.getElementById('tx-fecha').value = `${hoy.getFullYear()}-${mes}-${dia}`;
    },

    // ==========================================================================
    // LOGICA DE NEGOCIO Y EVENTOS
    // ==========================================================================
    eliminarTransaccion(id) {
        this.State.transacciones = this.State.transacciones.filter(t => t.id !== id);
        this.guardarStorage();
        this.renderizar();
    },

    inicializarEventos() {
        // Editar Saldo Inicial
        this.DOM.btnEditarSaldo.addEventListener('click', () => {
            this.toggleModal(true, this.State.saldo_inicial);
        });

        // Formulario Apertura / Modificación Manual
        this.DOM.formApertura.addEventListener('submit', (e) => {
            e.preventDefault();
            const valor = parseFloat(this.DOM.saldoInicialInput.value);

            if (isNaN(valor) || valor < 0) {
                this.DOM.errorApertura.classList.remove('hidden');
                return;
            }

            this.DOM.errorApertura.classList.add('hidden');
            this.State.saldo_inicial = valor;
            this.guardarStorage();
            this.toggleModal(false);
            this.renderizar();
        });

        // Formulario Registro Transacción
        this.DOM.formTransaccion.addEventListener('submit', (e) => {
            e.preventDefault();
            const monto = parseFloat(document.getElementById('tx-monto').value);
            const tipo = document.getElementById('tx-tipo').value;
            const categoria = document.getElementById('tx-categoria').value;
            const fecha = document.getElementById('tx-fecha').value;
            const descripcion = document.getElementById('tx-descripcion').value.trim();

            if (isNaN(monto) || monto <= 0) return;

            this.State.transacciones.push({
                id: `tx_${Date.now()}`,
                monto: parseFloat(monto.toFixed(2)),
                tipo, categoria, fecha, descripcion
            });

            this.guardarStorage();
            this.DOM.formTransaccion.reset();
            this.establecerFechaHoy();
            this.renderizar();
        });

        // Exportar JSON
        this.DOM.btnExportar.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.State, null, 2));
            const dlAnchor = document.createElement('a');
            dlAnchor.setAttribute("href", dataStr);
            dlAnchor.setAttribute("download", `CapitalFlow_${this.State.mes_actual}.json`);
            document.body.appendChild(dlAnchor);
            dlAnchor.click();
            dlAnchor.remove();
        });

        // Importar JSON
        this.DOM.btnImportar.addEventListener('change', (e) => {
            const reader = new FileReader();
            if (!e.target.files[0]) return;
            
            reader.onload = (event) => {
                try {
                    const obj = JSON.parse(event.target.result);
                    if (obj.mes_actual && typeof obj.saldo_inicial === 'number' && Array.isArray(obj.transacciones)) {
                        this.State = obj;
                        this.guardarStorage();
                        alert("Estados financieros importados con éxito.");
                        this.renderizar();
                    } else {
                        alert("Estructura JSON inválida.");
                    }
                } catch (err) {
                    alert("El archivo no es un JSON válido.");
                }
            };
            reader.readAsText(e.target.files[0]);
        });
    },

    init() {
        this.cargarStorage();
        this.establecerFechaHoy();
        this.inicializarEventos();

        if (this.State.saldo_inicial === null) {
            this.toggleModal(true);
        } else {
            this.renderizar();
        }
    }
};

// Disparador del ciclo de vida al cargar la UI
document.addEventListener('DOMContentLoaded', () => CapitalFlowApp.init());