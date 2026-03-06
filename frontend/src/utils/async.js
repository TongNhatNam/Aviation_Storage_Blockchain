export async function mapWithConcurrency(items, concurrency, mapper) {
  const list = Array.isArray(items) ? items : [];
  const limit = Math.max(1, Number(concurrency) || 1);
  const results = new Array(list.length);
  let nextIndex = 0;

  async function worker() {
    for (;;) {
      const i = nextIndex;
      nextIndex += 1;
      if (i >= list.length) return;
      results[i] = await mapper(list[i], i);
    }
  }

  const workers = new Array(Math.min(limit, list.length)).fill(0).map(() => worker());
  await Promise.all(workers);
  return results;
}

