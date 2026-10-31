// The smaller personal projects, after the three that have a row of their own (track2.fit, Jump Over
// Jump, Tic Tac Toe AI): one card each, in the Education row's card style. Only public repos; the row
// links to GitHub for everything else (exercises, forks, sites made for other people).
// Each entry's `pt` block holds the Portuguese version; anything missing there falls back to English.

import { SOCIALS } from '../content.ts'
import type { Lang } from '../copy.ts'
import { cardsFor, type Study } from './learning.ts'

/** github.com/angeloocana, where the row sends you for everything else. */
export const GITHUB = SOCIALS.find((s) => s.id === 'github')!.url
const GH = GITHUB

export const PROJECTS: Study[] = [
  {
    id: 'gatsby-plugin-i18n',
    title: 'gatsby-plugin-i18n',
    start: '2017',
    meta: 'Open source · a Gatsby plugin',
    url: `${GH}/gatsby-plugin-i18n`,
    body: 'A route for every language in a Gatsby site. Over 400 stars on GitHub, and still more than 10,000 downloads a month.',
    items: [
      { title: 'ptz-i18n', body: 'The helpers underneath, for any project.', url: `${GH}/ptz-i18n` },
      { title: 'gatsby-starter-default-i18n', body: 'A starter for a new multi-language site.', url: `${GH}/gatsby-starter-default-i18n` },
    ],
    tech: ['Gatsby', 'React', 'JavaScript'],
    pt: {
      meta: 'Open source · um plugin para Gatsby',
      body: 'Uma rota para cada idioma num site Gatsby. Mais de 400 estrelas no GitHub, e ainda mais de 10 mil downloads por mês.',
      items: [
        { title: 'ptz-i18n', body: 'As funções por baixo, para qualquer projeto.', url: `${GH}/ptz-i18n` },
        { title: 'gatsby-starter-default-i18n', body: 'Um ponto de partida para um site novo em vários idiomas.', url: `${GH}/gatsby-starter-default-i18n` },
      ],
    },
  },
  {
    id: 'polutz',
    title: 'Polutz',
    start: '2017',
    meta: 'Open source · shared modules',
    url: 'https://github.com/polutz/polutz',
    body: 'Open-source, reusable and tested modules to share between projects, in React, GraphQL and Node.js, built around domain-driven design. Two dozen packages, and Yeoman generators to start new ones.',
    tech: ['TypeScript', 'React', 'GraphQL', 'Node.js', 'MongoDB'],
    pt: {
      meta: 'Open source · módulos compartilhados',
      body: 'Módulos open source, reutilizáveis e testados, para compartilhar entre projetos, em React, GraphQL e Node.js, organizados com domain-driven design. Duas dúzias de pacotes, e geradores Yeoman para começar novos.',
    },
  },
  {
    id: 'this-site',
    title: 'This site',
    start: '2014',
    end: 'Now',
    meta: 'Three versions so far',
    items: [
      { title: 'angeloocana.com.br', body: '2014–15: my first site, in Angular and C#.' },
      { title: 'angeloocana.com in Gatsby', body: '2017: the second, in Gatsby, React and GraphQL, with gatsby-plugin-i18n for the languages.' },
      { title: 'angeloocana.com in Remix 3', body: '2026: this one, prerendered and served by Cloudflare. The code is on GitHub.', url: `${GH}/angeloocana` },
    ],
    pt: {
      title: 'Este site',
      meta: 'Três versões até agora',
      items: [
        { title: 'angeloocana.com.br', body: '2014–15: meu primeiro site, em Angular e C#.' },
        { title: 'angeloocana.com em Gatsby', body: '2017: o segundo, em Gatsby, React e GraphQL, com o gatsby-plugin-i18n para os idiomas.' },
        { title: 'angeloocana.com em Remix 3', body: '2026: este aqui, pré-renderizado e servido pela Cloudflare. O código está no GitHub.', url: `${GH}/angeloocana` },
      ],
    },
  },
  {
    id: 'small-builds',
    title: 'Small builds',
    start: '2017',
    end: '2025',
    items: [
      { title: 'Workout assistant', body: '2025: an MCP server that lets an AI log a workout, set by set.', url: `${GH}/workout` },
      { title: 'moon-nodes', body: '2018: is the moon ascending or descending? Any day to 2100.', url: `${GH}/moon-nodes` },
      { title: 'Pool tile designer', body: '2017: lay out a swimming pool’s tiles, in React and Redux.', url: 'https://pool-tile-designer.surge.sh' },
      { title: 'freecom.club', body: '2017: an open-source app for citizens to vote on local proposals.', url: `${GH}/freecomclub` },
    ],
    pt: {
      title: 'Projetos menores',
      items: [
        { title: 'Assistente de treino', body: '2025: um servidor MCP para uma IA registrar um treino, série por série.', url: `${GH}/workout` },
        { title: 'moon-nodes', body: '2018: a lua está ascendente ou descendente? Qualquer dia até 2100.', url: `${GH}/moon-nodes` },
        { title: 'Pool tile designer', body: '2017: monte os azulejos de uma piscina, em React e Redux.', url: 'https://pool-tile-designer.surge.sh' },
        { title: 'freecom.club', body: '2017: um app open source para cidadãos votarem nas propostas do bairro.', url: `${GH}/freecomclub` },
      ],
    },
  },
]

export const projectsFor = (lang: Lang) => cardsFor(PROJECTS, lang)
