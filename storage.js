/**
 * Capa de Persistencia de Datos (Local Storage) (RT-01, RT-02)
 */
const STORAGE_KEY = 'CAPITALFLOW_DATA';

export const StorageEngine = {
    
    /**
     * Obtiene el estado consolidado completo o crea uno nuevo estructurado por mes
     */
    obtenerDatos() {
        const data = localStorage.getItem(STORAGE_KEY); [cite: 27]
        const hoy = new Date();
        const mesActualKey = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

        if (!data) {
            return {
                mes_actual: mesActualKey,
                saldo_inicial: null,
                transacciones: []
            };
        }

        const parsedData = JSON.parse(data);
        
        // Si el mes ha cambiado en el dispositivo, forzamos un nuevo cierre contable mensual (RF-01)
        if (parsedData.mes_actual !== mesActualKey) {
            return {
                mes_actual: mesActualKey,
                saldo_inicial: null,
                transacciones: []
            };
        }

        return parsedData;
    },

    /**
     * Guarda el estado consolidado actual en el local storage
     */
    guardarDatos(datos) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(datos)); [cite: 27]
    },

    /**
     * Sobrescribe los datos locales a partir de una importación JSON externa (RF-06)
     */
    importarEstructura(jsonString) {
        try {
            const dataObjeto = JSON.parse(jsonString);
            if (dataObjeto.mes_actual && typeof dataObjeto.saldo_inicial === 'number' && Array.isArray(dataObjeto.transacciones)) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(dataObjeto)); [cite: 27]
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }
};