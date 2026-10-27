import type { Handle, RemixNode } from 'remix/component'

// Device frames drawn in CSS (public/styles/devices.css) around real app screens.
// Screens are plain <img>/<video>; several images in one <Screens> cross-fade in a loop.

type DeviceProps = { children?: RemixNode; class?: string; style?: string; label?: string; tag?: string }

function Frame(handle: Handle<DeviceProps & { kind: string; extra?: RemixNode }>) {
  return () => {
    let { children, class: className = '', extra, kind, label, style, tag } = handle.props
    return (
      <figure class={`dev dev-${kind} ${className}`} style={style} aria-label={label}>
        {extra}
        <div class="dev-body">
          <div class="dev-screen">{children}</div>
          <i class="dev-sensor" aria-hidden="true" />
        </div>
        {tag && <figcaption class="dev-tag">{tag}</figcaption>}
      </figure>
    )
  }
}

export function IPhone(handle: Handle<DeviceProps>) {
  return () => <Frame {...handle.props} kind="iphone" />
}

export function Pixel(handle: Handle<DeviceProps>) {
  return () => <Frame {...handle.props} kind="pixel" />
}

export function IPad(handle: Handle<DeviceProps>) {
  return () => <Frame {...handle.props} kind="ipad" />
}

// Watches are drawn as SVG (case, glass, crown, band) at real proportions; the screen sits
// on top in HTML so screenshots and video stay sharp. Coordinates live in a 200 x 400 box.
function WatchBand(handle: Handle<{ id: string; left: number; right: number; holes?: boolean }>) {
  return () => {
    let { holes, id, left, right } = handle.props
    return (
      <>
        <path
          fill={`url(#${id}-band)`}
          mask={`url(#${id}-fade)`}
          d={`M${left + 6} 0 H${right - 6} Q${right - 2} 0 ${right - 2} 8 L${right + 2} 118 H${left - 2} L${left + 2} 8 Q${left + 2} 0 ${left + 6} 0 Z`}
        />
        <path
          fill={`url(#${id}-band)`}
          mask={`url(#${id}-fade)`}
          d={`M${left - 2} 282 H${right + 2} L${right - 2} 392 Q${right - 2} 400 ${right - 6} 400 H${left + 6} Q${left + 2} 400 ${left + 2} 392 Z`}
        />
        {holes &&
          [318, 336, 354, 372].map((y) => <circle key={y} cx="100" cy={y} r="2.8" fill="#0b0c0e" stroke="#3a3d43" stroke-width="0.6" />)}
        <rect x={left - 2} y="104" width={right - left + 4} height="12" fill="#0b0c0e" />
        <rect x={left - 2} y="284" width={right - left + 4} height="12" fill="#0b0c0e" />
      </>
    )
  }
}

function WatchDefs(handle: Handle<{ id: string }>) {
  return () => {
    let id = handle.props.id
    return (
      <defs>
        <linearGradient id={`${id}-band`} x1="0" x2="1">
          <stop offset="0" stop-color="#15161a" />
          <stop offset="0.5" stop-color="#2c2f35" />
          <stop offset="1" stop-color="#15161a" />
        </linearGradient>
        <linearGradient id={`${id}-fadeg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#000" />
          <stop offset="0.16" stop-color="#fff" />
          <stop offset="0.84" stop-color="#fff" />
          <stop offset="1" stop-color="#000" />
        </linearGradient>
        <mask id={`${id}-fade`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="400">
          <rect width="200" height="400" fill={`url(#${id}-fadeg)`} />
        </mask>
        <linearGradient id={`${id}-case`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#5a5e66" />
          <stop offset="0.35" stop-color="#25272c" />
          <stop offset="0.7" stop-color="#1a1b1f" />
          <stop offset="1" stop-color="#43464d" />
        </linearGradient>
        <linearGradient id={`${id}-crown`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#6e737b" />
          <stop offset="0.5" stop-color="#d5d9df" />
          <stop offset="1" stop-color="#5d6168" />
        </linearGradient>
        <pattern id={`${id}-ridges`} width="2.2" height="400" patternUnits="userSpaceOnUse">
          <rect width="1" height="400" fill="#000" opacity="0.28" />
        </pattern>
        <radialGradient id={`${id}-glass`} cx="0.3" cy="0.2" r="0.9">
          <stop offset="0" stop-color="#1a1b1e" />
          <stop offset="1" stop-color="#030304" />
        </radialGradient>
      </defs>
    )
  }
}

// Apple Watch (46 mm, midnight aluminium, sport band), drawn like a product shot: crisp band
// with rounded ends, a rounded case with a lit rim, a black border round the display, and the
// digital crown. The display is 120 x 146.5 in this 200 x 400 box: the screenshots' own shape.
export function AppleWatch(handle: Handle<DeviceProps>) {
  let id = `aw${Math.random().toString(36).slice(2, 7)}`
  return () => {
    let { children, class: className = '', label, style, tag } = handle.props
    return (
      <figure class={`dev dev-watch ${className}`} style={style} aria-label={label}>
        <svg class="dev-art" viewBox="0 0 200 400" aria-hidden="true">
          <defs>
            <linearGradient id={`${id}-band`} x1="0" x2="1">
              <stop offset="0" stop-color="#14161a" />
              <stop offset="0.12" stop-color="#22262c" />
              <stop offset="0.5" stop-color="#2b3037" />
              <stop offset="0.88" stop-color="#22262c" />
              <stop offset="1" stop-color="#121418" />
            </linearGradient>
            <linearGradient id={`${id}-tuck`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#000" stop-opacity="0" />
              <stop offset="1" stop-color="#000" stop-opacity="0.55" />
            </linearGradient>
            <linearGradient id={`${id}-case`} x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0" stop-color="#3b3f46" />
              <stop offset="0.5" stop-color="#25282d" />
              <stop offset="1" stop-color="#1b1d21" />
            </linearGradient>
            <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#c4c9d0" />
              <stop offset="0.35" stop-color="#5c6168" />
              <stop offset="0.7" stop-color="#2c2f34" />
              <stop offset="1" stop-color="#7d828a" />
            </linearGradient>
            <linearGradient id={`${id}-crown`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stop-color="#3a3d43" />
              <stop offset="0.5" stop-color="#9fa4ab" />
              <stop offset="1" stop-color="#2e3136" />
            </linearGradient>
            <pattern id={`${id}-ridges`} width="200" height="2.2" patternUnits="userSpaceOnUse">
              <rect width="200" height="0.9" fill="#000" opacity="0.4" />
            </pattern>
          </defs>
          {/* sport band: two straps with rounded ends, tucked under the case */}
          <path fill={`url(#${id}-band)`} d="M50 36 Q50 16 70 16 H130 Q150 16 150 36 V136 H50 Z" />
          <path fill={`url(#${id}-band)`} d="M50 270 H150 V366 Q150 386 130 386 H70 Q50 386 50 366 Z" />
          <path d="M51 38 Q51 17 70 17 H130 Q149 17 149 38 M51 364 Q51 385 70 385 H130 Q149 385 149 364" fill="none" stroke="#fff" stroke-opacity="0.07" />
          {/* the case's shadow on the band, where the straps tuck in */}
          <rect x="50" y="98" width="100" height="22" fill={`url(#${id}-tuck)`} />
          <rect x="50" y="282" width="100" height="22" fill={`url(#${id}-tuck)`} transform="rotate(180 100 293)" />
          {/* digital crown with ridges and its red ring, and the side button below it */}
          <rect x="168" y="148" width="15" height="34" rx="4.5" fill={`url(#${id}-crown)`} />
          <rect x="168" y="148" width="15" height="34" rx="4.5" fill={`url(#${id}-ridges)`} />
          <rect x="168" y="152" width="2.6" height="26" rx="1.2" fill="#b8312b" />
          <rect x="169" y="198" width="7" height="34" rx="3" fill="#24272b" stroke="#5f646b" stroke-width="0.7" />
          {/* case: a lit rim around a rounded aluminium body */}
          <rect x="26" y="116" width="148" height="176" rx="46" fill={`url(#${id}-rim)`} />
          <rect x="27.6" y="117.6" width="144.8" height="172.8" rx="44.4" fill={`url(#${id}-case)`} />
          {/* black glass: a thin border all round the display */}
          <rect x="32" y="122" width="136" height="164" rx="40" fill="#000" />
          <rect x="32.5" y="122.5" width="135" height="163" rx="39.5" fill="none" stroke="#fff" stroke-opacity="0.06" />
        </svg>
        <div class="dev-screen">{children}</div>
        <span class="watch-glare" aria-hidden="true" />
        {tag && <figcaption class="dev-tag">{tag}</figcaption>}
      </figure>
    )
  }
}

export function WearWatch(handle: Handle<DeviceProps>) {
  let id = `wo${Math.random().toString(36).slice(2, 7)}`
  return () => {
    let { children, class: className = '', label, style, tag } = handle.props
    return (
      <figure class={`dev dev-wear ${className}`} style={style} aria-label={label}>
        <svg class="dev-art" viewBox="0 0 200 400" aria-hidden="true">
          <WatchDefs id={id} />
          <WatchBand id={id} left={52} right={148} />
          <rect x="175" y="170" width="13" height="26" rx="5" fill={`url(#${id}-crown)`} />
          <rect x="175" y="170" width="13" height="26" rx="5" fill={`url(#${id}-ridges)`} />
          <rect x="174" y="210" width="9" height="20" rx="4" fill="#4a4d54" />
          <circle cx="100" cy="200" r="80" fill={`url(#${id}-case)`} />
          <circle cx="100" cy="200" r="79.4" fill="none" stroke="#a7acb4" stroke-opacity="0.7" stroke-width="1.2" />
          <circle cx="100" cy="200" r="76" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="2.5" />
          <circle cx="100" cy="200" r="72" fill={`url(#${id}-glass)`} />
        </svg>
        <div class="dev-screen">{children}</div>
        {tag && <figcaption class="dev-tag">{tag}</figcaption>}
      </figure>
    )
  }
}

export function Laptop(handle: Handle<DeviceProps>) {
  return () => (
    <Frame {...handle.props} kind="laptop" extra={<i class="dev-base" aria-hidden="true" />} />
  )
}

/** One or more screenshots; the first is shown without JS, the rest cross-fade when cycled. */
export function Screens(handle: Handle<{ srcs: string[]; alt: string; position?: string }>) {
  return () => {
    let { alt, position, srcs } = handle.props
    return (
      <div class="screens" data-cycle={srcs.length > 1 ? '' : undefined}>
        {srcs.map((src, i) => (
          <img
            key={src}
            class={i === 0 ? 'screen on' : 'screen'}
            src={src}
            alt={i === 0 ? alt : ''}
            aria-hidden={i === 0 ? undefined : 'true'}
            loading="lazy"
            decoding="async"
            style={position ? `object-position:${position}` : undefined}
          />
        ))}
      </div>
    )
  }
}
