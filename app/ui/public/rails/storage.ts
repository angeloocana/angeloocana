// Web storage is optional: a browser that blocks it (private modes, strict cookie settings) throws on the
// first touch of sessionStorage or localStorage. Then nothing is remembered between visits, and the page
// works the same.
type Store = 'session' | 'local'

export function read(store: Store, key: string): string | null {
  try {
    return (store === 'session' ? sessionStorage : localStorage).getItem(key)
  } catch {
    return null
  }
}

export function write(store: Store, key: string, value: string) {
  try {
    ;(store === 'session' ? sessionStorage : localStorage).setItem(key, value)
  } catch {}
}
