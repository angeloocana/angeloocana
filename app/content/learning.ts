// School, courses, certifications and languages: the rest of the old résumés
// (legacy/resumes/ and legacy/src/data/resume/), one card each in the row after the career.
// Each entry's `pt` block holds the Portuguese version; anything missing there falls back to English.
// The smaller projects (content/projects.ts) use the same cards.

import type { Lang } from '../copy.ts'

export type Item = { title: string; body?: string; url?: string }

type Words = { title?: string; meta?: string; body?: string; items?: Item[] }

export type Study = {
  id: string
  title: string
  /** Years, when the résumés give them. 'Now' for one still going. */
  start?: string
  end?: string
  /** The full name, under the title. */
  meta?: string
  url?: string
  body?: string
  /** A short list on the card: courses, certificates, languages, projects. */
  items?: Item[]
  /** Technologies, shown as tags at the bottom of the card. */
  tech?: string[]
  pt?: Words
}

export const LEARNING: Study[] = [
  {
    id: 'unip',
    title: 'UNIP',
    start: '2013',
    end: '2014',
    meta: 'Universidade Paulista',
    url: 'https://www.unip.br',
    body: 'Analysis and systems development: the degree I started at FIAP, finished here in 2014.',
    pt: { body: 'Análise e Desenvolvimento de Sistemas: o curso que comecei na FIAP e concluí aqui em 2014.' },
  },
  {
    id: 'fiap',
    title: 'FIAP',
    start: '2010',
    end: '2011',
    meta: 'Faculdade de Informática e Administração Paulista',
    url: 'https://www.fiap.com.br',
    body: 'Where I started my degree in analysis and systems development.',
    pt: { body: 'Onde comecei a faculdade de Análise e Desenvolvimento de Sistemas.' },
  },
  {
    id: 'itb',
    title: 'ITB · FIEB',
    start: '2007',
    end: '2009',
    meta: 'Instituto Técnico de Barueri',
    body: 'A technical course in web design, with an emphasis on digital media.',
    pt: { body: 'Curso técnico de Web Design com ênfase em mídias digitais.' },
  },
  {
    id: 'pluralsight',
    title: 'Pluralsight',
    start: '2012',
    meta: 'Design and technology courses',
    url: 'https://app.pluralsight.com/profile/ocanaangelo',
    body: 'Online courses ever since. A few from the early years:',
    items: [
      { title: 'ASP.NET MVC 4 Fundamentals' },
      { title: 'Build Your Own Application Framework with ASP.NET MVC 5' },
      { title: 'AngularJS: Get Started' },
      { title: 'Domain-Driven Design Fundamentals' },
      { title: 'Introduction to Ruby on Rails 3' },
    ],
    pt: { meta: 'Cursos de design e tecnologia', body: 'Cursos online desde então. Alguns dos primeiros anos:' },
  },
  {
    id: 'online',
    title: 'Online learning',
    body: 'Besides Pluralsight, I keep learning from:',
    items: [
      { title: 'egghead.io', url: 'https://egghead.io' },
      { title: 'Frontend Masters', body: 'Now master.dev', url: 'https://master.dev' },
      { title: 'O’Reilly', url: 'https://www.oreilly.com' },
      { title: 'Udemy', url: 'https://www.udemy.com' },
      { title: 'Brilliant', url: 'https://brilliant.org' },
      { title: 'YouTube', body: 'Tech videos, every day' },
    ],
    pt: {
      title: 'Aprendendo online',
      body: 'Além da Pluralsight, sigo aprendendo com:',
      items: [
        { title: 'egghead.io', url: 'https://egghead.io' },
        { title: 'Frontend Masters', body: 'Agora master.dev', url: 'https://master.dev' },
        { title: 'O’Reilly', url: 'https://www.oreilly.com' },
        { title: 'Udemy', url: 'https://www.udemy.com' },
        { title: 'Brilliant', url: 'https://brilliant.org' },
        { title: 'YouTube', body: 'Vídeos de tecnologia, todo dia' },
      ],
    },
  },
  {
    id: 'english',
    title: 'Inglês 200h',
    start: '2008',
    end: '2009',
    meta: 'AMPM · Aliança Mundial Idiomas',
    url: 'https://www.ingles200h.com',
    body: 'A 200-hour intensive English course.',
    pt: { body: 'Um curso intensivo de inglês de 200 horas.' },
  },
  {
    id: 'certificates',
    title: 'Certificates',
    items: [
      { title: 'FIAP Certified System Developer' },
      { title: 'Desenvolvedor .NET 5 Estrelas', body: 'Microsoft’s five-star .NET developer program.' },
      { title: 'Workshop MSDN Visual Studio 2010', body: 'Microsoft' },
      { title: 'Certificado de Qualificação Profissional em Programação de Computadores', body: 'A professional qualification in computer programming.' },
    ],
    pt: {
      title: 'Certificados',
      items: [
        { title: 'FIAP Certified System Developer' },
        { title: 'Desenvolvedor .NET 5 Estrelas', body: 'O programa de desenvolvedores .NET da Microsoft.' },
        { title: 'Workshop MSDN Visual Studio 2010', body: 'Microsoft' },
        { title: 'Certificado de Qualificação Profissional em Programação de Computadores' },
      ],
    },
  },
  {
    id: 'languages',
    title: 'Languages',
    items: [
      { title: 'Portuguese', body: 'Native' },
      { title: 'English', body: 'Fluent' },
      { title: 'Spanish', body: 'Proficient' },
      { title: 'French', body: 'Basic' },
    ],
    pt: {
      title: 'Idiomas',
      items: [
        { title: 'Português', body: 'Nativo' },
        { title: 'Inglês', body: 'Fluente' },
        { title: 'Espanhol', body: 'Avançado' },
        { title: 'Francês', body: 'Básico' },
      ],
    },
  },
]

/** Cards in one language: the `pt` block wins where it has a value. */
export function cardsFor(list: Study[], lang: Lang): Study[] {
  if (lang === 'en') return list
  return list.map((study) => ({
    ...study,
    title: study.pt?.title ?? study.title,
    meta: study.pt?.meta ?? study.meta,
    body: study.pt?.body ?? study.body,
    items: study.pt?.items ?? study.items,
  }))
}

export const learningFor = (lang: Lang) => cardsFor(LEARNING, lang)
