import type { Page } from 'playwright'

// Collects every CSP violation the page reports, as "directive: blocked URI".
export async function watchCspViolations(page: Page) {
  let violations: string[] = []
  await page.exposeFunction('captureViolation', (directive: string, uri: string) => violations.push(`${directive}: ${uri}`))
  await page.addInitScript(() => {
    let capture = (window as Window & { captureViolation?: (directive: string, uri: string) => void }).captureViolation
    document.addEventListener('securitypolicyviolation', (event) => capture?.(event.effectiveDirective, event.blockedURI))
  })
  return violations
}
