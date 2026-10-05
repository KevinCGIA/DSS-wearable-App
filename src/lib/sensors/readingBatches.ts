export type Sample = { t: number; v: number };
export type ReadingBatch = {
  id: string;
  deviceId: string;
  deviceName: string | null;
  platform: 'ios' | 'android';
  type: 'heart_rate' | 'steps';
  source: 'ble' | 'test';
  samples: Sample[];
  legacy: Sample | null;
};
export type BatchInput = Omit<ReadingBatch, 'id' | 'samples' | 'legacy'>;
type State = { open: ReadingBatch[]; pending: ReadingBatch[]; lastLegacy: Record<string, number> };
type Dependencies = {
  id: () => string;
  save: (state: string) => Promise<void>;
  write: (batch: ReadingBatch) => Promise<void>;
  onError: (error: Error) => void;
};
export const MAX_BATCH_SAMPLES = 500;
export const MAX_QUEUED_SAMPLES = 100000;
const keyOf = (batch: BatchInput) => `${batch.platform}:${batch.deviceId}:${batch.type}:${batch.source}`;

// IDs and payloads are persisted before upload; replay is an idempotent set.
export class ReadingBatchQueue {
  private state: State = { open: [], pending: [], lastLegacy: {} };
  private saving = Promise.resolve();
  private inFlight = new Set<string>();
  private stopped = false;
  private deps: Dependencies;
  constructor(deps: Dependencies) { this.deps = deps; }

  restore(json: string | null) {
    if (!json) return;
    const value = JSON.parse(json) as State;
    if (!Array.isArray(value.open) || !Array.isArray(value.pending) || !value.lastLegacy) throw new Error('Saved reading queue is invalid. Recording has stopped.');
    for (const batch of [...value.open, ...value.pending]) {
      if (!batch.id || !Array.isArray(batch.samples) || !batch.samples.every((s) => Number.isFinite(s.t) && Number.isFinite(s.v))) {
        throw new Error('Saved reading queue is invalid. Recording has stopped.');
      }
    }
    this.state = value;
  }

  batches(): ReadingBatch[] { return [...this.state.pending, ...this.state.open]; }

  add(input: BatchInput, sample: Sample): { id: string; index: number } {
    if (this.stopped) throw new Error('Recording is not active.');
    if (!Number.isFinite(sample.t) || !Number.isFinite(sample.v)) throw new Error('Invalid sensor reading.');
    const count = this.batches().reduce((sum, batch) => sum + batch.samples.length, 0);
    if (count >= MAX_QUEUED_SAMPLES) throw new Error('The saved-reading queue is full. Recording stopped; reconnect after the queue has synced.');
    const key = keyOf(input);
    let batch = this.state.open.find((item) => keyOf(item) === key);
    if (!batch) {
      batch = { ...input, id: this.deps.id(), samples: [], legacy: null };
      this.state.open.push(batch);
    }
    batch.samples.push(sample);
    const result = { id: batch.id, index: batch.samples.length - 1 };
    if (batch.samples.length >= MAX_BATCH_SAMPLES) this.seal(batch);
    return result;
  }

  private seal(batch: ReadingBatch) {
    if (!batch.samples.length) return;
    const key = keyOf(batch);
    const latest = batch.samples[batch.samples.length - 1];
    if (this.state.lastLegacy[key] === undefined || latest.t - this.state.lastLegacy[key] >= 60000) {
      batch.legacy = latest;
      this.state.lastLegacy[key] = latest.t;
    }
    this.state.open = this.state.open.filter((item) => item !== batch);
    this.state.pending.push(batch);
  }

  checkpoint(): Promise<void> {
    const json = JSON.stringify(this.state);
    const saved = this.saving.catch(() => undefined).then(() => this.deps.save(json));
    this.saving = saved;
    return saved;
  }

  async flush(deviceId?: string) {
    for (const batch of [...this.state.open]) if (!deviceId || batch.deviceId === deviceId) this.seal(batch);
    const ready = [...this.state.pending];
    await this.checkpoint();
    if (this.stopped) return;
    for (const batch of ready) {
      if (this.inFlight.has(batch.id)) continue;
      this.inFlight.add(batch.id);
      void this.deps.write(batch).then(async () => {
        if (this.stopped) return;
        this.state.pending = this.state.pending.filter((item) => item.id !== batch.id);
        await this.checkpoint();
      }).catch((error) => this.deps.onError(error as Error)).finally(() => this.inFlight.delete(batch.id));
    }
  }

  pause() { this.stopped = true; }
  stop() { this.pause(); return this.checkpoint(); }
}
