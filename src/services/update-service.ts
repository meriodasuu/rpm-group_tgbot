export interface ProcessedUpdateStore { has(id: number): Promise<boolean>; add(id: number): Promise<void>; }
export class InMemoryProcessedUpdates implements ProcessedUpdateStore { private readonly ids = new Set<number>(); async has(id: number) { return this.ids.has(id); } async add(id: number) { this.ids.add(id); } }
export class UpdateService { constructor(private readonly store: ProcessedUpdateStore) {} async process(id: number, action: () => Promise<void>): Promise<boolean> { if (await this.store.has(id)) return false; await action(); await this.store.add(id); return true; } }
