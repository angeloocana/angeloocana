import type { Handle } from 'remix/component'

// Jump Over Jump screens built in HTML, so the board can play a real game (app/ui/public/joj-demo.tsx)
// instead of showing a cropped screenshot. Sizes use container units: they scale with the device.

/** The 8 x 8 board in its starting position: black on the top row, white on the bottom row. */
export function JojBoard() {
  return () => (
    <div class="jd-board" data-joj-demo aria-hidden="true">
      {/* the squares are a CSS checkerboard; the demo (ui/public/joj-demo.tsx) adds one cell per square
          to mark routes on, so the page doesn't carry 64 empty tags per board */}
      <div class="jd-squares" />
      {Array.from({ length: 16 }, (_, i) => {
        let black = i < 8
        let x = i % 8
        let y = black ? 0 : 7
        return <b key={i} class={`jd-piece ${black ? 'jd-black' : 'jd-white'}`} data-x={String(x)} data-y={String(y)} />
      })}
    </div>
  )
}

function Logo() {
  return () => (
    <p class="jd-logo">
      <i aria-hidden="true" />
      jump <span>over</span> jump
    </p>
  )
}

type ScreenProps = { title: [string, string]; play: string; label: string; lines: Record<string, string> }

/** The line above the board that says what the demo is doing. */
function Line(handle: Handle<{ lines: Record<string, string>; pill?: boolean }>) {
  return () => (
    <p class="jd-line">
      {handle.props.pill && <span class="jd-pill"><i />Ⅱ {handle.props.lines.pause}</span>}
      <span class="jd-turn" />
      <span class="jd-line-text">{handle.props.lines.goal}</span>
    </p>
  )
}

/** The desktop home page: the board playing on the left, the headline on the right. */
export function JojDesktop(handle: Handle<ScreenProps>) {
  return () => (
    <div class="jd-screen jd-desktop" role="img" aria-label={handle.props.label} data-lines={JSON.stringify(handle.props.lines)}>
      <header><Logo /><span class="jd-icons" aria-hidden="true"><i /><i /><i /><i /></span></header>
      <div class="jd-stage">
        <Line lines={handle.props.lines} pill />
        <JojBoard />
      </div>
      <div class="jd-copy">
        <p class="jd-title">{handle.props.title[0]}<br />{handle.props.title[1]}</p>
        <p class="jd-play">{handle.props.play} <span>→</span></p>
      </div>
    </div>
  )
}

/** The phone home page: logo, the board playing, the play button. */
export function JojPhone(handle: Handle<ScreenProps>) {
  return () => (
    <div class="jd-screen jd-phone" role="img" aria-label={handle.props.label} data-lines={JSON.stringify(handle.props.lines)}>
      <header><Logo /></header>
      <p class="jd-title">{handle.props.title[0]}{handle.props.title[1]}</p>
      <Line lines={handle.props.lines} />
      <JojBoard />
      <p class="jd-play">{handle.props.play} <span>→</span></p>
    </div>
  )
}
