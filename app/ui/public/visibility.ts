// For current visibility, not one-shot work triggered by any crossing (such as preloading).
export function withLatestIntersections(onEntry: (entry: IntersectionObserverEntry) => void) {
  return (entries: IntersectionObserverEntry[]) => {
    // The browser queues samples in order and can deliver several for the same target at once.
    let latest = new Map<Element, IntersectionObserverEntry>()
    for (let entry of entries) latest.set(entry.target, entry)
    for (let entry of latest.values()) onEntry(entry)
  }
}
