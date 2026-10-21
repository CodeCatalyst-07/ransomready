const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const allowedAnswers = new Set(['yes', 'partial', 'no', 'unsure']);
const isPlainObject = (value) => value !== null && typeof value === 'object'
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));

function serialize(payload) {
  if (!isPlainObject(payload)) throw new Error('Assessment payload must be a plain object.');
  if (!isPlainObject(payload.answers) || Reflect.ownKeys(payload.answers)
    .some((key) => typeof key !== 'string' || !allowedAnswers.has(payload.answers[key]))) {
    throw new Error('Answers must be a plain object containing only yes, partial, no or unsure.');
  }
  if (typeof payload.organisationName !== 'string' || payload.organisationName.length > 100) {
    throw new Error('Organisation name must be a string of at most 100 characters.');
  }
  let json;
  try { json = JSON.stringify(payload, null, 2); } catch { throw new Error('Assessment must be JSON serializable.'); }
  if (Buffer.byteLength(json, 'utf8') >= 1024 * 1024) throw new Error('Assessment must be under 1 MB.');
  return json;
}

function createStorage(baseDir) {
  const draftPath = path.join(baseDir, 'draft.json');
  const assessmentsDir = path.join(baseDir, 'assessments');
  let lastTimestamp = 0;
  // Queue file operations so overlapping IPC requests cannot overwrite newer work.
  let pending = Promise.resolve();
  function enqueue(operation) {
    const result = pending.then(operation);
    pending = result.catch(() => {});
    return result;
  }

  async function atomicWrite(target, json) {
    await fs.mkdir(path.dirname(target), { recursive: true });
    const temporary = `${target}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, json, { encoding: 'utf8', mode: 0o600 });
      await fs.rename(temporary, target);
    } finally {
      await fs.rm(temporary, { force: true });
    }
  }

  async function readValid(target) {
    let json;
    try { json = await fs.readFile(target, 'utf8'); } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
    try {
      const data = JSON.parse(json);
      serialize(data);
      return data;
    } catch { return null; }
  }

  return {
    saveDraft: (draft) => enqueue(async () => {
      await atomicWrite(draftPath, serialize(draft));
      return draft;
    }),
    loadDraft: () => enqueue(() => readValid(draftPath)),
    clearDraft: () => enqueue(() => fs.rm(draftPath, { force: true })),
    saveAssessment: (data) => enqueue(async () => {
      serialize(data);
      // Monotonic timestamps avoid collisions when two submissions share a millisecond.
      lastTimestamp = Math.max(Date.now(), lastTimestamp + 1);
      while (await fs.stat(path.join(assessmentsDir, `assessment-${lastTimestamp}.json`)).then(() => true, (error) => {
        if (error.code === 'ENOENT') return false;
        throw error;
      })) lastTimestamp += 1;
      const saved = { ...data, id: `assessment-${lastTimestamp}`, completedAt: new Date().toISOString() };
      await atomicWrite(path.join(assessmentsDir, `${saved.id}.json`), serialize(saved));
      return saved;
    }),
    getLatestAssessment: () => enqueue(async () => {
      let files;
      try { files = await fs.readdir(assessmentsDir); } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
      }
      const names = files.filter((name) => /^assessment-\d+\.json$/.test(name))
        .sort((a, b) => Number(b.slice(11, -5)) - Number(a.slice(11, -5)));
      for (const name of names) {
        const data = await readValid(path.join(assessmentsDir, name));
        if (data) return data;
      }
      return null;
    }),
  };
}

module.exports = { createStorage };
