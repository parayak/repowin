/**
 * Capa UI: Manipulación, renders robustos y sanitización del DOM (RT-01, RT-04)
 */

export const UI = {
    // Selectores del DOM
    modal: document.getElementById('modal-apertura'),
    formApertura: document.getElementById('form-apertura'),
    saldoInicialInput: document.getElementById('saldo-inicial-input'),
    errorApertura: document.getElementById('error-apertura'),
    btnEditarSaldo: document.getElementById('btn-editar-saldo'), // NUEVO SELECTOR
    
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
     * Sanitizador de strings para mitigar vulnerabilidades XSS
     */
    sanitizar(stringCrudo) {
        const temporal = document.createElement('div');
        temporal.textContent = stringCrudo;
        return temporal.innerHTML;
    },

    /**
     * Control de visualización del modal
     */
    toggleModalApertura(mostrar, valorActual = null) {
        if (mostrar) {
            this.modal.classList.remove('hidden');
            this.modal.setAttribute('aria-hidden', 'false');
            if (valorActual !== null) {
                this.saldoInicialInput.value = valorActual; // Precarga el saldo para su modificación
            }
        } else {
            this.modal.classList.add('hidden');
            this.modal.setAttribute('aria-hidden', 'true');
            this.formApertura.reset();
        }
    },

    /**
     * Renderizado dinámico de balances
     */
    renderizarDashboard(saldoInicial, totalGastos, saldoActual, activarAlerta) {
        this.displaySaldoInicial.textContent = `$${saldoInicial.toFixed(2)}`;
        this.displayTotalGastos.textContent = `$${totalGastos.toFixed(2)}`;
        this.displaySaldoActual.textContent = `$${saldoActual.toFixed(2)}`;

        if (activarAlerta) {
            this.alertaCritica.classList.remove('hidden');
            this.cardNet.classList.add('alert-active');
        } else {
            this.alertaCritica.classList.add('hidden');
            this.cardNet.classList.remove('alert-active');
        }
    },

    /**
     * Renderizado optimizado mediante DocumentFragment
     */
    renderizarTransacciones(transacciones, callbackEliminar) {
        this.listaTransacciones.textContent = '';

        if (transacciones.length === 0) {
            const filaVacia = document.createElement('tr');
            filaVacia.innerHTML = `<td colspan="4" class="text-center" style="color: var(--text-secondary);">Ningún movimiento asentado en este período.</td>`;
            this.listaTransacciones.appendChild(filaVacia);
            return;
        }

        const fragmento = document.createDocumentFragment();
        const transaccionesOrdenadas = [...transacciones].reverse();

        transaccionesOrdenadas.forEach(tx => {
            const fila = document.createElement('tr');
            const descripcionSanitizada = tx.descripcion ? this.sanitizar(tx.descripcion) : `<small style="color:var(--text-secondary)">S/D</small>`;
            const categoriaSanitizada = this.sanitizar(tx.categoria);
            const montoClase = tx.tipo === 'ingreso' ? 'tx-ingreso' : 'tx-gasto';
            const signo = tx.tipo === 'ingreso' ? '+' : '-';

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

            fila.querySelector('.btn-eliminar-tx').addEventListener('click', (e) => {
                const idTx = e.target.getAttribute('data-id');
                callbackEliminar(idTx);
            });

            fragmento.appendChild(fila);
        });

        this.listaTransacciones.appendChild(fragmento);
    },

    establecerFechaPorDefecto() {
        const hoy = new Date();
        const dia = String(hoy.getDate()).padStart(2, '0');
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        document.getElementById('tx-fecha').value = `${hoy.getFullYear()}-${mes}-${dia}`;
    }
};