// Minimal localStorage mock for zustand persist in Node
class LocalStorageMock {
  private store: Record<string, string> = {};
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] ?? null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  key(index: number) { return Object.keys(this.store)[index] ?? null; }
  get length() { return Object.keys(this.store).length; }
}

// @ts-ignore
if (typeof globalThis.localStorage === 'undefined') {
  // @ts-ignore
  globalThis.localStorage = new LocalStorageMock();
}


