import { searchSearxng } from '@/lib/searxng';

const websitesForTopic = {
  tech: {
    query: ['tecnologia', 'inovação', 'inteligência artificial', 'ciência e tecnologia'],
    links: ['tecnoblog.net', 'canaltech.com.br', 'olhardigital.com.br'],
  },
  finance: {
    query: ['economia', 'mercado financeiro', 'bolsa de valores', 'investimentos'],
    links: ['infomoney.com.br', 'valor.globo.com', 'economia.uol.com.br','b3.com.br','startups.com.br'],
  },
  art: {
  query: [
    'arte', 
    'cultura', 
    'arte contemporânea', 
    'eventos culturais', 
    'música brasileira', 
    'teatro', 
    'literatura',
    'art',
    'contemporary art',
    'culture'
  ],
  links: [
    // Sites brasileiros
    'revistacult.uol.com.br',
    'select.art.br',
    'arteref.com',
    'revistazum.com.br',
    'artebrasileiros.com.br',
    'suplementopernambuco.com.br',
    'revistaserrote.com.br',
    'continente.com.br',
    
    // Sites internacionais de prestígio
    'artforum.com',
    'artnews.com',
    'theartnewspaper.com',
    'frieze.com',
    'artsy.net',
    'hyperallergic.com',
    'e-flux.com',
    'artreview.com',
  ],
},
  sports: {
    query: ['esportes', 'futebol', 'notícias esportivas', 'campeonatos'],
    links: ['ge.globo.com', 'espn.com.br', 'lance.com.br','colunadofla.com'],
  },
  entertainment: {
    query: ['entretenimento', 'cinema', 'séries', 'celebridades'],
    links: ['omelete.com.br', 'adorocinema.com', 'popline.com.br'],
  },
};

type Topic = keyof typeof websitesForTopic;

export const GET = async (req: Request) => {
  try {
    const params = new URL(req.url).searchParams;

    const mode: 'normal' | 'preview' =
      (params.get('mode') as 'normal' | 'preview') || 'normal';
    const topic: Topic = (params.get('topic') as Topic) || 'tech';

    const selectedTopic = websitesForTopic[topic];

    let data = [];

    if (mode === 'normal') {
      const seenUrls = new Set();

      data = (
        await Promise.all(
          selectedTopic.links.flatMap((link) =>
            selectedTopic.query.map(async (query) => {
              return (
                await searchSearxng(`site:${link} ${query}`, {
                  engines: ['bing news'],
                  pageno: 1,
                  language: 'pt-BR',
                })
              ).results;
            }),
          ),
        )
      )
        .flat()
        .filter((item) => {
          const url = item.url?.toLowerCase().trim();
          if (seenUrls.has(url)) return false;
          seenUrls.add(url);
          return true;
        })
        .sort(() => Math.random() - 0.5);
    } else {
      data = (
        await searchSearxng(
          `site:${selectedTopic.links[Math.floor(Math.random() * selectedTopic.links.length)]} ${selectedTopic.query[Math.floor(Math.random() * selectedTopic.query.length)]}`,
          {
            engines: ['bing news'],
            pageno: 1,
            language: 'pt-BR',
          },
        )
      ).results;
    }

    return Response.json(
      {
        blogs: data,
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.error(`An error occurred in discover route: ${err}`);
    return Response.json(
      {
        message: 'An error has occurred',
      },
      {
        status: 500,
      },
    );
  }
};
