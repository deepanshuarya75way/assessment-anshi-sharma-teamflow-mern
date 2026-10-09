const KEY_PROJECTS = 'teamflow_cached_projects';
const KEY_TASKS_PREFIX = 'teamflow_cached_tasks_';
const KEY_SYNC_QUEUE = 'teamflow_sync_queue';
const KEY_CONFLICTS = 'teamflow_sync_conflicts';

const safeGet = (key, fallback = null) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
};

const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
};

export const offlineStorage = {
  // Projects cache
  getStoredProjects: () => safeGet(KEY_PROJECTS, []),
  saveStoredProjects: (projects) => safeSet(KEY_PROJECTS, projects || []),

  // Tasks cache per project
  getStoredTasks: (projectId) => {
    if (!projectId) return [];
    return safeGet(`${KEY_TASKS_PREFIX}${projectId}`, []);
  },
  saveStoredTasks: (projectId, tasks) => {
    if (!projectId) return;
    safeSet(`${KEY_TASKS_PREFIX}${projectId}`, tasks || []);
  },

  // Sync Queue operations
  getSyncQueue: () => safeGet(KEY_SYNC_QUEUE, []),
  saveSyncQueue: (queue) => safeSet(KEY_SYNC_QUEUE, queue || []),

  addToSyncQueue: (action) => {
    const current = safeGet(KEY_SYNC_QUEUE, []);
    const queueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      ...action,
    };
    current.push(queueItem);
    safeSet(KEY_SYNC_QUEUE, current);
    return queueItem;
  },

  removeFromSyncQueue: (id) => {
    const current = safeGet(KEY_SYNC_QUEUE, []);
    const filtered = current.filter((item) => item.id !== id);
    safeSet(KEY_SYNC_QUEUE, filtered);
    return filtered;
  },

  // Replaces a tempTaskId in remaining queue actions when server assigns permanent _id
  updateSyncQueueTaskIds: (tempId, realId) => {
    const current = safeGet(KEY_SYNC_QUEUE, []);
    const updated = current.map((item) => {
      if (item.taskId === tempId) {
        return { ...item, taskId: realId };
      }
      return item;
    });
    safeSet(KEY_SYNC_QUEUE, updated);
    return updated;
  },

  clearSyncQueue: () => safeSet(KEY_SYNC_QUEUE, []),

  // Conflicts list
  getConflicts: () => safeGet(KEY_CONFLICTS, []),
  saveConflicts: (conflicts) => safeSet(KEY_CONFLICTS, conflicts || []),

  addConflict: (conflict) => {
    const current = safeGet(KEY_CONFLICTS, []);
    // Check if duplicate for same task
    const filtered = current.filter((c) => c.taskId !== conflict.taskId);
    filtered.push({
      id: `conflict_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      ...conflict,
    });
    safeSet(KEY_CONFLICTS, filtered);
    return filtered;
  },

  removeConflict: (conflictId) => {
    const current = safeGet(KEY_CONFLICTS, []);
    const filtered = current.filter((c) => c.id !== conflictId && c.taskId !== conflictId);
    safeSet(KEY_CONFLICTS, filtered);
    return filtered;
  },
};

export default offlineStorage;
