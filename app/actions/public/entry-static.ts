import { run } from 'remix/component'

// The prerendered document supplies one complete import map before the client starts.
run({
  async loadModule(moduleUrl, exportName) {
    let mod = await import(moduleUrl)
    let Component = mod[exportName]
    if (typeof Component !== 'function') {
      throw new Error(`Unknown component: ${moduleUrl}#${exportName}`)
    }
    return Component
  },
})
