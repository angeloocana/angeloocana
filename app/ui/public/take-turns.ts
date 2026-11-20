// The clips' order, for the server (content/clips.ts homeOrder) and the browser's shuffle (rails/clips.ts):
// strongest first, but a hobby waits until two others have had a turn. `after` are the ones already placed
// (the starred clips), which count as the last turns. One pass per pick, no sorting.
export function takeTurns<T>(items: T[], rank: (item: T) => number, cat: (item: T) => string, after: T[] = []): T[] {
  let pool = items.map((item) => ({ item, rank: rank(item) }))
  let order: T[] = []
  let recent = after.slice(-2).map(cat)
  while (pool.length) {
    let best = 0
    let score = (i: number) => pool[i].rank - (recent.includes(cat(pool[i].item)) ? 10 : 0)
    for (let i = 1; i < pool.length; i++) if (score(i) > score(best)) best = i
    let [{ item }] = pool.splice(best, 1)
    order.push(item)
    recent = [...recent, cat(item)].slice(-2)
  }
  return order
}
