const { technologies } = require('./technologies');
const R = require('ramda');
const { getArray } = require('./getArray');
const { range, thisYear } = require('./time');

const t = technologies;

const jobsAndClients = {
  'Kinaxis': {
    slug: '/kinaxis/',
    date: {
      start: '2018-06-11',
      end: null,
    },
    img: '',
    link: 'https://www.kinaxis.com',
    description: {
      'pt': '',
      'en': '',
    },
    technologies: [
      t.js,
      t.cSharp,
      t.react,
      t.angular,
      t.typeScript,
      t.jasmine,
      t.jest,
      t.sass,
      t.nodejs,
      t.webpack,
      t.gulp,
      t.vscode,
      t.visualStudio,
      t.azure,
      t.netMvc,
    ],
    projects: [],
  },
  'Freelancer': {
    slug: '/freelancer/',
    date: {
      start: '2007-02-01',
      end: '2018-06-10',
    },
    img: '',
    link: 'https://angeloocana.com',
    description: {
      'pt': 'Desenvolvi sistemas e sites para: Envio de SMS, Academias, E-commerce, Sistes Institucionais, entre outros.',
      'en': '',
    },
    projects: [
      {
        name: 'Tic Tac Toe AI',
        slug: '/angeloocana/tic-tac-toe-ai/',
        img: 'tic-tac-toe-ai.jpg',
        isGame: true,
        years: range(2017, 2017),
        description: '',
        link: 'https://tic-tac-toe-ai.surge.sh',
        technologies: [
          t.react,
          t.gatsby,
          t.graphql,
          t.styledComponents,
          t.nodejs,
          t.html,
          t.css,
          t.js,
          t.vscode,
          t.jest,
          t.eslint,
          t.babel,
          t.surge
        ],
        clients: [
          {
            name: '',
            link: ''
          }
        ]
      },
      {
        name: 'angeloocana .com v2',
        slug: '/angeloocana/v2/react/',
        years: range(2017, thisYear),
        description: '',
        link: 'https://angeloocana.com',
        technologies: [
          t.gatsby,
          t.graphql,
          t.react,
          t.styledComponents,
          t.nodejs,
          t.html,
          t.css,
          t.js,
          t.vim,
          t.vscode,
          t.jest,
          t.eslint,
          t.babel,
          t.surge
        ],
        clients: [
          {
            name: '',
            link: ''
          }
        ]
      },
      {
        name: 'Staffgeist',
        slug: '/staffgeist/',
        years: range(2015, 2016),
        description: '',
        link: 'http://staffgeist.com',
        technologies: [
          t.angular,
          t.ionic,
          t.cordova,
          t.cSharp,
          t.typeScript,
          t.babel,
          t.gulp,
          t.html,
          t.css,
          t.js,
          t.vscode,
          t.visualStudio,
          t.jasmine,
          t.mongodb,
          t.azure
        ],
        clients: [
          {
            name: '',
            link: ''
          }
        ]
      },
      {
        name: 'Hive',
        slug: '/hive/novo-territorio/',
        years: range(2016, 2016),
        description: '',
        link: 'http://novoterritorio.azurewebsites.net/en-us/signIn',
        technologies: [
          t.angular,
          t.ionic,
          t.cordova,
          t.cSharp,
          t.typeScript,
          t.babel,
          t.gulp,
          t.html,
          t.css,
          t.js,
          t.vscode,
          t.visualStudio,
          t.jasmine,
          t.mongodb,
          t.azure
        ],
        clients: [
          {
            name: '',
            link: ''
          }
        ]
      },
      {
        name: 'Jump Over Jump',
        slug: '/jump-over-jump/v1/',
        isGame: true,
        img: 'jump-over-jump.png',
        years: range(2014, 2015),
        description: '',
        link: 'http://jumpoverjump.com',
        technologies: [
          t.angular,
          t.ionic,
          t.cordova,
          t.cSharp,
          t.typeScript,
          t.babel,
          t.gulp,
          t.html,
          t.css,
          t.js,
          t.vscode,
          t.visualStudio,
          t.jasmine,
          t.mongodb,
          t.azure
        ],
        clients: [
          {
            name: '',
            link: ''
          }
        ]
      },
      {
        name: 'angeloocana .com.br v1',
        slug: '/angeloocana/v1/angular/',
        years: range(2014, 2015),
        description: '',
        link: 'http://angeloocana.com.br/',
        technologies: [
          t.angular,
          t.cSharp,
          t.typeScript,
          t.babel,
          t.gulp,
          t.html,
          t.css,
          t.js,
          t.vscode,
          t.visualStudio,
          t.jasmine,
          t.azure
        ],
        clients: [
          {
            name: '',
            link: ''
          }
        ]
      },
      {
        name: 'Emporio Viña Real',
        slug: '/emporio-vina-real/',
        years: range(2017, 2017),
        description: '',
        link: 'https://www.emporiovinareal.com.br/',
        technologies: [
          t.html,
          t.css,
          t.js,
          t.vscode
        ],
        clients: [
          {
            name: '',
            link: ''
          }
        ]
      },
      {
        name: 'APM',
        slug: '/apm/',
        years: range(2017, 2017),
        description: '',
        link: 'http://associacaopaulistamedicina.org.br/',
        technologies: [
          t.cSharp,
          t.html,
          t.css,
          t.js,
          t.jquery,
          t.netMvc,
          t.wcf,
          t.sqlServer,
          t.visualStudio,
          t.entityFramework
        ],
        clients: [
          {
            name: 'APM',
            link: ''
          },
          {
            name: 'Sorocabacom',
            link: ''
          }
        ]
      },
      {
        name: 'SMS BBM Brasil',
        slug: '/sms-bbm-brasil/',
        years: range(2009, 2010),
        description: '',
        link: '',
        technologies: [
          t.cSharp,
          t.html,
          t.css,
          t.js,
          t.jquery,
          t.netMvc,
          t.sqlServer,
          t.visualStudio,
          t.structureMap,
          t.entityFramework
        ],
        clients: [
          {
            name: 'BBM Brasil',
            link: ''
          }
        ]
      },
      {
        name: 'Innovative',
        slug: '/innovative/',
        years: range(2015, 2015),
        description: '',
        link: 'http://www.innovative.com.br',
        technologies: [
          t.html,
          t.css,
          t.js,
          t.vscode
        ],
        clients: [
          {
            name: 'Innovative',
            link: ''
          },
          {
            name: 'BBM Brasil',
            link: ''
          }
        ]
      },
      {
        name: 'Igreja Cristã de Alphaville',
        slug: '/ica-igreja-crista-de-alphaville/',
        years: range(2007, 2008),
        description: '',
        link: '',
        technologies: [
          t.html,
          t.css,
          t.js,
          t.php,
          t.mySql,
          t.jquery,
          t.dreamWeaver,
          t.flash
        ],
        clients: [
          {
            name: '',
            link: ''
          }
        ]
      },
      {
        name: 'Igreja Cristã de Maia',
        slug: '/igreja-crista-de-maia/',
        years: range(2007, 2008),
        description: '',
        link: '',
        technologies: [
          t.adobeFlex
        ],
        clients: [
          {
            name: '',
            link: ''
          }
        ]
      },
      {
        name: 'FRP Instalações',
        slug: '/frp/',
        years: range(2008, 2008),
        description: '',
        link: '',
        technologies: [
          t.html,
          t.css,
          t.js,
          t.php,
          t.mySql,
          t.jquery,
          t.dreamWeaver,
          t.flash
        ],
        clients: [
          {
            name: '',
            link: ''
          }
        ]
      },
      //   {
      //     name: '',
      //     description: '',
      //     link: '',
      //     clients: [
      //       {
      //         name: '',
      //         link: ''
      //       }
      //     ]
      //   },
      {
        name: 'Cadastro e Acesso de alunos',
        slug: '/academia-corpus-santana/',
        years: range(2008, 2008),
        description: '',
        link: '',
        technologies: [
          t.php,
          t.html,
          t.css,
          t.js,
          t.jquery,
          t.mySql,
          t.dreamWeaver
        ],
        clients: [
          {
            name: 'Academia Corpus Santana',
            link: ''
          }
        ]
      },
    ]
  },
  'POL': {
    slug: '/pol/',
    date: {
      start: '2011-04-18',
      end: '2015-03-17'
    },
    img: 'pol.png',
    link: 'http://pol.com.br',
    needWhiteBg: true,
    description: `POL (Prêmios Online), plataforma de e-commerce para resgate de produtos / serviços através da pontuação adquirida na apuração das metas e resultados. Integração com parceiros B2W, Magazine Luiza, Walmart, Casas Bahia, FastShop, entre outros.
        
        Criação de Engine de busca utilizando Lucene.
        
        Principais Tecnologias: MVC, API, Jquery, Ajax, .NET 4.0 / 4.5 utilizando linguagem C#, Entity Framework, Migrations, UnitTest, Lucene, StructureMap, WebForms
        Principais Metodologias: Domain Driven Design, Test Driven Development, Scrum
        Banco de Dados: SQL Server (Gerenciamento, Criação de Querys, Stored Procedures, Functions, Views e Jobs)`,
    projects: [
      {
        name: 'POL',
        slug: '/pol-premios-online/',
        years: range(2011, 2015),
        description: '',
        link: null,
        clients: [
          {
            name: 'B2W',
            link: ''
          },
          {
            name: 'Magazine Luiza',
            link: ''
          },
          {
            name: 'Walmart',
            link: ''
          },
          {
            name: 'Avon',
            link: ''
          },
          {
            name: 'Casas Bahia',
            link: ''
          },
          {
            name: 'FastShop',
            link: ''
          }
        ],
        technologies: [
          t.cSharp,
          t.html,
          t.css,
          t.js,
          t.jquery,
          t.netMvc,
          t.postgres,
          t.webForms,
          t.wcf,
          t.sqlServer,
          t.visualStudio,
          t.lucene,
          t.rabbitmq,
          t.structureMap,
          t.entityFramework
        ]
      }
    ]
  },
  'Total On Demand': {
    slug: '/total-on-demand/',
    date: {
      start: '2011-04-18',
      end: '2015-03-17'
    },
    img: 'tod.png',
    link: 'http://www.totalondemand.com.br/',
    technologies: [
      t.cSharp,
      t.html,
      t.css,
      t.js,
      t.jquery,
      t.netMvc,
      t.webForms,
      t.wcf,
      t.sqlServer,
      t.visualStudio,
      t.structureMap,
      t.entityFramework
    ],
    description: `Desenvolvimento de sites para campanhas de incentivo, endomarketing e premiação online para os clientes Vivo|Telefonica, BASF, Net, Volkswagen, FMC, FTD, Sky, OI, BRF, Loreal, Johnson, Sony, Syngenta, Cury e Tenda. As campanhas possuíam uma base de participantes e os mesmos poderiam interagir entre si através de uma rede social, jogar, visualizar suas metas e resultados, feed de notícias, quiz, galeria de fotos, entre outras.`,
    projects: [
      {
        name: 'Campanhas de Incentivo',
        slug: '/campanhas-de-incentivo/',
        years: range(2011, 2015),
        description: 'Desenvolvimento de sites para campanhas de incentivo, endomarketing e premiação online para os clientes Vivo|Telefonica, BASF, Net, Volkswagen, FMC, FTD, Sky, OI, BRF, Loreal, Johnson, Sony, Syngenta, Cury e Tenda. As campanhas possuíam uma base de participantes e os mesmos poderiam interagir entre si através de uma rede social, jogar, visualizar suas metas e resultados, feed de notícias, quiz, galeria de fotos, entre outras.',
        link: null,
        clients: [
          {
            name: 'Telefonica',
            link: ''
          },
          {
            name: 'Vivo',
            link: ''
          },
          {
            name: 'BASF',
            link: ''
          },
          {
            name: 'Net',
            link: ''
          },
          {
            name: 'Volkswagen',
            link: ''
          },
          {
            name: 'FMC',
            link: ''
          },
          {
            name: 'Tenda',
            link: ''
          },
          {
            name: 'FTD',
            link: ''
          },
          {
            name: 'Sky',
            link: ''
          },
          {
            name: 'OI',
            link: ''
          },
          {
            name: 'BRF',
            link: ''
          },
          {
            name: 'Loreal',
            link: ''
          },
          {
            name: 'Johnson',
            link: ''
          },
          {
            name: 'Sony',
            link: ''
          },
          {
            name: 'Syngenta',
            link: ''
          },
          {
            name: 'Cury',
            link: ''
          }
        ]
      }
    ]
  },
  'Empresário Cobrança': {
    slug: '/empresario-cobranca/',
    date: {
      start: '2010-07-23',
      end: '2011-03-18'
    },
    img: 'empresario-cobranca.gif',
    link: 'http://www.empresariocobranca.com.br/',
    technologies: [
      t.cSharp,
      t.webForms,
      t.wpf,
      t.ext,
      t.html,
      t.css,
      t.js,
      t.jquery,
      t.sqlServer,
      t.visualStudio
    ],
    description: `Sistema para negociação de dívidas de pessoa física e jurídica de todo o Brasil, utilizando complexos cálculos financeiros, gerador do algoritmo do código de barras, business inteligence para importação e tratamento de milhões de registros em diversas extensões e formatação de arquivo.
    Sistema para controle de acesso com captura de foto utilizando WPF.
    Sistema de Recursos Humanos interno para os colaboradores.
    Sistema para controle financeiro e CRM
    
    Principais Tecnologias: WCF, WPF, NET 3.5 utilizando linguagem C#, WebForms, Windows Forms, Windows Services,  EXT.Net
    Banco de Dados: SQL Server (Criação de Querys, Stored Procedures, Functions, Views e Jobs com alta performance para suportar a grande massa de dados )`,
    projects: []
  },
  'Media W': {
    slug: '/media-w/',
    date: {
      start: '2010-06-14',
      end: '2010-07-22'
    },
    img: '',
    link: 'http://www.mediaw.com.br/',
    technologies: [
      t.cSharp,
      t.windowsForms,
      t.mySql,
      t.vs
    ],
    description: `Desenvolvimento de software para automação comercial PDV TED das lojas "Cadê o Nenê", impressora fiscal e máquina de cartão Bematech.
    
        Principais Tecnologias: .NET 3.5 utilizando linguagem C# para Windows Forms, Banco de Dados: MySQL`,
    projects: [
      {
        name: 'PDV TED',
        slug: '/pdv-ted/',
        years: range(2010, 2010),
        description: 'software para automação comercial PDV TED das lojas "Cadê o Nenê", impressora fiscal e máquina de cartão Bematech',
        link: null,
        clients: [
          {
            name: 'Cadê o Nenê',
            link: ''
          }
        ]
      }
    ]
  },
  'Upgrade Consultoria': {
    slug: '/upgrade-consultoria/',
    date: {
      start: '2008-10-28',
      end: '2010-06-11'
    },
    img: '',
    link: '',
    technologies: [
      t.cSharp,
      t.webForms,
      t.windowsForms,
      t.telerik,
      t.flash,
      t.html,
      t.css,
      t.js,
      t.jquery,
      t.sqlServer,
      t.visualStudio
    ],
    description: {
      'pt': `PriManager [Sistema de Gerenciamento de Obras da Sistema Pri]
        - Sistema web para cadastramento das obras para os principais clientes: Eletropaulo, CDHU, entre outros.
        
        FDE [Fundação para o Desenvolvimento da Educação]
        - Sistema para gerenciamento de infra-estrutura das escolas do Estado de São Paulo.
        
        ERP / CRM para controle de todas as operações da empresa: fluxo de caixa, cadastro e acompanhamento de relacionamento com clientes e fornecedores, entre outros módulos.
        
        Principais Tecnologias: .NET 2.0 / 3.5 utilizando linguagem C#, construção de aplicações web 2.0 com Telerik, Web Services, Windows Services, Flash / Action Script, Google Maps API, Banco de Dados: SQL Server 2005 / 2008`
    },
    projects: [
      {
        name: 'PriManager',
        slug: '/primanager/',
        years: range(2008, 2010),
        description: 'Sistema de Gerenciamento de Obras',
        link: 'http://www.sistemapri.com.br/en/primanager.html',
        clients: [
          {
            name: 'Sistema Pri',
            link: 'http://www.sistemapri.com.br'
          }
        ]
      },
      {
        name: 'FDE',
        slug: '/fde/',
        years: range(2008, 2010),
        description: 'Sistema para gerenciamento de infra-estrutura das escolas do Estado de São Paulo',
        link: 'http://www.fde.sp.gov.br',
        clients: [
          {
            name: 'FDE',
            link: 'http://www.fde.sp.gov.br'
          }
        ]
      },
      {
        name: 'Mapa de Obras',
        description: '',
        slug: '/primanager/',
        years: range(2009, 2009),
        link: 'https://www.aeseletropaulo.com.br',
        clients: [
          {
            name: 'AES Eletropaulo',
            link: 'https://www.aeseletropaulo.com.br'
          }
        ]
      },
      {
        name: 'ERP / CRM',
        slug: '/erp-crm/',
        years: range(2009, 2010),
        description: 'ERP / CRM para controle de todas as operações da empresa: fluxo de caixa, cadastro e acompanhamento de relacionamento com clientes e fornecedores, entre outros módulos.',
        link: null,
        clients: []
      }
    ]
  }
};

const getAllProjectsTech = R.reduce((techs, project) => {
  return R.uniq((techs || []).concat(project.technologies))
    .filter(t => t);
});

const setTechnologies = R.assoc('technologies');

const concatProjectTechs = R.map(job => {
  const techs = getAllProjectsTech(job.technologies, job.projects);
  return setTechnologies(techs, job);
});

const getJobsAndClients = R.pipe(
  getArray,
  concatProjectTechs
);

const reduceProjectGames = R.reduce((games, project) =>
  project.isGame
    ? games.concat(project)
    : games);

const reduceJobGames = R.reduce((games, job) =>
  reduceProjectGames(games, job.projects)
  , []);

const getGames = R.pipe(
  getArray,
  reduceJobGames
);

module.exports = {
  jobsAndClients: getJobsAndClients(jobsAndClients),
  games: getGames(jobsAndClients)
};
