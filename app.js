/**
 * Lógica de Negocio, Core del Estado Financiero y Orquestación de Módulos (RT-01, RT-01)
 */
import { StorageEngine } from './storage.js';
import { UI } from './ui.js';

// Estado General de la App en Memoria Líquida (Capa de Negocio)
let AppState = {
    mes_actual: "",
    saldo_inicial: null,
    transacciones: []
};

/**
 * Realiza los cálculos financieros exactos en tiempo real y actualiza el Dashboard (RF-03, RF-04)
 */
function recalcularYFlujearFinanzas() {
    const saldoInicial = AppState.saldo_inicial || 0;
    
    // Sumatorias funcionales
    const totalIngresos = AppState.transacciones
        .filter(t => t.tipo === 'ingreso')
        .reduce((sum, t) => sum + t.monto, 0);

    const totalGastos = AppState.transacciones
        .filter(t => t.tipo === 'gasto')
        .reduce((sum, t) => sum + t.monto, 0);

    const saldoActual = saldoInicial + totalIngresos - totalGastos; [cite: 18]

    // Regla de alertas críticas: Gastos superan el 80% del saldo inicial de caja (RF-04)
    const activarAlerta = totalGastos > (saldoInicial * 0.80); [cite: 19]

    // Renderizamos dashboards e historial
    UI.renderizarDashboard(saldoInicial, totalGastos, saldoActual, activarAlerta);
    UI.renderizarTransacciones(AppState.transacciones, eliminarTransaccion);
}

/**
 * Lógica para remover movimientos del historial (RF-05)
 */
function eliminarTransaccion(id) {
    AppState.transacciones = AppState.transacciones.filter(t => t.id !== id);
    StorageEngine.guardarDatos(AppState);
    recalcularYFlujearFinanzas();
}

/**
 * Escucha de Eventos y Envío de Formularios
 */
function inicializarEventos() {
    
    // Procesar Apertura Mensual (RF-01)
    UI.formApertura.addEventListener('submit', (e) => {
        e.preventDefault();
        const valorInput = parseFloat(UI.saldoInicialInput.value);

        if (isNaN(valorInput) || valorInput < 0) { [cite: 12]
            UI.errorApertura.classList.remove('hidden');
            return;
        }

        UI.errorApertura.classList.add('hidden');
        AppState.saldo_inicial = valorInput;
        
        StorageEngine.guardarDatos(AppState);
        UI.toggleModalApertura(false); // Liberar interfaz
        recalcularYFlujearFinanzas();
    });

    // Procesar Registro de Transacción (RF-02)
    UI.formTransaccion.addEventListener('submit', (e) => {
        e.preventDefault();

        const monto = parseFloat(document.getElementById('tx-monto').value);
        const tipo = document.getElementById('tx-tipo').value;
        const categoria = document.getElementById('tx-categoria').value;
        const fecha = document.getElementById('tx-fecha').value;
        const descripcion = document.getElementById('tx-descripcion').value.trim();

        // Validaciones requeridas de negocio (RF-02)
        if (isNaN(monto) || monto <= 0) return;

        const nuevaTransaccion = {
            id: `tx_${Date.now()}`,
            monto: parseFloat(monto.toFixed(2)), [cite: 14]
            tipo,
            categoria,
            fecha,
            descripcion
        };

        AppState.transacciones.push(nuevaTransaccion);
        StorageEngine.guardarDatos(AppState);
        
        // Resetear formulario conservando fecha contable del día
        UI.formTransaccion.reset();
        UI.establecerFechaPorDefecto();
        
        recalcularYFlujearFinanzas();
    });

    // Exportación de Datos a Archivo JSON (RF-06)
    UI.btnExportar.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(AppState, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `CapitalFlow_${AppState.mes_actual}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    // Importación de Datos mediante Archivo JSON (RF-06)
    UI.btnImportar.addEventListener('change', (e) => {
        const fileReader = new FileReader();
        if (!e.target.files[0]) return;
        
        fileReader.onload = function(event) {
            const exito = StorageEngine.importarEstructura(event.target.result);
            if (exito) {
                alert("Estados financieros importados con éxito.");
                window.location.reload();
            } else {
                alert("Error de Formato: El archivo JSON no corresponde a una plantilla contable válida de CapitalFlow.");
            }
        };
        fileReader.readAsText(e.target.files[0]);
    });
}

/**
 * Arranque de la Aplicación (Ciclo de Vida inicial)
 */
function init() {
    // 1. Cargar datos desde almacenamiento local
    AppState = StorageEngine.obtenerDatos();
    
    // 2. Comprobar regla de negocio crítica del mes en curso (RF-01)
    if (AppState.saldo_inicial === null) { [cite: 3]
        UI.toggleModalApertura(true); // Bloquear interfaz [cite: 3, 11]
    } else {
        UI.toggleModalApertura(false);
        recalcularYFlujearFinanzas();
    }

    // 3. Preparar elementos y oyentes de eventos
    UI.establecerFechaPorDefecto();
    inicializarEventos();
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);