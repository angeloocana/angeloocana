// Every company, newest first. This is the file to edit: rewrite `built` in your own words,
// and fill in `role`, `tech` and dates where they say "to confirm". Each job's `pt` block holds
// the Portuguese version; anything missing there falls back to English.
// Everything before Shopify comes from the old résumés (legacy/resumes/, 2015–2021) and the 2018 site's
// résumé data (legacy/src/data/resume/). Education, courses and languages are in content/learning.ts.

import type { Lang } from '../copy.ts'

export type Highlight = { title: string; body: string; url?: string }

type Words = { chapter?: string; role?: string; place?: string; built?: string; highlights?: Highlight[] }

export type Job = {
  id: string
  company: string
  /** A shorter name for the intro's list of jobs, when the full one doesn't fit on a line there. */
  short?: string
  /** Tells apart two stretches at the same company, years apart: shown after its name. */
  chapter?: string
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
      'The web app for RapidResponse, Kinaxis’s supply chain planning platform, in TypeScript and React. I helped move it off AngularJS, designed its monorepo, hunted down performance problems and memory leaks, and wrote our own state management library, inspired by Redux, Reselect and Recoil.',
    tech: ['TypeScript', 'React', 'Redux', 'RxJS', 'Angular', 'C#', '.NET MVC', 'Node.js', 'Jest', 'Jasmine', 'TestCafe', 'TDD', 'webpack', 'Gulp', 'styled-components', 'Sass', 'Ramda', 'Azure'],
    highlights: [
      { title: 'Our own state library', body: 'Inspired by Redux, Reselect and Recoil, built for the size and speed the app needed.' },
      { title: 'Reviews and mentoring', body: 'More than 100 pull requests reviewed a month, and always around to help the team.' },
      { title: 'Tech talks', body: 'Regular internal talks, and close work with UX and product to shape new features.' },
    ],
    pt: {
      role: 'Desenvolvedor principal',
      built:
        'A aplicação web do RapidResponse, a plataforma de planejamento de cadeia de suprimentos da Kinaxis, em TypeScript e React. Ajudei a migrá-la do AngularJS, desenhei o monorepo, cacei problemas de performance e vazamentos de memória, e escrevi nossa própria biblioteca de gerenciamento de estado, inspirada em Redux, Reselect e Recoil.',
      highlights: [
        { title: 'Nossa própria biblioteca de estado', body: 'Inspirada em Redux, Reselect e Recoil, feita para o tamanho e a velocidade que a aplicação precisava.' },
        { title: 'Revisões e mentoria', body: 'Mais de 100 pull requests revisados por mês, e sempre por perto para ajudar o time.' },
        { title: 'Tech talks', body: 'Palestras internas frequentes, e trabalho próximo com UX e produto para desenhar novas funcionalidades.' },
      ],
    },
  },
  {
    id: 'freelance-comeback',
    company: 'Freelance',
    chapter: 'the comeback',
    role: 'Independent developer',
    start: '2015',
    end: '2018',
    place: '',
    built:
      'Back on my own after POL: web and mobile apps for startups and investors, websites, more work for POL, and my own board game.',
    tech: [
      'TypeScript', 'AngularJS', 'Ionic', 'Cordova', 'React Native', 'Redux', 'GraphQL', 'Node.js', 'D3', 'C#', '.NET MVC', 'WCF',
      'MongoDB', 'PostgreSQL', 'Redis', 'Elasticsearch', 'SQL Server', 'Docker', 'Kubernetes', 'Azure',
    ],
    // clients roughly in the order I worked for them; my own game last
    highlights: [
      { title: 'Innovative', body: 'A website for Innovative and BBM Brasil, in HTML, CSS and JavaScript.' },
      { title: 'Staffgeist', body: 'A web and mobile app in Angular and Ionic, on C#, MongoDB and Elasticsearch in Azure.' },
      { title: 'Hive', body: 'Project management software I spent a few months building for a group of investors, with Angular, Ionic, D3 and C#.' },
      { title: 'Empório Viña Real', body: 'The store’s website, in plain HTML, CSS and JavaScript.' },
      { title: 'APM', body: 'For the Associação Paulista de Medicina, with Sorocabacom, in C#, .NET MVC, WCF and SQL Server.', url: 'https://www.apm.org.br' },
      {
        title: 'budbuds.us',
        body: 'A US startup that helped growers monitor and control their plants’ growth with QR codes. Built with React Native, GraphQL and Node.js. No longer online.',
      },
      { title: 'POL', body: 'More work on the rewards platform I helped build, this time as a freelancer.' },
      {
        title: 'Jump Over Jump',
        body: 'My own board game, on the side: the C# and AngularJS version that lived on jumpoverjump.com for years, then its TypeScript rewrites.',
      },
    ],
    pt: {
      chapter: 'a volta',
      role: 'Desenvolvedor independente',
      built:
        'De volta ao trabalho independente depois da POL: apps web e mobile para startups e investidores, sites, mais trabalho para a POL e o meu próprio jogo de tabuleiro.',
      highlights: [
        { title: 'Innovative', body: 'Um site para a Innovative e a BBM Brasil, em HTML, CSS e JavaScript.' },
        { title: 'Staffgeist', body: 'Um app web e mobile em Angular e Ionic, com C#, MongoDB e Elasticsearch no Azure.' },
        { title: 'Hive', body: 'Um software de gestão de projetos que passei alguns meses construindo para um grupo de investidores, com Angular, Ionic, D3 e C#.' },
        { title: 'Empório Viña Real', body: 'O site da loja, em HTML, CSS e JavaScript puros.' },
        { title: 'APM', body: 'Para a Associação Paulista de Medicina, com a Sorocabacom, em C#, .NET MVC, WCF e SQL Server.', url: 'https://www.apm.org.br' },
        {
          title: 'budbuds.us',
          body: 'Uma startup americana que ajudava produtores a acompanhar e controlar o crescimento das plantas com QR codes. Feito com React Native, GraphQL e Node.js. Não está mais no ar.',
        },
        { title: 'POL', body: 'Mais trabalho na plataforma de recompensas que ajudei a construir, desta vez como freelancer.' },
        {
          title: 'Jump Over Jump',
          body: 'Meu próprio jogo de tabuleiro, por fora: a versão em C# e AngularJS que ficou anos no ar em jumpoverjump.com, e depois as reescritas em TypeScript.',
        },
      ],
    },
    draft: true,
  },
  {
    id: 'pol',
    company: 'Total On Demand · Peela · POL',
    short: 'Total On Demand · POL',
    role: 'Lead senior C# developer',
    start: '2011',
    end: '2015',
    place: 'São Paulo, Brazil · one company, renamed twice',
    built:
      'Incentive-campaign and rewards platforms for big brands, then POL, our own e-commerce platform where people redeem the points they earn.',
    tech: [
      'C#', '.NET MVC', 'Web API', 'WebForms', 'WCF', 'Entity Framework', 'StructureMap', 'Lucene', 'Elasticsearch', 'RabbitMQ',
      'SQL Server', 'PostgreSQL', 'jQuery', 'Heroku', 'AWS', 'DDD', 'TDD', 'Scrum',
    ],
    highlights: [
      {
        title: 'Incentive campaigns',
        body: '5 to 8 a year, with 5 thousand to 9 million users: a social network for each campaign, games, goals and results, a news feed, quizzes and photo galleries.',
      },
      { title: 'Campaign clients', body: 'Vivo · Telefônica, BASF, Volkswagen, Sony, L’Oréal, Johnson, Net, FMC, FTD, Sky, Oi, BRF, Syngenta, Cury and Tenda.' },
      {
        title: 'POL · Prêmios Online',
        body: 'Our own e-commerce platform, connected to retail partners like B2W, Magazine Luiza, Walmart, Casas Bahia, FastShop and Avon. I built its search engine on Lucene.',
      },
      { title: 'Working with clients', body: 'Meeting clients to understand what they needed and plan the strategy for each campaign.' },
    ],
    pt: {
      role: 'Desenvolvedor C# sênior e líder técnico',
      place: 'São Paulo, Brasil · a mesma empresa, renomeada duas vezes',
      built:
        'Plataformas de campanhas de incentivo e recompensas para grandes marcas, e depois a POL, nosso próprio e-commerce onde as pessoas trocam os pontos que ganham.',
      highlights: [
        {
          title: 'Campanhas de incentivo',
          body: '5 a 8 por ano, de 5 mil a 9 milhões de usuários: uma rede social para cada campanha, jogos, metas e resultados, feed de notícias, quizzes e galerias de fotos.',
        },
        { title: 'Clientes das campanhas', body: 'Vivo · Telefônica, BASF, Volkswagen, Sony, L’Oréal, Johnson, Net, FMC, FTD, Sky, Oi, BRF, Syngenta, Cury e Tenda.' },
        {
          title: 'POL · Prêmios Online',
          body: 'Nosso próprio e-commerce, integrado a varejistas parceiros como B2W, Magazine Luiza, Walmart, Casas Bahia, FastShop e Avon. Construí o motor de busca dele com Lucene.',
        },
        { title: 'Perto dos clientes', body: 'Reuniões com os clientes para entender o que precisavam e definir a estratégia de cada campanha.' },
      ],
    },
    draft: true,
  },
  {
    id: 'empresario',
    company: 'Empresário Cobrança',
    role: 'Lead C# developer',
    start: '2010',
    end: '2011',
    place: 'São Paulo, Brazil',
    built:
      'Systems for a debt-collection company: debt negotiation for people and companies across Brazil, data imports, access control and internal tools.',
    tech: ['C#', 'WCF', 'WPF', 'WebForms', 'Windows Forms', 'Windows Services', 'Ext.NET', 'jQuery', 'SQL Server'],
    highlights: [
      {
        title: 'Debt negotiation',
        body: 'A web platform for negotiating the debts of people and companies across Brazil, with interest-rate algorithms and our own barcode generator for payment slips.',
      },
      { title: 'Millions of records', body: 'Imports that cleaned up millions of records in many file formats, and fast queries on a 500 GB SQL Server database.' },
      { title: 'Access control', body: 'Access control that takes a photo with a webcam, built in WPF.' },
      { title: 'Internal systems', body: 'HR, finance and CRM systems for the company itself.' },
    ],
    pt: {
      role: 'Desenvolvedor C# e líder técnico',
      built:
        'Sistemas para uma empresa de cobrança: negociação de dívidas de pessoas e empresas de todo o Brasil, importação de dados, controle de acesso e sistemas internos.',
      highlights: [
        {
          title: 'Negociação de dívidas',
          body: 'Uma plataforma web para negociar dívidas de pessoas físicas e jurídicas de todo o Brasil, com algoritmos de cálculo de juros e nosso próprio gerador de código de barras para boletos.',
        },
        { title: 'Milhões de registros', body: 'Importações que tratavam milhões de registros em diversos formatos de arquivo, e consultas rápidas num banco SQL Server de 500 GB.' },
        { title: 'Controle de acesso', body: 'Controle de acesso com captura de foto pela webcam, feito em WPF.' },
        { title: 'Sistemas internos', body: 'Sistemas de RH, financeiro e CRM para a própria empresa.' },
      ],
    },
    draft: true,
  },
  {
    id: 'mediaw',
    company: 'Media W',
    role: 'C# developer',
    start: '2010',
    end: '2010',
    place: 'São Paulo, Brazil',
    built:
      'PDV TED, point-of-sale software for the Cadê o Nenê stores, built to Brazil’s tax rules and talking to Bematech fiscal printers and card machines.',
    tech: ['C#', 'Windows Forms', 'MySQL'],
    pt: {
      role: 'Desenvolvedor C#',
      built:
        'PDV TED, software de frente de caixa para as lojas Cadê o Nenê, dentro das regras fiscais e integrado a impressoras fiscais e máquinas de cartão Bematech.',
    },
    draft: true,
  },
  {
    id: 'upgrade',
    company: 'Upgrade Consultoria',
    role: 'Junior C# developer',
    start: '2008',
    end: '2010',
    place: 'São Paulo, Brazil',
    built: 'Web systems for big construction projects and for São Paulo’s public schools, and the company’s own ERP and CRM.',
    tech: ['C#', '.NET', 'WebForms', 'Windows Forms', 'Windows Services', 'Telerik', 'Web Services', 'jQuery', 'Flash · ActionScript', 'Google Maps API', 'SQL Server'],
    highlights: [
      {
        title: 'PriManager',
        body: 'Sistema Pri’s web system for managing large construction projects, for clients like Eletropaulo and CDHU, and, in 2009, Mapa de Obras for AES Eletropaulo.',
      },
      {
        title: 'FDE',
        body: 'For the Fundação para o Desenvolvimento da Educação: a system to manage the infrastructure of São Paulo state’s public schools.',
        url: 'https://www.fde.sp.gov.br',
      },
      { title: 'ERP and CRM', body: 'Our own system for running the company: cash flow, clients, suppliers and the relationship with each.' },
    ],
    pt: {
      role: 'Desenvolvedor C# júnior',
      built: 'Sistemas web para grandes obras e para as escolas estaduais de São Paulo, e o ERP e CRM da própria empresa.',
      highlights: [
        {
          title: 'PriManager',
          body: 'O sistema web da Sistema Pri para gerenciar grandes obras, para clientes como Eletropaulo e CDHU, e, em 2009, o Mapa de Obras para a AES Eletropaulo.',
        },
        {
          title: 'FDE',
          body: 'Para a Fundação para o Desenvolvimento da Educação: um sistema para gerenciar a infraestrutura das escolas estaduais de São Paulo.',
          url: 'https://www.fde.sp.gov.br',
        },
        { title: 'ERP e CRM', body: 'Nosso sistema para tocar a empresa: fluxo de caixa, cadastro e acompanhamento de clientes e fornecedores.' },
      ],
    },
    draft: true,
  },
  {
    id: 'freelance-start',
    company: 'Freelance',
    chapter: 'the start',
    role: 'Independent developer',
    start: '2007',
    end: '2010',
    place: '',
    built:
      'Where it all started: my first websites and systems, for a church, a gym and local companies, then side work alongside my first jobs.',
    tech: ['PHP', 'MySQL', 'jQuery', 'Flash · ActionScript', 'Adobe Flex', 'VB.NET', 'MS Access', 'C#', 'ASP.NET MVC', 'SQL Server'],
    highlights: [
      { title: 'Academia Corpus S&A', body: 'Member sign-up and access control for the gym.' },
      {
        title: 'Igreja Cristã de Alphaville',
        body: 'Three websites, for the church, its youth group and its branch in Portugal, and a system to show song lyrics on the projector.',
      },
      { title: 'FRP Instalações', body: 'The company’s website, in PHP and MySQL.' },
      { title: 'RIS Security', body: 'The website for a security and automation company in Itapevi, near São Paulo.', url: 'https://rissecurity.com.br/' },
      { title: 'BBM Brasil', body: 'A system for sending SMS messages, in C#, ASP.NET MVC and SQL Server, built in 2009–10 alongside my job at Upgrade.' },
    ],
    pt: {
      chapter: 'o começo',
      role: 'Desenvolvedor independente',
      built:
        'Onde tudo começou: meus primeiros sites e sistemas, para uma igreja, uma academia e empresas da região, e depois trabalhos em paralelo aos primeiros empregos.',
      highlights: [
        { title: 'Academia Corpus S&A', body: 'Cadastro e controle de acesso dos alunos da academia.' },
        {
          title: 'Igreja Cristã de Alphaville',
          body: 'Três sites, o da igreja, o do grupo de jovens e o da igreja em Portugal, e um sistema para mostrar as letras das músicas no projetor.',
        },
        { title: 'FRP Instalações', body: 'O site da empresa, em PHP e MySQL.' },
        { title: 'RIS Security', body: 'O site de uma empresa de segurança e automação em Itapevi, na Grande São Paulo.', url: 'https://rissecurity.com.br/' },
        { title: 'BBM Brasil', body: 'Um sistema de envio de SMS, em C#, ASP.NET MVC e SQL Server, feito em 2009–10 em paralelo ao trabalho na Upgrade.' },
      ],
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
    chapter: job.pt?.chapter ?? job.chapter,
    role: job.pt?.role ?? job.role,
    place: job.pt?.place ?? job.place.replace(/Canada|Brazil/g, (c) => COUNTRIES_PT[c]),
    built: job.pt?.built ?? job.built,
    highlights: job.pt?.highlights ?? job.highlights,
  }))
}
