/* Barbell Diva - photo-store.js
   Le foto progressi (base64) NON vengono più tenute dentro localStorage:
   occupano troppo spazio e ogni salvataggio riscriveva l'intero pacchetto dati.
   Qui le foto vivono in IndexedDB (limite molto più alto), mentre in
   localStorage restano solo i metadati leggeri (id, data, note, hasFront...).
   Condiviso sia da index.html che da nutrizione/index.html (stessa origine). */
(function (global) {
  const DB_NAME = "barbell-diva-photos";
  const STORE_NAME = "photos";
  const DB_VERSION = 1;
  let dbPromise = null;

  function openDb() {
    if (!global.indexedDB) return Promise.resolve(null);
    if (!dbPromise) {
      dbPromise = new Promise((resolve) => {
        try {
          const req = global.indexedDB.open(DB_NAME, DB_VERSION);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        } catch (error) { resolve(null); }
      });
    }
    return dbPromise;
  }

  function photoId(photo) {
    if (photo && photo.id) return String(photo.id).replace(/-(front|side|back)$/, "");
    const text = [photo?.date || "", photo?.notes || ""].join("|");
    let hash = 0;
    for (let index = 0; index < text.length; index += 1) hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
    return `photo-${Math.abs(hash).toString(36)}-${String(photo?.date || "no-date").replace(/[^a-z0-9-]/gi, "-")}`;
  }

  function hasImageData(photo) { return !!(photo && (photo.front || photo.side || photo.back)); }

  async function putPhoto(photo) {
    if (!photo || !hasImageData(photo)) return false;
    const db = await openDb();
    if (!db) return false;
    const record = { id: photoId(photo), date: photo.date || "", notes: photo.notes || "", front: photo.front || "", side: photo.side || "", back: photo.back || "" };
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(record);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (error) { resolve(false); }
    });
  }

  async function putPhotos(photos = []) {
    const heavy = (photos || []).filter(hasImageData);
    if (!heavy.length) return 0;
    const results = await Promise.all(heavy.map(putPhoto));
    return results.filter(Boolean).length;
  }

  async function getPhoto(id) {
    const db = await openDb();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (error) { resolve(null); }
    });
  }

  async function getAllPhotos() {
    const db = await openDb();
    if (!db) return [];
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (error) { resolve([]); }
    });
  }

  // Toglie front/side/back da un elenco di foto, lasciando solo i metadati leggeri.
  // Va chiamata prima di scrivere qualunque cosa in localStorage.
  function redactPhotoList(photos) {
    if (!Array.isArray(photos) || !photos.length) return photos;
    return photos.map((photo) => {
      if (!hasImageData(photo)) return photo;
      const { front, side, back, ...meta } = photo;
      return { ...meta, id: photo.id || photoId(photo), hasFront: !!front, hasSide: !!side, hasBack: !!back };
    });
  }

  function needsRedaction(photos) { return Array.isArray(photos) && photos.some(hasImageData); }

  // Rimette front/side/back nei metadati leggeri, leggendo da IndexedDB (per il rendering).
  async function hydratePhotoList(photos) {
    if (!Array.isArray(photos) || !photos.length) return photos || [];
    const all = await getAllPhotos();
    const byId = new Map(all.map((row) => [row.id, row]));
    return photos.map((photo) => {
      if (hasImageData(photo)) return photo;
      const stored = byId.get(photo.id || photoId(photo));
      if (!stored) return photo;
      return { ...photo, front: stored.front || photo.front, side: stored.side || photo.side, back: stored.back || photo.back };
    });
  }

  global.BarbellDivaPhotoStore = { photoId, hasImageData, putPhoto, putPhotos, getPhoto, getAllPhotos, redactPhotoList, needsRedaction, hydratePhotoList };
})(window);
