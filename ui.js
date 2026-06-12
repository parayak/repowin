/**
 * Capa UI: Manipulación, renders robustos y sanitización del DOM (RT-01, RT-04)
 */

export const UI = {
    // Selectores del DOM
    modal: document.getElementById('modal-apertura'),
    formApertura: document.getElementById('form-apertura'),
    saldoInicialInput: document.getElementById('saldo-inicial-input'),
    errorApertura: document.getElementById('error-apertura'),
    
    displaySaldoInicial: document.getElementById('display-saldo-inicial'),
    displayTotalGastos: document.getElementById('display-total-gastos'),
    displaySaldoActual: document.getElementById('display-saldo-actual'),
    alertaCritica: document.getElementById('alerta-critica'),
    cardNet: document.querySelector('.card-net'),
    
    formTransaccion: document.getElementById('form-transaccion'),
    listaTransacciones: document.getElementById('lista-transacciones'),
    btnExportar: document.getElementById('btn-exportar'),
    btnImportar: document.getElementById('btn-importar'),

    /**
     * Sanitizador explícito de cadenas de texto para contrarrestar ataques XSS (RT-04)
     */
    sanitizar(stringCrudo) {
        const temporal = document.createElement('div'); [cite: 33]
        temporal.textContent = stringCrudo; [cite: 33]
        return temporal.innerHTML;
    },

    /**
     * Control de visualización de la pantalla de bloqueo de control inicial (RF-01)
     */
    toggleModalApertura(mostrar) {
        if (mostrar) {
            this.modal.classList.remove('hidden');
            this.modal.setAttribute('aria-hidden', 'false');
        } else {
            this.modal.classList.add('hidden');
            this.modal.setAttribute('aria-hidden', 'true');
        }
    },

    /**
     * Renderizado dinámico general de los balances en el Dashboard (RF-03, RF-04)
     */
    renderizarDashboard(saldoInicial, totalGastos, saldoActual, activarAlerta) {
        this.displaySaldoInicial.textContent = `$${saldoInicial.toFixed(2)}`; [cite: 33]
        this.displayTotalGastos.textContent = `$${totalGastos.toFixed(2)}`; [cite: 33]
        this.displaySaldoActual.textContent = `$${saldoActual.toFixed(2)}`; [cite: 33]

        if (activarAlerta) {
            this.alertaCritica.classList.remove('hidden');
            this.cardNet.classList.add('alert-active');
        } else {
            this.alertaCritica.classList.add('hidden');
            this.cardNet.classList.remove('alert-active');
        }
    },

    /**
     * Renderizado optimizado del Libro Diario usando DocumentFragment para evitar Reflow masivo (RT-04, RF-05)
     */
    renderizarTransacciones(transacciones, callbackEliminar) {
        // Limpiamos tabla de forma nativa y segura
        this.listaTransacciones.textContent = ''; [cite: 33]

        if (transacciones.length === 0) {
            const filaVacia = document.createElement('tr'); [cite: 33]
            filaVacia.innerHTML = `<td colspan="4" class="text-center" style="color: var(--text-secondary);">Ningún movimiento asentado en este período.</td>`;
            this.listaTransacciones.appendChild(filaVacia);
            return;
        }

        const fragmento = document.createDocumentFragment(); [cite: 34]

        // Cronológico inverso (RF-05)
        const transaccionesOrdenadas = [...transacciones].reverse();

        transaccionesOrdenadas.forEach(tx => {
            const fila = document.createElement('tr'); [cite: 33]
            
            // Sanitización rigurosa de variables de entrada de usuario para prevenir XSS (RT-04)
            const descripcionSanitizada = tx.descripcion ? this.sanitizar(tx.descripcion) : `<small style="color:var(--text-secondary)">S/D</small>`;
            const categoriaSanitizada = this.sanitizar(tx.categoria);
            const montoClase = tx.tipo === 'ingreso' ? 'tx-ingreso' : 'tx-gasto';
            const signo = tx.tipo === 'ingreso' ? '+' : '-';

            // Estructura interna de celdas
            fila.innerHTML = `
                <td class="font-mono">${tx.fecha}</td>
                <td>
                    <strong>${categoriaSanitizada}</strong><br>
                    <span style="font-size:0.85rem; color:var(--text-secondary);">${descripcionSanitizada}</span>
                </td>
                <td class="text-right font-mono ${montoClase}">${signo}$${tx.monto.toFixed(2)}</td>
                <td class="text-center">
                    <button class="btn btn-danger btn-eliminar-tx" data-id="${tx.id}" aria-label="Eliminar transacción del ${tx.fecha}">Eliminar</button>
                </td>
            `;

            // Enlace seguro de escucha de eventos en el botón físico de remoción (RF-05)
            fila.querySelector('.btn-eliminar-tx').addEventListener('click', (e) => {
                const idTx = e.target.getAttribute('data-id');
                callbackEliminar(idTx);
            });

            fragmento.appendChild(fila);
        });

        this.listaTransacciones.appendChild(fragmento);
    },

    /**
     * Establece la fecha de hoy por defecto en el selector correspondiente (RF-02)
     */
    establecerFechaPorDefecto() {
        const hoy = new Date();
        const dia = String(hoy.getDate()).padStart(2, '0');
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        document.getElementById('tx-fecha').value = `${hoy.getFullYear()}-${mes}-${dia}`;
    }
};