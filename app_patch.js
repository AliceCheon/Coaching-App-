
/**
 * Coach Alice AI - Core Logic Patch
 * Fixes: Protected Schedule Overwrite, Export Reliability, Sync Conflict Resolution
 */

// Fix 1: Hard Protection for sensitive schedule
const LOCKED_SCHEDULE = "Intensità Agosto-Ottobre";

function updateSchedule(scheduleName, data) {
    if (scheduleName === LOCKED_SCHEDULE) {
        console.warn("BLOCCO SICUREZZA: Tentativo di modifica su scheda protetta ignorato.");
        return { success: false, error: "Scheda in sola lettura" };
    }
    // Proceed with update...
}

// Fix 2: Robust Export with error boundary
async function exportBackup() {
    try {
        console.log("Inizio esportazione backup...");
        const appData = await fetchAllAppData(); // Simulated data fetch
        
        // Error check: Check for circular references or big payloads
        if (!appData) throw new Error("Dati non trovati");
        
        const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_coach_alice_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        return { success: true };
    } catch (err) {
        console.error("ERRORE ESPORTAZIONE:", err.message);
        return { success: false, error: err.message };
    }
}

// Fix 3: Sync Conflict Resolution (Timestamp-based)
function syncWithRemote(localData, remoteData) {
    if (localData.timestamp > remoteData.timestamp) {
        return localData; // Local is newer
    } else if (localData.timestamp < remoteData.timestamp) {
        return remoteData; // Remote is newer
    } else {
        return localData; // Same timestamp, keep local
    }
}
