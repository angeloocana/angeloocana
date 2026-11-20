import type { Handle } from 'remix/component'

import { GITHUB, projectsFor } from '../../content/projects.ts'
import type { Copy, Lang } from '../../copy.ts'
import { AppleWatch, IPad, IPhone, Laptop, Pixel, Screens, WearWatch } from '../devices.tsx'
import { JojDesktop, JojPhone } from '../joj-screens.tsx'
import { COLORS, sampleTiles } from '../public/pool-tiles-domain.ts'
import { Card, kicker, M, Row, studyCard, TitleLink } from './shared.tsx'

// Personal projects: track2.fit, Jump Over Jump and Tic Tac Toe AI, a row each, then More projects.
export function Projects(handle: Handle<{ lang: Lang; t: Copy; nav: (href: string) => string }>) {
  return () => {
    let { lang, nav, t } = handle.props
    let projects = projectsFor(lang)
    return (
      <div id="projects" data-chapter>
        <Row id="track2fit" class="row-t2f" label="track2.fit" t={t.rail} arrows={t.rail.t2f} next={{ href: '#jumpoverjump', label: 'Jump Over Jump' }}>
          {/* the hero card: what it is, and every device it runs on, before any scrolling */}
          <li class="slide intro intro-wide intro-t2f">
            <div class="intro-text">
              <p class="cin-kicker">{kicker(t.t2f.kickerFirst)}</p>
              {/* its two phrases ("Train hard." / "Log easy."), each kept on one line */}
              <h2>{t.t2f.intro.title.split(/(?<=\.) /).map((phrase) => <span key={phrase} class="phrase">{phrase}</span>)}</h2>
              <p>{t.t2f.intro.body}</p>
              <p class="cap-ctas">
                <a class="cin-btn" href="https://track2.fit">{t.t2f.open} <span aria-hidden="true">→</span></a>
                <span class="cin-soon">{t.t2f.soon}</span>
              </p>
            </div>
            <div class="intro-visual hv-t2f">
              <Laptop class="hv hv-laptop" label={t.t2f.web}>
                <Screens near srcs={[`${M}/t2f/desktop.webp`]} alt={t.t2f.webAlt} />
              </Laptop>
              <IPhone class="hv hv-phone" label={t.t2f.iphone}>
                <Screens near srcs={['session', 'home', 'history', 'records'].map((s) => `${M}/t2f/phone-${s}.webp`)} alt={t.t2f.iphoneAlt} />
              </IPhone>
              <AppleWatch class="hv hv-watch" label={t.t2f.watch}>
                <Screens near srcs={['log-set', 'rest', 'record', 'go'].map((s) => `${M}/t2f/watch-${s}.webp`)} alt={t.t2f.watchAlt} />
              </AppleWatch>
            </div>
          </li>
          <Card class="card-phone" title={t.t2f.cards.phone.title} body={t.t2f.cards.phone.body}>
            <IPhone class="c-dev" label={t.t2f.iphone}>
              <Screens near srcs={['home', 'session', 'history', 'body', 'records'].map((s) => `${M}/t2f/phone-${s}.webp`)} alt={t.t2f.iphoneAlt} />
            </IPhone>
          </Card>
          <Card class="card-watch" title={t.t2f.cards.watch.title} body={t.t2f.cards.watch.body}>
            <AppleWatch class="c-dev" label={t.t2f.watch}>
              <Screens near srcs={['go', 'log-set', 'rest', 'record'].map((s) => `${M}/t2f/watch-${s}.webp`)} alt={t.t2f.watchAlt} />
            </AppleWatch>
          </Card>
          <Card class="card-ipad" title={t.t2f.cards.ipad.title} body={t.t2f.cards.ipad.body}>
            <IPad class="c-dev" label={t.t2f.ipad}>
              <Screens near srcs={[`${M}/t2f/ipad-history.webp`]} alt={t.t2f.ipadAlt} />
            </IPad>
          </Card>
          <Card class="card-laptop" title={t.t2f.cards.web.title} body={t.t2f.cards.web.body}>
            <Laptop class="c-dev" label={t.t2f.web}>
              <Screens near srcs={[`${M}/t2f/desktop.webp`]} alt={t.t2f.webAlt} />
            </Laptop>
          </Card>
          <Card class="card-sync" title={t.t2f.cards.sync.title} body={t.t2f.cards.sync.body}>
            <svg class="sync-art" viewBox="0 0 240 200" aria-hidden="true">
              <path class="sync-line" id="sl-1" d="M40 156 Q 60 90 120 58" />
              <path class="sync-line" id="sl-2" d="M120 156 L 120 58" />
              <path class="sync-line" id="sl-3" d="M200 156 Q 180 90 120 58" />
              {['#sl-1', '#sl-2', '#sl-3'].map((id, i) => (
                <circle key={id} class="sync-pulse" r="4">
                  <animateMotion dur={`${1.8 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.5}s`}>
                    <mpath href={id} />
                  </animateMotion>
                </circle>
              ))}
              <g class="sync-cloud"><rect x="80" y="20" width="80" height="36" rx="18" /><text x="121" y="42.5">{t.t2f.diagram.cloud}</text></g>
              <g class="sync-node"><rect x="8" y="156" width="64" height="32" rx="9" /><text x="40.5" y="176">{t.t2f.diagram.watch}</text></g>
              <g class="sync-node"><rect x="88" y="156" width="64" height="32" rx="9" /><text x="120.5" y="176">{t.t2f.diagram.phone}</text></g>
              <g class="sync-node"><rect x="168" y="156" width="64" height="32" rx="9" /><text x="200.5" y="176">{t.t2f.diagram.web}</text></g>
            </svg>
          </Card>
          <Card class="card-soon" title={t.t2f.cards.soon.title} body={t.t2f.cards.soon.body}>
            <div class="pair">
              <Pixel class="c-dev" label={t.t2f.android}>
                <div class="soon-screen"><b>TRACK<sup>2</sup>.FIT</b><span>Android</span><small>{t.t2f.androidSoon}</small></div>
              </Pixel>
              <WearWatch class="c-dev" label={t.t2f.wear}>
                {/* the file waits in data-src until the video first comes on screen (rails.tsx): with a
                    <source>, phones fetched it on load, rows before it was near */}
                <video data-autoplay muted loop playsInline preload="none" aria-hidden="true" data-src={`${M}/t2f/wear.mp4`} />
              </WearWatch>
            </div>
          </Card>
        </Row>

        <Row id="jumpoverjump" class="row-joj" label="Jump Over Jump" t={t.rail} arrows={t.rail.joj} next={{ href: '#tictactoe', label: 'Tic Tac Toe AI' }}>
          <li class="slide intro intro-wide intro-joj">
            <div class="intro-text">
              <p class="cin-kicker">{kicker(t.joj.kickerFirst)}</p>
              <h2>{t.joj.title[0]}<em>{t.joj.title[1]}</em></h2>
              <p>{t.joj.body}</p>
              <p class="intro-note">{t.joj.title2}</p>
              <p class="cap-ctas">
                <a class="cin-btn cin-btn-joj" href="https://jumpoverjump.com">{t.joj.play} <span aria-hidden="true">→</span></a>
                <span class="cin-soon">{t.t2f.soon}</span>
              </p>
            </div>
            <div class="intro-visual hv-joj">
              <Laptop class="hv hv-laptop" label={t.joj.desktop}>
                <JojDesktop title={t.joj.title as [string, string]} play={t.joj.play} label={t.joj.demo} lines={t.joj.lines} />
              </Laptop>
              <IPhone class="hv hv-phone" label={t.joj.iphone}>
                <JojPhone title={t.joj.title as [string, string]} play={t.joj.play} label={t.joj.demo} lines={t.joj.lines} />
              </IPhone>
            </div>
          </li>
          <Card class="card-bots" title={t.joj.cards.bots.title} body={t.joj.cards.bots.body}>
            <ol class="bots">
              {t.joj.bots.map(([name, hint, level]) => (
                <li key={name} class={name === 'Neural' ? 'bot-neural' : ''}>
                  <b>{name}</b>
                  <small>{hint}</small>
                  <span class="bot-level" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((n) => <i key={n} class={n <= level ? 'on' : ''} />)}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
          <Card class="card-online" title={t.joj.cards.online.title} body={t.joj.cards.online.body}>
            <div class="online-art">
              <IPhone class="c-dev" label={t.joj.iphone}>
                <JojPhone title={t.joj.title as [string, string]} play={t.joj.play} label={t.joj.demo} lines={t.joj.lines} />
              </IPhone>
              <p class="room-chip room-copied"><i aria-hidden="true">✓</i>{t.joj.room.copied}</p>
              <p class="room-chip room-vs"><b>{t.joj.room.you}</b> vs <b>{t.joj.room.friend}</b></p>
            </div>
          </Card>
          <Card class="card-ranks" title={t.joj.cards.ranks.title} body={t.joj.cards.ranks.body}>
            <div class="ranks" aria-hidden="true">
              <p class="ranks-tabs">{t.joj.ranks.tabs.map((tab, i) => <span key={tab} class={i === 0 ? 'on' : ''}>{tab}</span>)}</p>
              <ol>
                <li class="ranks-you"><span>1</span><b>{t.joj.ranks.you}</b><i>🏆</i></li>
                {/* the three strongest bots, by the names the bot list gives them (Mestre, Especialista in PT) */}
                {t.joj.bots.slice(-3).reverse().map(([bot], i) => (
                  <li key={bot}><span>{i + 2}</span><b>{bot}</b><small>{t.joj.ranks.ai}</small></li>
                ))}
              </ol>
              <p class="ranks-points">{t.joj.ranks.points}</p>
            </div>
          </Card>
          <Card class="card-learn" title={t.joj.cards.learn.title} body={t.joj.cards.learn.body}>
            <ul class="learn-chips">
              {t.joj.learn.map((chip) => <li key={chip}>{chip}</li>)}
            </ul>
          </Card>
          <li class="slide intro intro-reel">
            <p class="cin-kicker">{kicker(t.reel.kicker)}</p>
            <h2>{t.reel.title[0]}<em>{t.reel.title[1]}</em></h2>
            <p>{t.reel.body}</p>
            <p class="intro-note">{t.joj.body2}</p>
          </li>
          {t.reel.frames.map((frame) => (
            <li key={frame.year + frame.tech} class={`slide reel-frame rf-${frame.kind}`}>
              <div class="rf-shot">
                {frame.kind === 'git' && (
                  <pre class="rf-code">{`$ git log --reverse --date=short
2014-10-25  Init
2014-10-27  Board
          …
c_sharp_phaser/JumpOverJump`}</pre>
                )}
                {frame.kind === 'logo' && <img src={`${M}/joj/2015-logo.webp`} alt={t.reel.logoAlt} loading="lazy" />}
                {frame.kind === 'board' && <img src={`${M}/joj/2016-board.webp`} alt={t.reel.boardAlt} loading="lazy" />}
                {frame.kind === 'terminal' && (
                  <pre class="rf-code rf-term">{`  a b c d e f g h
8 ● ● ● ● ● ● ● ●
7 · · · · · · · ·
6 · · · ● · · · ·
5 · · · · · · · ·
4 · · ○ · · · · ·
3 · · · · · · · ·
2 · · · · · · · ·
1 ○ ○ · ○ ○ ○ ○ ○
> c1 → c4`}</pre>
                )}
                {frame.kind === 'code' && (
                  <pre class="rf-code">{`JumpOverJump/
├── bend/   # massively parallel
├── c/      # tiny + fast
├── typescript/
├── c_sharp_angularjs/
└── c_sharp_phaser/`}</pre>
                )}
                {frame.kind === 'neural' && <img src={`${M}/joj/2026-neural.webp`} alt={t.reel.neuralAlt} loading="lazy" />}
              </div>
              <p class="rf-year">{frame.year}</p>
              <h3>{frame.tech}</h3>
              <p>{frame.text}</p>
            </li>
          ))}
        </Row>

        {/* Tic Tac Toe AI: the 2017 game, playable here (ui/public/tic-tac-toe.tsx runs it) */}
        <Row id="tictactoe" class="row-ttt" label="Tic Tac Toe AI" t={t.rail} arrows={t.rail.ttt} next={{ href: '#more-projects', label: t.more.label }}>
          {/* the board sits in the first card, beside the story on wide screens and above it on phones,
              so it's playable before any sideways scrolling */}
          <li class="slide intro intro-wide intro-ttt">
            <div class="intro-text">
              <p class="cin-kicker">{kicker(t.ttt.kicker)}</p>
              <h2>{t.ttt.title[0]}<em>{t.ttt.title[1]}</em>{t.ttt.title[2]}</h2>
              <p>{t.ttt.body}</p>
            </div>
            <div class="intro-visual ttt-play">
              <div class="ttt" role="group" aria-label={t.ttt.game} data-ttt data-words={JSON.stringify(t.ttt.words)}>
                <p class="ttt-score">
                  <small>{t.ttt.you}</small> <b data-ttt-human>0</b> <i>×</i> <b data-ttt-ai>0</b> <small>{t.ttt.ai}</small>
                </p>
                <div class="ttt-board">
                  <canvas aria-hidden="true" />
                  <div class="ttt-cells">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <button key={i} type="button" data-ttt-cell={i} aria-disabled="true" />)}
                  </div>
                </div>
                <div class="ttt-foot">
                  <p class="ttt-status" data-ttt-status aria-live="polite" />
                  <button type="button" class="cin-btn ttt-new" data-ttt-new>{t.ttt.newGame}</button>
                </div>
              </div>
            </div>
          </li>
          <li class="slide job ttt-story">
            <p class="job-label">{t.ttt.builtWith}</p>
            <h3>{t.ttt.storyTitle}</h3>
            <p class="job-built">{t.ttt.note}</p>
            <p class="ttt-ported">{t.ttt.ported}</p>
            <p class="cap-ctas">
              <a class="cin-btn" href="https://github.com/angeloocana/tic-tac-toe-ai">{t.ttt.code} <span aria-hidden="true">→</span></a>
            </p>
            <ul class="job-tech" aria-label={t.ttt.builtWith}>
              {t.ttt.stack.map((tech) => <li key={tech}>{tech}</li>)}
            </ul>
          </li>
          <li class="slide job ttt-log">
            <p class="job-label">{t.ttt.log.kicker} · 2017</p>
            <h3>{t.ttt.log.title}</h3>
            <ul class="job-highlights">
              {t.ttt.log.items.map((item) => (
                <li key={item.date}>
                  <b>{item.date}</b>
                  <small>{item.text}</small>
                </li>
              ))}
            </ul>
          </li>
        </Row>

        {/* More projects: open source and smaller builds (content/projects.ts), then GitHub for the rest */}
        <Row
          id="more-projects"
          class="row-more"
          label={t.more.label}
          t={t.rail}
          arrows={t.rail.projects}
          next={{ href: '#outside', label: nav('#outside') }}
          introClass="intro-career"
          intro={<>
            <p class="cin-kicker">{kicker(t.more.kicker)}</p>
            <h2>{t.more.title[0]}<em>{t.more.title[1]}</em>{t.more.title[2]}</h2>
            <p>{t.more.body}</p>
            <p class="cap-ctas">
              <a class="cin-btn" href={GITHUB}>{t.more.github} <span aria-hidden="true">→</span></a>
            </p>
          </>}
        >
          {/* the pool tile designer plays second, after the best-known one */}
          {studyCard(projects[0], t)}
          <PoolCard t={t} />
          {projects.slice(1).map((project) => studyCard(project, t))}
        </Row>
      </div>
    )
  }
}

// The pool tile designer (2017), playable in its card: the story on the left, the tiles on the right (under
// it on phones). The page renders the opening design, and ui/public/pool-tiles.tsx makes it paint.
function PoolCard(handle: Handle<{ t: Copy }>) {
  return () => {
    let { t } = handle.props
    let tiles = sampleTiles()
    let { nRows, nCols } = tiles.size
    let words = { cell: t.pool.cell, names: t.pool.names }
    let sizes = [['nRows', t.pool.rows, nRows], ['nCols', t.pool.cols, nCols]] as const
    return (
      <li class="slide job study pool-card">
        <p class="job-years"><span>2017</span></p>
        <h3><TitleLink href="https://github.com/angeloocana/pool-tile-designer" text={t.pool.title} /></h3>
        <p class="job-meta">{t.pool.meta}</p>
        <p class="job-built">{t.pool.body} <span class="pool-drag">{t.pool.drag}</span></p>
        <p class="pool-note">{t.pool.note}</p>
        <ul class="job-tech" aria-label={t.pool.builtWith}>
          {t.pool.stack.map((tech) => <li key={tech}>{tech}</li>)}
        </ul>
        <div class="pool" data-pool data-words={JSON.stringify(words)}>
          <div class="pool-colors" role="group" aria-label={t.pool.colors}>
            {COLORS.map((color, i) => (
              <button key={color} type="button" data-pool-color={color} aria-pressed={i === 0 ? 'true' : 'false'} aria-label={t.pool.names[i]} title={t.pool.names[i]} style={`--c:${color}`} />
            ))}
          </div>
          {/* a frame of fixed height, so resizing the tiles never moves the buttons under them. The
              162 tiles are drawn by ui/public/pool-tiles.tsx (it rebuilds the grid on load anyway): as
              buttons in the page they were a sixth of its weight. */}
          <div class="pool-board">
            <div class="pool-frame">
              <div class="pool-grid" role="group" aria-label={t.pool.tiles} data-pool-grid style={`--rows:${nRows};--cols:${nCols}`} />
            </div>
            {/* full screen on a phone, when the board is wider than the screen (pool-tiles.tsx) */}
            <p class="pool-swipe" aria-hidden="true">{t.pool.swipe} <span>→</span></p>
          </div>
          <div class="pool-foot">
            {sizes.map(([key, label, value]) => (
              <span key={key} class="pool-step">
                <b>{label}</b>
                <button type="button" data-pool-step={key} data-by="-1" aria-label={t.pool.fewer[key]}>−</button>
                <output data-pool-out={key}>{value}</output>
                <button type="button" data-pool-step={key} data-by="1" aria-label={t.pool.more[key]}>+</button>
              </span>
            ))}
            <button type="button" class="cin-btn pool-clear" data-pool-clear>{t.pool.clear}</button>
          </div>
          {/* phones: the tiles are small in the card, so this opens the designer full screen, tiles 36px
              (pool-tiles.tsx moves it into the dialog below and back) */}
          <button type="button" class="cin-btn cin-btn-ghost pool-big" data-pool-big>{t.pool.bigger}</button>
          <p class="pool-name" aria-hidden="true">{t.pool.title}</p>
          <button type="button" class="cin-btn pool-done" data-pool-done>{t.pool.done}</button>
        </div>
        <dialog class="pool-dialog" aria-label={t.pool.title} data-pool-dialog />
      </li>
    )
  }
}
