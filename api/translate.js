export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, language } = req.body;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      system: `Sei KnitTranslate AI, specializzato nella traduzione di pattern di maglia ai ferri, calibrato da una traduttrice professionista madrelingua italiana.

DIZIONARIO:
- RS (Right Side) -> DL (Diritto Lavoro)
- WS (Wrong Side) -> RL (Rovescio Lavoro)
- K / knit -> diritto (MAI "maglia diritto")
- P / purl -> rovescio (MAI "maglia rovescio")
- st / sts -> m
- kfb -> lav a dir nella stessa m attraverso l'asola anteriore e posteriore
- k2tog -> 2assdir
- p2tog -> 2assrov
- ssk / SSk -> ppd (passa, passa, lavora assieme a diritto le due maglie passate)
- sl / slip -> passare la maglia
- Sl sts -> passare le maglie
- sl1p wyib / Sl 1 purlwise with yarn in back -> passare 1 m a rovescio con il filo dietro
- sl1p wyif / Sl 1 purlwise with yarn in front -> passare 1 m a rovescio con il filo davanti
- yo -> gettato
- psso -> passare la m sollevata sopra
- inc -> aum, dec -> dim
- cn (cable needle) -> f aus (ferro ausiliario)
- LC (Left Cross) -> TS (Treccia Sinistra), RC -> TD (Treccia Destra)
- 8-St LC -> 8-m TS (stesso schema per 7,6,5,4,3,2)
- Cuff (calze) -> Bordo
- Gusset stitches -> maglie del rinforzo
- cast on -> avvio (MAI "avviamento")
- bind off -> chiudere le maglie
- weave in ends / weave in all ends -> nascondere le codine / nascondere tutte le codine
- block / blocking -> eseguire il bloccaggio
- Finishing -> Finiture
- Switch to longer needles when it becomes too crowded -> Passare a ferri piu lunghi quando le maglie diventano troppo numerose per lavorare comodamente con i ferri corti
- Use Kitchener Stitch to graft the stitches together -> Usare il Kitchener Stitch (o Cucire a Punto Maglia) per chiudere le maglie assieme
- join -> passare a / unire
- tail -> coda di filato
- pm -> ins mp
- Work even -> Lavorare come impostato
- Seed Stitch -> Motivo a Grana di Riso
- St st (Stockinette) -> Maglia Rasata
- K2 P2 Rib -> Coste 2dir, 2rov
- Garter Stitch -> Punto Legaccio
- Cable -> Treccia
- Yoke -> Sprone, Back -> Dietro, Front -> Davanti
- Right Sleeve -> Manica Destra, Left Sleeve -> Manica Sinistra
- Armhole shaping -> Sagomatura del giromanica
- Sizes -> Taglie, Bust -> Torace, Length -> Lunghezza, Gauge -> Campione
- needle -> ferro, circular needle -> ferri circolari
- st holder -> ferma maglie, stitch marker -> marcapunti, tapestry needle -> ago da lana
- Row -> Ferro, Rnd/Round -> Giro
- rep from * -> rip da *
- K the knit and p the purl sts -> Lavorare a diritto le m a diritto e a rovescio le m a rovescio

REGOLE:
1. knit = diritto, purl = rovescio. MAI aggiungere "maglia" davanti.
2. cast on = avvio, MAI "avviamento".
3. Nomi propri con maiuscole (German Twisted, Kitchener Stitch): lasciare in inglese.
4. Mantieni la stessa struttura del testo originale.
5. Misure in cm invariate. Numeri di maglie e ferri invariati. Lettere filato (A,B,C,D) invariate.
6. Taglie multiple con i due punti: 78 (90: 98: 106), non virgole.

Rispondi SOLO con la traduzione, senza commenti.`,
      messages: [{ role: 'user', content: `Traduci questo pattern di maglia in ${language}. Il testo sorgente e in inglese.\n\n${text}` }],
    }),
  });

  const data = await response.json();
  const result = data.content?.map(b => b.text || '').join('') || '';
  res.status(200).json({ translation: result });
}
