// Simple booking events emitter for optimistic UI updates
const addedListeners = new Set();
const removedListeners = new Set();

export function onBookedBlockAdded(cb) {
    addedListeners.add(cb);
    return () => addedListeners.delete(cb);
}

export function emitBookedBlockAdded(blockId) {
    addedListeners.forEach(cb => {
        try { cb(blockId); } catch (e) { /* ignore listener errors */ }
    });
}

export function onBookedBlockRemoved(cb) {
    removedListeners.add(cb);
    return () => removedListeners.delete(cb);
}

export function emitBookedBlockRemoved(blockId) {
    removedListeners.forEach(cb => {
        try { cb(blockId); } catch (e) { /* ignore listener errors */ }
    });
}

export default { onBookedBlockAdded, emitBookedBlockAdded, onBookedBlockRemoved, emitBookedBlockRemoved };
