// src/utils/loadTariffs.js
let tariffs;

export async function loadTariffs() {
  if (!tariffs) {
    const module = await import('./tariffs.json', { with: { type: 'json' } });
    tariffs = module.default;
  }
  return tariffs;
}
