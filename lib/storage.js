import { set, get, del, keys } from 'idb-keyval';

// Uložíme celou zakázku pod SPZ (nebo jiným ID)
export const saveToBackup = async (id, data) => {
    try {
        const allKeys = await keys();
        const curentKey = `draft_${id}`;

        for (const key of allKeys) {
            if (key.startsWith('draft_') && key !== curentKey) {
                await del(key);
            }
        }
        await set(`draft_${id}`, {
            data,
            timestamp: Date.now(),
        });
    } catch (err) {
        console.error('Chyba při ukládání do IndexedDB', err);
    }
};

// Převedení draftu na trvalou zakázku (Archiv)
export const finalizeOrder = async (id, data) => {
    try {
        // 1. Smažeme rozpracovaný draft
        await del(`draft_${id}`);
        // 2. Uložíme jako hotovou zakázku s novým prefixem
        await set(`order_${id}`, {
            data,
            timestamp: Date.now(),
        });
    } catch (err) {
        console.error('Chyba při finalizaci zakázky', err);
    }
};

// Načteme zakázku
export const loadFromBackup = async (id) => {
    const entry = await get(`draft_${id}`);
    return entry ? entry.data : null;
};

export const clearAllDrafts = async () => {
    const allKeys = await keys();
    for (const key of allKeys) {
        if (key.startsWith('draft_')) {
            await del(key);
        }
    }
};

// Čistí DRAFTY i ARCHIV starší než 30 dní
export const autoCleanup = async () => {
    const allKeys = await keys();
    const now = Date.now();
    const expiration = 30 * 24 * 60 * 60 * 1000;

    for (const key of allKeys) {
        if (key.startsWith('draft_') || key.startsWith('order_')) {
            const entry = await get(key);
            if (entry && now - entry.timestamp > expiration) {
                await del(key);
            }
        }
    }
};

export const getAllArchivedOrders = async () => {
    const allKeys = await keys();
    const archivedOrders = [];

    for (const key of allKeys) {
        if (key.startsWith('order_')) {
            const entry = await get(key);
            if (entry) {
                archivedOrders.push({
                    id: key.replace('order_', ''),
                    data: entry.data,
                    timestamp: entry.timestamp,
                });
            }
        }
    }
    // Seřadíme od nejnovější po nejstarší
    return archivedOrders.sort((a, b) => b.timestamp - a.timestamp);
};

// Export dat do souboru .json
export const exportOrderToJson = (data) => {
    const spz = data.vehicleSPZ || 'zakazka';
    // Odfiltrujeme objekty typu File pro JSON (JSON neumí binární data přímo)
    // Pokud chceš přenášet i fotky, musel bys je převést na Base64,
    // ale pro textový přenos dat (opravy) stačí toto:
    const dataToExport = JSON.stringify(
        data,
        (key, value) => {
            if (value instanceof File) return '[Soubor]'; // Identifikátor, že tam byla fotka
            return value;
        },
        2
    );

    const blob = new Blob([dataToExport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `export_${spz}.json`;
    link.click();
    URL.revokeObjectURL(url);
};
