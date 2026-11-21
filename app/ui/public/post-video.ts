// Without this script, the card remains a normal link to the video on YouTube.
let link = document.querySelector<HTMLAnchorElement>('.post-play')
let player = link?.parentElement?.querySelector('template')?.content.querySelector('iframe')
if (link && player) {
  let play = document.createElement('button')
  play.type = 'button'
  play.className = link.className
  play.append(...link.childNodes)
  play.addEventListener('click', () => {
    play.replaceWith(player)
    player.focus()
  })
  link.replaceWith(play)
}
