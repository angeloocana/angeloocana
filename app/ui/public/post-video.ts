// The link still opens YouTube if JavaScript doesn't run, or if opened in a new tab.
let link = document.querySelector<HTMLAnchorElement>('.post-play')
let player = link?.parentElement?.querySelector('template')?.content.querySelector('iframe')
if (link && player) {
  link.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    link.replaceWith(player)
    player.focus()
  })
}
