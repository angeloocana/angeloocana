// Every company, newest first. This is the file to edit: rewrite `built` in your own words,
// and fill in `role`, `tech` and dates where they say "to confirm". Each job's `pt` block holds
// the Portuguese version; anything missing there falls back to English.
// The older entries are translated from the 2018 résumé (legacy/src/data/resume/jobsAndClients.js).

import type { Lang } from '../copy.ts'

export type Highlight = { title: string; body: string; url?: string }

type Words = { role?: string; place?: string; built?: string; highlights?: Highlight[] }

export type Job = {
  id: string
  company: string
  /** Shown under the company name; leave '' until you decide. */
  role: string
  start: string
  end: string
  place: string
  url?: string
  /** What you built there. '' renders a "story coming soon" line. */
  built: string
  tech: string[]
  /** Notable clients or products, shown as a short list. */
  clients?: string[]
  /** true while the dates or text still need your review. */
  draft?: boolean
  /** Gets the large "Today" treatment, with room for highlights. */
  featured?: boolean
  /** The things you are proudest of: what you built, the impact, the tech. `url` links a public page about it. */
  highlights?: Highlight[]
  /** Portuguese text for this job. */
  pt?: Words
}

export const CAREER: Job[] = [
  {
    id: 'shopify',
    company: 'Shopify',
    role: 'Staff software engineer',
    start: '2021',
    end: 'Now',
    place: 'Ottawa, Canada',
    url: 'https://www.shopify.com',
    built:
      'On every team I joined I was the team lead: I championed the projects, designed their architecture and brought together the people they needed, across Shopify teams and partner companies like Amazon, to ship them for millions of merchants.',
    tech: ['Ruby', 'TypeScript', 'Rust', 'GraphQL', 'React', 'Remix', 'MySQL', 'BigQuery'],
    featured: true,
    // in the order I worked on them
    highlights: [
      {
        title: 'Rollouts',
        body: 'Launch theme, checkout and account changes on a schedule, roll them out gradually, or run them as A/B experiments against the live store.',
        url: 'https://help.shopify.com/en/manual/markets/rollouts',
      },
      {
        title: 'SimGym',
        body: 'AI shoppers that visit a store before real buyers do. They browse, add to cart and say what confused them, so merchants can compare a new theme with the live one before shipping it.',
        url: 'https://apps.shopify.com/simgym',
      },
      {
        title: 'Delivery promise',
        body: 'Delivery dates buyers can trust, on product pages and in checkout, worked out from where the stock is, where the buyer is and real transit times.',
        url: 'https://help.shopify.com/manual/shipping/shopify-fulfillment-network/sfn-overview/delivery-promise',
      },
      {
        title: 'Buy with Prime',
        body: 'The Amazon integration that brings Prime delivery options to Prime members in Shopify checkout, paying with their Amazon or Shop Pay wallet.',
        url: 'https://help.shopify.com/en/manual/payments/accelerated-checkouts/amazonpay/buy-with-prime',
      },
      {
        title: 'Shopify Fulfillment Network',
        body: 'Orders, then Growth and Activation: getting merchants’ orders into Shopify’s warehouses, and helping new merchants get set up to ship with the network.',
      },
    ],
    pt: {
      role: 'Engenheiro de software staff',
      built:
        'Em todos os times em que entrei fui o líder técnico: defendi os projetos, desenhei a arquitetura e reuni as pessoas de que eles precisavam, entre times da Shopify e empresas parceiras como a Amazon, para entregá-los a milhões de lojistas.',
      highlights: [
        {
          title: 'Rollouts',
          body: 'Lançar mudanças no tema, no checkout e nas contas com data marcada, liberar aos poucos ou rodar como experimento A/B contra a loja atual.',
          url: 'https://help.shopify.com/pt-BR/manual/markets/rollouts',
        },
        {
          title: 'SimGym',
          body: 'Compradores de IA que visitam a loja antes dos clientes reais. Eles navegam, colocam no carrinho e contam o que os confundiu, para o lojista comparar um tema novo com o atual antes de publicar.',
          url: 'https://apps.shopify.com/simgym',
        },
        {
          title: 'Promessa de entrega',
          body: 'Datas de entrega confiáveis, na página do produto e no checkout, calculadas a partir de onde está o estoque, onde está o comprador e dos tempos reais de transporte.',
          url: 'https://help.shopify.com/manual/shipping/shopify-fulfillment-network/sfn-overview/delivery-promise',
        },
        {
          title: 'Buy with Prime',
          body: 'A integração com a Amazon que leva as opções de entrega Prime aos membros Prime no checkout da Shopify, pagando com a carteira da Amazon ou do Shop Pay.',
          url: 'https://help.shopify.com/en/manual/payments/accelerated-checkouts/amazonpay/buy-with-prime',
        },
        {
          title: 'Shopify Fulfillment Network',
          body: 'Pedidos, e depois Growth e Activation: levar os pedidos dos lojistas aos armazéns da Shopify e ajudar novos lojistas a começarem a enviar pela rede.',
        },
      ],
    },
  },
  {
    id: 'kinaxis',
    company: 'Kinaxis',
    role: 'Principal developer',
    start: '2018',
    end: '2021',
    place: 'Ottawa, Canada',
    url: 'https://www.kinaxis.com',
    built:
      'A large TypeScript and React web app for supply chain planning. I designed its monorepo, hunted down performance problems and memory leaks, and wrote our own state management library, inspired by Redux, Reselect and Recoil.',
    tech: ['TypeScript', 'React', 'Redux', 'RxJS', 'Angular', 'C#', '.NET MVC', 'Jest', 'Jasmine', 'TestCafe', 'webpack', 'styled-components', 'Sass', 'Ramda'],
    highlights: [
      { title: 'Our own state library', body: 'Inspired by Redux, Reselect and Recoil, built for the size and speed the app needed.' },
      { title: 'Reviews and mentoring', body: 'More than 100 pull requests reviewed a month, and always around to help the team.' },
      { title: 'Tech talks', body: 'Regular internal talks, and close work with UX and product to shape new features.' },
    ],
    pt: {
      role: 'Desenvolvedor principal',
      built:
        'Uma grande aplicação web em TypeScript e React para planejamento de cadeia de suprimentos. Desenhei o monorepo, cacei problemas de performance e vazamentos de memória, e escrevi nossa própria biblioteca de gerenciamento de estado, inspirada em Redux, Reselect e Recoil.',
      highlights: [
        { title: 'Nossa própria biblioteca de estado', body: 'Inspirada em Redux, Reselect e Recoil, feita para o tamanho e a velocidade que a aplicação precisava.' },
        { title: 'Revisões e mentoria', body: 'Mais de 100 pull requests revisados por mês, e sempre por perto para ajudar o time.' },
        { title: 'Tech talks', body: 'Palestras internas frequentes, e trabalho próximo com UX e produto para desenhar novas funcionalidades.' },
      ],
    },
  },
  {
    id: 'freelance',
    company: 'Freelance',
    role: 'Independent developer',
    start: '2007',
    end: '2018',
    place: '',
    built:
      'Systems and websites for SMS messaging, gyms, e-commerce and companies, alongside every full-time job. Clients and projects included Staffgeist, Hive, Empório Viña Real, APM and the first Jump Over Jump.',
    tech: ['C#', '.NET MVC', 'AngularJS', 'TypeScript', 'Node.js', 'SQL Server'],
    pt: {
      role: 'Desenvolvedor independente',
      built:
        'Sistemas e sites para envio de SMS, academias, e-commerce e empresas, em paralelo a todos os empregos. Entre os clientes e projetos: Staffgeist, Hive, Empório Viña Real, APM e o primeiro Jump Over Jump.',
    },
    draft: true,
  },
  {
    id: 'pol',
    company: 'Total On Demand · POL',
    role: '',
    start: '2011',
    end: '2015',
    place: 'São Paulo, Brazil · one company, renamed',
    built:
      'Incentive-campaign and rewards platforms for big brands: a social network for each campaign, games, goals and results, quizzes and photo galleries. Then POL, an e-commerce platform where people redeem their points for products from retail partners. I built its search engine on Lucene.',
    tech: ['C#', '.NET MVC', 'Web API', 'WebForms', 'WCF', 'Entity Framework', 'Lucene', 'RabbitMQ', 'SQL Server', 'PostgreSQL', 'jQuery', 'DDD', 'TDD'],
    clients: ['Vivo · Telefônica', 'BASF', 'Volkswagen', 'Sony', 'L’Oréal', 'B2W', 'Magazine Luiza', 'Walmart', 'Casas Bahia'],
    pt: {
      place: 'São Paulo, Brasil · a mesma empresa, renomeada',
      built:
        'Plataformas de campanhas de incentivo e recompensas para grandes marcas: uma rede social para cada campanha, jogos, metas e resultados, quizzes e galerias de fotos. Depois, a POL, um e-commerce onde as pessoas trocam pontos por produtos de varejistas parceiros. Construí o motor de busca dela com Lucene.',
    },
    draft: true,
  },
  {
    id: 'empresario',
    company: 'Empresário Cobrança',
    role: '',
    start: '2010',
    end: '2011',
    place: 'São Paulo, Brazil',
    built:
      'A debt-negotiation system for people and companies across Brazil, with complex financial calculations, barcode generation and imports of millions of records. Also access control with photo capture, and internal HR, finance and CRM systems.',
    tech: ['C#', 'WCF', 'WPF', 'WebForms', 'Windows Services', 'Ext.NET', 'SQL Server'],
    pt: {
      built:
        'Um sistema de negociação de dívidas para pessoas e empresas de todo o Brasil, com cálculos financeiros complexos, geração de boletos e importação de milhões de registros. Também controle de acesso com captura de foto e sistemas internos de RH, financeiro e CRM.',
    },
    draft: true,
  },
  {
    id: 'mediaw',
    company: 'Media W',
    role: '',
    start: '2010',
    end: '2010',
    place: 'São Paulo, Brazil',
    built: 'Point-of-sale software for the Cadê o Nenê stores, talking to fiscal printers and card machines.',
    tech: ['C#', 'Windows Forms', 'MySQL'],
    pt: { built: 'Software de frente de caixa para as lojas Cadê o Nenê, integrado a impressoras fiscais e máquinas de cartão.' },
    draft: true,
  },
  {
    id: 'upgrade',
    company: 'Upgrade Consultoria',
    role: '',
    start: '2008',
    end: '2010',
    place: 'São Paulo, Brazil',
    built:
      'PriManager, a web system for managing construction projects for clients like Eletropaulo and CDHU; an infrastructure system for São Paulo state schools (FDE); and an in-house ERP and CRM.',
    tech: ['C#', '.NET', 'Telerik', 'Web Services', 'Flash · ActionScript', 'Google Maps API', 'SQL Server'],
    pt: {
      built:
        'PriManager, um sistema web de gestão de obras para clientes como Eletropaulo e CDHU; um sistema de infraestrutura para as escolas estaduais de São Paulo (FDE); e um ERP e CRM internos.',
    },
    draft: true,
  },
]

const COUNTRIES_PT: Record<string, string> = { Canada: 'Canadá', Brazil: 'Brasil' }

/** The career list in one language: the `pt` block wins, and country names translate on their own. */
export function careerFor(lang: Lang): Job[] {
  if (lang === 'en') return CAREER
  return CAREER.map((job) => ({
    ...job,
    role: job.pt?.role ?? job.role,
    place: job.pt?.place ?? job.place.replace(/Canada|Brazil/g, (c) => COUNTRIES_PT[c]),
    built: job.pt?.built ?? job.built,
    highlights: job.pt?.highlights ?? job.highlights,
  }))
}
