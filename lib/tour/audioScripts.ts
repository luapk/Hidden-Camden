/**
 * All narration texts for Hidden Camden audio generation.
 * SFX cues stripped; paragraph breaks as double newlines.
 * Shared between scripts/generate-audio.ts and the admin API route.
 */

export interface AudioFile {
  filename: string
  label: string
  text: string
}

export const AUDIO_FILES: AudioFile[] = [
  {
    filename: 'intro.mp3',
    label: 'Intro — Camden Town Tube',
    text: `You're standing on the most musical half-mile on Earth. Camden should have more blue plaques than anywhere in London, but hardly any of them got put up, because the people who made this place famous were usually being barred from it at the time.

Here's how this works. Seven venues. Each one stays locked until you're physically standing in front of it. When your phone buzzes, a story starts, and a drink goes into your pocket for later. The rewards bank, so you don't have to drink your way round in an hour. You'd be amazed how many people have tried.

One rule. Keep your eyes up. Everything worth seeing in Camden happens at first-floor level and above, where the developers haven't reached yet.

Your first stop is thirty seconds away. Cross at the lights and aim for the pub that takes up half the block. Don't worry about the witch. She's been dead three hundred and fifty years.

Probably.`,
  },
  {
    filename: 'stop-01.mp3',
    label: 'Stop 1 — World\'s End & The Underworld',
    text: `Before the bands. Before the market. Before Camden was even Camden, there was a cottage on this corner, and in it lived a woman called Jinny Bingham.

Seventeenth century. The locals called her Mother Damnable, then later Mother Red Cap, and they gave her a wide berth. Partly manners. Mostly because the men in her life kept dying. One vanished. One went into the oven, according to the kinder versions. And the story goes that on the night Jinny herself died, witnesses saw the devil walk in through her front door.

Nobody saw him leave.

The pub that grew up on this spot traded as The Mother Red Cap for the next three centuries, a coaching halt at the edge of London, the last drink before the countryside. The world's end. Hence the name on the wall now. These days it's the biggest boozer in Camden, the pre-gig waiting room for every show in NW1, and if the jukebox sounds harder than your average pub, there's a reason.

That's coming from under your feet. Down the stairs is The Underworld, and for more than thirty years it's been the loudest basement in Britain. Every metal, punk and hardcore band you've ever loved either played that room on the way up or came back to it on the way down, close enough to touch and twice as sweaty. There's a pillar in the middle of the floor. Veterans navigate around it by instinct, in the dark, mid-mosh.

Your first reward just landed. One pint, on us, any time before five. Jinny's round.`,
  },
  {
    filename: 'link-01-02.mp3',
    label: 'Link 1→2 — to Electric Ballroom',
    text: `Out of the World's End, turn right, and walk up the High Street with the tube on your right. You're looking for the building that out-lasted the Luftwaffe. Forty seconds, on your left, past the shopfronts shaped like giant boots and dragons. While you walk: everything you're about to hear is true, which by Camden standards is rare.`,
  },
  {
    filename: 'stop-02.mp3',
    label: 'Stop 2 — Electric Ballroom',
    text: `In 1938, a Kerry-born builder and amateur boxer called Bill Fuller took over a rough little Irish club on this site called the Buffalo. The main entrance was round the back on Kentish Town Road. Business was steady. Space was tight.

Then the war came, and the Luftwaffe bombed the terrace next door.

Most people saw tragedy. Bill Fuller saw site clearance. He bought the rubble, knocked through, and built himself a two-thousand-capacity ballroom where Irish London came to dance for the next forty years.

By 1978, the dancing had changed. The relaunch night starred The Greedies, a supergroup built around Phil Lynott of Thin Lizzy plus half the Sex Pistols. They got the name because they demanded three quarters of the door money and Fuller called them a crowd of greedy bastards. To their credit, they kept it.

Two weeks later, Sid Vicious played a one-off here with a pickup band. The gig was billed as Sid Sods Off, and the door money had a specific purpose: raising the airfare to get Sid and Nancy to New York. Camden crowdfunded the most doomed relocation in rock history, at a fiver a head.

Since then: Joy Division. The Clash, who rehearsed here for a week. Madness. The Smiths. Public Enemy. And one night in 2014, with a few hours' notice and rumours flying on Twitter, Prince walked in and played to about seventy people, while a queue of the disbelieving wrapped around the block outside.

This is a two-thousand-cap room. He used roughly four percent of it.

Your voucher's banked. It works on club nights, after seven. Wear black. You'll want to blend in.`,
  },
  {
    filename: 'link-02-03.mp3',
    label: 'Link 2→3 — paywall moment (cuts at "The story is...")',
    text: `Back the way you came, past the tube, and bear right onto Parkway. Now. In January 1979, seven young men walked into a pub on this road and told the landlord a lie. The landlord believed them, because it was a respectable lie, told politely. And that lie invented British pop music as you know it. The pub is two hundred metres ahead. The story is...`,
  },
  {
    filename: 'stop-03.mp3',
    label: 'Stop 3 — Jazz Café',
    text: `Not everything in Camden is loud.

This corner has been the Jazz Café since 1990, and it runs on a single idea: take the artists who fill arenas, and put them in a room where the back row is closer than the front row anywhere else. Four hundred people. A balcony where you can eat dinner while a legend works below you, close enough to read the setlist.

The room's reputation was sealed in 1995, when a young singer from Virginia called D'Angelo played a run of nights here and taped them. That recording got passed between musicians for years like contraband, the sound of neo-soul being born in NW1, and it put a permanent question mark over the idea that the great soul rooms were all in America.

Since then the walls have absorbed everyone. Soul royalty, funk pioneers on farewell laps, rappers doing the one small show of the tour, and now and then a north London girl with a beehive, back when only Camden knew her name.

Here's the thing about this room: it's at its best in the first hour, when the lights are low and the band is checking levels and you can still get the rail. Which is exactly when your drink works. Doors hour, seven till eight, a proper gin and tonic at the brass rail while everyone else is still queueing.

Arrive early. The room rewards it. So do we.`,
  },
  {
    filename: 'link-03-04.mp3',
    label: 'Link 3→4 — to Dublin Castle',
    text: `Straight up Parkway, away from the noise. Past the pet shop that's been there forever, past the blue plaques that did get put up. You're heading for a cream-coloured corner pub with hanging baskets that looks like absolutely nothing. Number 94. The most important room in British pop is the one that doesn't bother telling you.`,
  },
  {
    filename: 'stop-04.mp3',
    label: 'Stop 4 — Dublin Castle',
    text: `Right. Stop looking at your phone and look at the pub. Cream paint, hanging baskets, looks like nothing. This is the most important room in British pop music and it holds about a hundred and fifty people.

It opened in 1856 to stop navvies killing each other. Camden was crawling with men digging the railway, and the bright idea was separate pubs for each nationality, so there'd be fewer fights and more men fit for work in the morning. The Irish got this one. Bear that in mind. This pub exists because of a strategy for managing drunk people. It's been refining it ever since.

Now. January 1979. Seven young men walk in and tell the landlord, Alo Conlon, that they're a jazz band. Alo thinks: jazz, lovely, respectable. Friday night comes, and a wall of skinheads turns up at his door. The band was Madness. The crowd was great. Alo gave them a year-long residency, and the back room behind you became the launchpad for One Step Beyond. They shot the video for My Girl in here. That's Alo at the start of it.

The lying-about-jazz trick worked so well the room never stopped. Blur played in there. Coldplay. Supergrass. The Killers. Muse got signed off the back of one electrifying set. The Libertines did a residency that nobody fully remembers, including the Libertines.

And then there's Amy. Winehouse loved this pub so much that when the paparazzi made a normal night out impossible, she'd come in and get behind the bar, pulling pints for startled customers. Hiding in plain sight, dressed as her own barmaid. In 2007, already conquering the world with Back to Black, she played a secret homecoming gig in that back room. Crammed in hip to hip. Suggs was there. And right at the back, cap pulled down over his face, was David Schwimmer. Ross from Friends, hiding in a Camden boozer, watching Amy. Nobody bothered either of them. That's the whole pub in one image.

Your reward is live. One pint of Guinness, the same drink John Foreman was holding when he pulled the curtain off the Madness plaque outside. And there are four bands on in the back tonight. Statistically, one of them is the next Coldplay. You've been warned.`,
  },
  {
    filename: 'link-04-05.mp3',
    label: 'Link 4→5 — to Good Mixer',
    text: `Out of the Castle, cross over, and head up Arlington Road. First left onto Inverness Street, the old fruit and veg market. You're about to walk into the 1990s. Specifically, into the pub where the 1990s were planned, plotted, and very nearly punched.`,
  },
  {
    filename: 'stop-05.mp3',
    label: 'Stop 5 — Good Mixer',
    text: `This is the pub that looks like nothing twice.

Formica tables. A pool table. A telly for the football. In any other postcode, you'd walk straight past. But for about five years in the 1990s, this little boozer was the centre of the British music industry, and the pool table behind that window was the most influential piece of furniture in the country.

Blur drank here. Not occasionally. Residentially. Graham Coxon lived around the corner and treated the Mixer as an extension of his front room, and where Blur drank, everyone followed: journalists, A&R men, photographers, and a steady supply of skinny young hopefuls in charity-shop suits. Legend says Menswear were less a band that formed than a band that condensed, out of cigarette smoke, somewhere between that pool table and the bar. They had a record deal before they had songs.

And because every scene needs a war, this is where Britpop's cold front ran. When Oasis came down from Manchester, this pub is where the two tribes actually had to share a room, and depending on who's telling it, that ended with words, or a squaring-up, or the Gallaghers barred outright. Nobody agrees on the details. Everyone agrees on the venue.

One more regular, years later. A local girl who'd come in, put her money on the table, and quietly run it. Amy was, by all accounts, very good at pool. People only remember the voice. The pool arm deserves its due.

Your reward fits the room: a pint and a free rack. Weekday afternoons, when the table's empty and the light comes in sideways. Bring someone you want to beat.`,
  },
  {
    filename: 'link-05-06.mp3',
    label: 'Link 5→6 — to Hawley Arms',
    text: `Down Inverness Street to the High Street, turn left, and brace yourself: you're going through the market crush, under the railway bridge, towards the canal. At the bridge, bear left onto Castlehaven Road. The next pub is the one Camden nearly lost, twice. Once to fire. Once to grief.`,
  },
  {
    filename: 'stop-06.mp3',
    label: 'Stop 6 — Hawley Arms',
    text: `Every pub on this tour has famous customers. This one had a family.

Through the 2000s, the Hawley Arms was the indie aristocracy's living room. Kate Moss at the bar. Noel Fielding in the corner. Half the bands you owned on CD, in here on a Tuesday, being left alone. That was the deal at the Hawley. You could be anyone, and they'd treat you like no one, in the nicest possible way.

Which is why Amy Winehouse loved it.

She didn't come here to be seen. She came here to disappear. And when even sitting at the bar got complicated, she did the most Amy thing imaginable: she got up, walked round, and started serving. The biggest soul voice of her generation, pulling pints for tourists who couldn't believe what they were looking at. The bar wasn't a stage. It was a hiding place where she could be the version of herself she liked best.

Then, in February 2008, the great Camden fire tore through the market, and the Hawley burned with it. Ten days later, Amy stood up at the Grammys, in the biggest moment of her career, with the whole world finally watching, and used it to send a message home: that Camden Town was still standing. Her pub. On that stage. That night.

The Hawley rebuilt. Amy kept coming back until she couldn't. And now, behind the pub, there's a mural of her, two storeys tall, watching over the street she never really left. Go and see it after the audio ends. People leave flowers. It's the only stop on this tour where we'd ask you to take the photo quietly.

Your pint is banked for a calm weekday afternoon, which is when this pub is most itself. Raise it to the family.`,
  },
  {
    filename: 'link-06-07.mp3',
    label: 'Link 6→7 — to Dingwalls',
    text: `Back to the bridge and into the market proper. Follow the crowds down towards the water, into the East Yard. You're looking for the old warehouse with a dead man's name painted on the brick. The last story is the biggest one. It's about the night everything sped up.`,
  },
  {
    filename: 'stop-07.mp3',
    label: 'Stop 7 — Dingwalls (finale)',
    text: `The name on this building belongs to T.E. Dingwall, a packing-case maker who stencilled his name on his warehouse and went out of business long before any of this. The name outlived the man, the trade, and very nearly the century. In 1973 the building reopened as a dance hall, kept the dead man's sign for the look of it, and accidentally made him immortal.

But this stop is really about one night. The fifth of July, 1976.

The evening before, four leather-jacketed brothers from Queens called the Ramones had played the Roundhouse up the road and reduced it to rubble in under forty minutes. The next night they played here. Smaller room. Same chainsaw. And the queue outside Dingwalls was the most important guest list ever assembled: the Sex Pistols. The Clash. The Damned. Chrissie Hynde. Every band that would define the next five years of music, all unknown, all broke, all here.

The British bands waited outside before doors, sitting on the bonnets of parked cars like a gang in a western, trying to look dangerous for the Americans. The Clash, who'd played their first ever gig the night before, asked the Ramones how on earth they'd filled two venues. The answer, more or less: we're terrible musicians, we play fast, we give the kids a show. Stop rehearsing. Go blow them away.

They did. Everyone did. Within six months, every band in London had doubled its tempo, and the brawl that broke out front of here that night, Clash versus Stranglers, made the national papers and put this warehouse on the map for good. Blondie made their UK debut on this stage too, just to round out the syllabus.

So that's your hour. A witch, a boxer, a lie about jazz, a pool table, a hiding place, and the night punk went overground. All within one half-mile, all still pouring.

Your final pint is waiting on the terrace over the lock, and your pin is claimable at the bar. Wear it somewhere people will ask about it.

Then tell them the one about the jazz band.`,
  },
  {
    filename: 'link-07-08.mp3',
    label: 'Link 7→8 — to the Imperial Palace of Big Red',
    text: `Out of Dingwalls, back through the market and onto Chalk Farm Road, heading away from the tube. Under the railway bridge, and the red glow on your right is exactly what it looks like. Camden lost this bar once. It came back wearing a crown.`,
  },
  {
    filename: 'stop-08.mp3',
    label: 'Stop 8 — The Imperial Palace of Big Red',
    text: `Some bars book bands. This one built a shrine to them.

Big Red was Camden's rock bar for years, the room where the leather jackets outnumbered the tourists and the jukebox never once apologised. Then it went dark, the way too many rooms here have. And in October 2024 the original owner got the keys back, gave the place a name with delusions of grandeur, and reopened it as the Imperial Palace of Big Red.

The walls are the show. Posters on posters, memorabilia stacked like the room is trying to remember every gig Camden ever hosted at once. Animal print where you least expect it. A pool table waiting for your money. And horror B movies playing silently in the corner, all rubber monsters and screaming, because nothing pairs with a cold lager like a man in a latex suit menacing a cardboard spaceship.

Then there is Zoltan, the fortune telling machine. Feed it a coin and it will tell you your future, which in this postcode is usually another round and a band you have never heard of becoming your new favourite.

Rock bars are supposed to be extinct. Nobody told this one.

Your pint is banked, the table is open, and the monsters are already screaming. Ask Zoltan about the next stop. He knows.`,
  },
  {
    filename: 'link-08-09.mp3',
    label: 'Link 8→9 — to Barfly',
    text: `Cross Chalk Farm Road and drift fifty steps north, to number forty nine. Small building, biggest guest list in Britain. Every arena act you have ever queued for started in rooms like this one. Most of them started in this one exactly.`,
  },
  {
    filename: 'stop-09.mp3',
    label: 'Stop 9 — Barfly',
    text: `Every big band has a small room on their CV. This is the one most of them share.

From 1996 this was the Barfly. Two hundred capacity, sticky floor, and the sharpest scouting post in Britain. The names who sweated on that little stage on their way up read like a festival poster: Coldplay. Adele. Muse. Ed Sheeran. The deal was simple. If the industry wanted to know what was next, it stood at the back of this room with a warm beer and found out.

Then in 2016 the name came off the door, and the building spent eight years answering to Camden Assembly, which never sounded right, and everybody knew it.

On the twenty second of June, 2026, the sign went back up. Frank Turner played the first night of the reborn Barfly, which is about as correct as bookings get, and the new room keeps the old religion while upgrading the tools: a wall of fame with photographs nobody had seen before, blue plaques for the alumni, a proper new rig, and downstairs a vinyl listening bar built around a 1959 jukebox that is older than every record it plays.

Two hundred capacity, same as ever. Statistically, somebody on this stage in the next twelve months will be filling arenas before your tour pin needs polishing. You get to say you saw them here, and this time the wall of fame is ready for them.

Your lager is banked for gig nights, early doors, when the support band is soundchecking and hope is at its loudest.`,
  },
  {
    filename: 'link-09-10.mp3',
    label: 'Link 9→10 — to Spiritual Bar',
    text: `Keep climbing Chalk Farm Road and take the left into Ferdinand Street. It looks like nothing, which by now you know is Camden for something. The last room is the smallest, and it is the one the famous faces visit on their nights off.`,
  },
  {
    filename: 'stop-10.mp3',
    label: 'Stop 10 — Spiritual Bar (finale)',
    text: `Ferdinand Street does not look like a launchpad. One room, run by a record label, live music six nights a week, and a Tuesday open mic that is quietly one of the most dangerous career moves in London. Dangerous because here, people actually listen.

Ask Ann Liu Cannon. She was playing this room when Ethan Johns walked in, the producer behind records for Paul McCartney and Laura Marling. He heard her, and the publishing deal with BMG followed. From this floor, no stage worth mentioning, to editorial playlists and American tours. The bar carries the torch for grassroots music and every so often the torch catches.

That is the trick of the Spiritual. The legends do not play here. They stand at the back with a drink, watching, because this is where the next ones surface first. Keep an eye on whoever looks too relaxed. That is usually somebody famous doing their listening.

The tour ends here, and that is deliberate. You have spent the evening walking through rooms where it already happened. This is the room where it happens next.

Your last drink is banked. Take it slow, face the stage, and if the person next to you hums along too precisely, buy them one as well. Chances are you own their records.`,
  },
]

/**
 * Spanish narration, keyed by the same filename as the English scripts.
 * Band, pub and place names stay in English (they are proper nouns).
 * No em dashes, per the copy rules.
 */
export const AUDIO_TEXT_ES: Record<string, string> = {
  'intro.mp3': `Estás en el medio kilómetro más musical del planeta. Camden debería tener más placas azules que cualquier otro lugar de Londres, pero casi ninguna llegó a colocarse, porque la gente que hizo famoso este sitio solía tener prohibida la entrada en aquella época.

Así funciona esto. Siete locales. Cada uno permanece bloqueado hasta que estás físicamente delante de él. Cuando tu teléfono vibra, empieza una historia, y una bebida va a tu bolsillo para más tarde. Las recompensas se acumulan, así que no tienes que beberte la ruta entera en una hora. Te sorprendería cuánta gente lo ha intentado.

Una regla. Mantén la mirada en alto. Todo lo que merece la pena ver en Camden ocurre en la primera planta y más arriba, donde los promotores todavía no han llegado.

Tu primera parada está a treinta segundos. Cruza en el semáforo y dirígete al pub que ocupa media manzana. No te preocupes por la bruja. Lleva muerta trescientos cincuenta años.

Probablemente.`,

  'stop-01.mp3': `Antes de los grupos. Antes del mercado. Antes de que Camden fuera siquiera Camden, había una casita en esta esquina, y en ella vivía una mujer llamada Jinny Bingham.

Siglo diecisiete. Los vecinos la llamaban Mother Damnable, y más tarde Mother Red Cap, y la evitaban a toda costa. En parte por educación. Sobre todo porque los hombres de su vida no paraban de morir. Uno desapareció. Otro acabó en el horno, según las versiones más amables. Y cuentan que la noche en que la propia Jinny murió, hubo testigos que vieron al diablo entrar por su puerta.

Nadie lo vio salir.

El pub que creció en este lugar funcionó como The Mother Red Cap durante los tres siglos siguientes, una parada de diligencias al borde de Londres, la última copa antes del campo. El fin del mundo. De ahí el nombre que ves ahora en la pared. Hoy en día es el bar más grande de Camden, la sala de espera previa a los conciertos de cualquier actuación en NW1, y si la máquina de discos suena más dura que la de un pub normal, hay una razón.

Viene de debajo de tus pies. Bajando las escaleras está The Underworld, y durante más de treinta años ha sido el sótano más ruidoso de Gran Bretaña. Cada grupo de metal, punk y hardcore que has querido alguna vez o tocó en esa sala mientras subía, o volvió a ella mientras bajaba, lo bastante cerca como para tocarlo y el doble de sudoroso. Hay una columna en mitad de la pista. Los veteranos la esquivan por instinto, a oscuras, en pleno mosh.

Acaba de llegar tu primera recompensa. Una pinta, invitamos nosotros, en cualquier momento antes de las cinco. Invita Jinny.`,

  'link-01-02.mp3': `Al salir del World's End, gira a la derecha y sube por la High Street con el metro a tu izquierda. Busca el edificio que sobrevivió a la Luftwaffe. Cuarenta segundos, a tu izquierda, pasados los escaparates con forma de botas gigantes y dragones. Mientras caminas: todo lo que estás a punto de oír es verdad, lo cual, para los estándares de Camden, es raro.`,

  'stop-02.mp3': `En 1938, un constructor y boxeador aficionado nacido en Kerry llamado Bill Fuller se hizo con un pequeño y tosco club irlandés que había en este lugar, llamado el Buffalo. La entrada principal estaba en la parte de atrás, en Kentish Town Road. El negocio iba bien. El espacio era escaso.

Entonces llegó la guerra, y la Luftwaffe bombardeó la hilera de casas de al lado.

La mayoría vio una tragedia. Bill Fuller vio un solar despejado. Compró los escombros, tiró los tabiques, y se construyó una sala de baile con aforo para dos mil personas, donde el Londres irlandés vino a bailar durante los siguientes cuarenta años.

Para 1978, el baile había cambiado. La noche de reapertura tuvo como estrellas a The Greedies, un supergrupo montado alrededor de Phil Lynott, de Thin Lizzy, más medio Sex Pistols. Les quedó ese nombre porque exigieron tres cuartas partes de la recaudación de la taquilla y Fuller los llamó una panda de avariciosos. Para su mérito, se lo quedaron.

Dos semanas después, Sid Vicious tocó aquí una única vez con una banda improvisada. El concierto se anunció como Sid Sods Off, y la recaudación tenía un propósito concreto: reunir el dinero del billete de avión para llevar a Sid y a Nancy a Nueva York. Camden financió de forma colectiva la mudanza más condenada de la historia del rock, a cinco libras por cabeza.

Desde entonces: Joy Division. The Clash, que ensayaron aquí una semana. Madness. The Smiths. Public Enemy. Y una noche de 2014, avisando con pocas horas de antelación y con los rumores volando por Twitter, Prince entró y tocó para unas setenta personas, mientras una cola de incrédulos rodeaba la manzana por fuera.

Esta es una sala con aforo para dos mil. Él usó más o menos el cuatro por ciento.

Tu vale está guardado. Sirve en las noches de club, después de las siete. Vístete de negro. Querrás pasar desapercibido.`,

  'link-02-03.mp3': `Vuelve por donde viniste, pasa el metro y tira a la derecha por Parkway. Ahora. En enero de 1979, siete jóvenes entraron en un pub de esta calle y le contaron una mentira al dueño. El dueño les creyó, porque era una mentira respetable, contada con educación. Y esa mentira inventó la música pop británica tal y como la conoces. El pub está doscientos metros más adelante. La historia es...`,

  'stop-03.mp3': `No todo en Camden es ruidoso.

Esta esquina es el Jazz Café desde 1990, y se rige por una sola idea: coger a los artistas que llenan estadios, y ponerlos en una sala donde la última fila está más cerca que la primera fila de cualquier otro sitio. Cuatrocientas personas. Un palco donde puedes cenar mientras una leyenda trabaja debajo de ti, lo bastante cerca como para leer el repertorio.

La reputación de la sala quedó sellada en 1995, cuando un joven cantante de Virginia llamado D'Angelo tocó aquí varias noches seguidas y las grabó. Esa grabación pasó de músico en músico durante años como si fuera contrabando, el sonido del neo-soul naciendo en NW1, y dejó un signo de interrogación permanente sobre la idea de que las grandes salas de soul estaban todas en América.

Desde entonces, las paredes lo han absorbido todo. La realeza del soul, pioneros del funk en sus vueltas de despedida, raperos haciendo el único concierto pequeño de la gira, y de vez en cuando una chica del norte de Londres con un peinado de colmena, cuando solo Camden conocía su nombre.

La cosa con esta sala es la siguiente: da lo mejor de sí en la primera hora, cuando las luces están bajas y el grupo está ajustando niveles y todavía puedes pillar sitio en la barandilla. Que es justo cuando funciona tu bebida. La hora de apertura, de siete a ocho, un buen gin-tonic en la barandilla de latón mientras los demás siguen haciendo cola.

Llega pronto. La sala lo recompensa. Nosotros también.`,

  'link-03-04.mp3': `Recto por Parkway, alejándote del ruido. Pasada la tienda de mascotas que lleva ahí toda la vida, pasadas las placas azules que sí se llegaron a colocar. Te diriges a un pub de esquina de color crema, con cestas de flores colgando, que no parece absolutamente nada. Número 94. La sala más importante del pop británico es la que no se molesta en decírtelo.`,

  'stop-04.mp3': `Vale. Deja de mirar el teléfono y mira el pub. Pintura color crema, cestas de flores colgando, no parece nada. Esta es la sala más importante de la música pop británica y tiene cabida para unas ciento cincuenta personas.

Abrió en 1856 para evitar que los peones se mataran entre ellos. Camden estaba lleno de hombres cavando el ferrocarril, y la idea brillante fue poner pubs separados para cada nacionalidad, para que hubiera menos peleas y más hombres en condiciones de trabajar por la mañana. A los irlandeses les tocó este. Tenlo en cuenta. Este pub existe gracias a una estrategia para gestionar a la gente borracha. La lleva perfeccionando desde entonces.

Ahora. Enero de 1979. Siete jóvenes entran y le dicen al dueño, Alo Conlon, que son una banda de jazz. Alo piensa: jazz, encantador, respetable. Llega el viernes por la noche, y un muro de skinheads aparece en su puerta. La banda era Madness. El público fue estupendo. Alo les dio una residencia de un año, y la sala de atrás, detrás de ti, se convirtió en la plataforma de lanzamiento de One Step Beyond. Rodaron aquí el vídeo de My Girl. Ese que sale al principio es Alo.

El truco de mentir sobre el jazz funcionó tan bien que la sala no paró nunca. Blur tocó ahí. Coldplay. Supergrass. The Killers. A Muse los ficharon a raíz de un concierto electrizante. Los Libertines hicieron una residencia que nadie recuerda del todo, incluidos los propios Libertines.

Y luego está Amy. A Winehouse le gustaba tanto este pub que, cuando los paparazzi hacían imposible una noche normal, entraba y se ponía detrás de la barra, tirando pintas para clientes desconcertados. Escondida a plena vista, disfrazada de su propia camarera. En 2007, cuando ya estaba conquistando el mundo con Back to Black, dio un concierto secreto de vuelta a casa en esa sala de atrás. Apretados cadera con cadera. Suggs estaba allí. Y justo al fondo, con la gorra calada hasta la cara, estaba David Schwimmer. Ross, el de Friends, escondido en un bar de Camden, viendo a Amy. Nadie molestó a ninguno de los dos. Eso es el pub entero en una sola imagen.

Tu recompensa está activa. Una pinta de Guinness, la misma bebida que sostenía John Foreman cuando descubrió la placa de Madness ahí fuera. Y esta noche tocan cuatro grupos en la parte de atrás. Estadísticamente, uno de ellos es el próximo Coldplay. Quedas avisado.`,

  'link-04-05.mp3': `Sal del Castle, cruza, y sube por Arlington Road. Primera a la izquierda por Inverness Street, el viejo mercado de frutas y verduras. Estás a punto de entrar en los años noventa. En concreto, en el pub donde los años noventa se planearon, se tramaron y estuvieron a punto de acabar a puñetazos.`,

  'stop-05.mp3': `Este es el pub que no parece nada dos veces.

Mesas de formica. Una mesa de billar. Una tele para el fútbol. En cualquier otro código postal, pasarías de largo sin pensarlo. Pero durante unos cinco años en los noventa, este pequeño bar fue el centro de la industria musical británica, y la mesa de billar que hay detrás de esa ventana era el mueble más influyente del país.

Blur bebía aquí. No de vez en cuando. De forma residente. Graham Coxon vivía a la vuelta de la esquina y trataba el Mixer como una prolongación de su salón, y donde bebía Blur, le seguían todos: periodistas, cazatalentos, fotógrafos, y un suministro constante de jóvenes flacos con ilusiones y trajes de tienda de segunda mano. Cuenta la leyenda que Menswear, más que formarse como grupo, se condensaron del humo de los cigarrillos, en algún punto entre esa mesa de billar y la barra. Tenían contrato discográfico antes de tener canciones.

Y como toda escena necesita su guerra, aquí pasaba el frente frío del britpop. Cuando Oasis bajaron desde Manchester, este pub es donde las dos tribus tuvieron que compartir sala de verdad, y según quién lo cuente, aquello acabó en palabras, o en un cara a cara, o con los Gallagher expulsados del todo. Nadie se pone de acuerdo en los detalles. Todos se ponen de acuerdo en el lugar.

Un habitual más, años después. Una chica del barrio que entraba, ponía su dinero en la mesa, y la dominaba sin hacer ruido. Amy, según todos, jugaba muy bien al billar. La gente solo recuerda la voz. El brazo del billar merece su reconocimiento.

Tu recompensa pega con el sitio: una pinta y una partida de billar gratis. Tardes entre semana, cuando la mesa está vacía y la luz entra de lado. Trae a alguien a quien quieras ganar.`,

  'link-05-06.mp3': `Baja por Inverness Street hasta la High Street, gira a la izquierda, y prepárate: vas a atravesar el gentío del mercado, bajo el puente del ferrocarril, hacia el canal. En el puente, tira a la izquierda por Castlehaven Road. El siguiente pub es el que Camden estuvo a punto de perder, dos veces. Una por el fuego. Otra por el dolor.`,

  'stop-06.mp3': `Todos los pubs de esta ruta tienen clientes famosos. Este tenía una familia.

Durante los años 2000, el Hawley Arms era el salón de la aristocracia indie. Kate Moss en la barra. Noel Fielding en el rincón. La mitad de los grupos que tenías en CD, aquí dentro un martes, sin que nadie los molestara. Ese era el trato en el Hawley. Podías ser cualquiera, y te trataban como a un don nadie, en el mejor de los sentidos.

Por eso le encantaba a Amy Winehouse.

No venía aquí para que la vieran. Venía aquí para desaparecer. Y cuando incluso sentarse en la barra se complicaba, hizo lo más típico de Amy que se puede imaginar: se levantó, dio la vuelta, y se puso a servir. La mayor voz del soul de su generación, tirando pintas para turistas que no se creían lo que estaban viendo. La barra no era un escenario. Era un escondite donde podía ser la versión de sí misma que más le gustaba.

Entonces, en febrero de 2008, el gran incendio de Camden arrasó el mercado, y el Hawley ardió con él. Diez días después, Amy se levantó en los Grammy, en el mayor momento de su carrera, con el mundo entero por fin mirando, y lo aprovechó para mandar un mensaje a casa: que Camden Town seguía en pie. Su pub. En aquel escenario. Aquella noche.

El Hawley se reconstruyó. Amy siguió volviendo hasta que no pudo. Y ahora, detrás del pub, hay un mural de ella, de dos plantas de alto, vigilando la calle que en realidad nunca abandonó. Ve a verlo cuando termine el audio. La gente deja flores. Es la única parada de esta ruta en la que te pediríamos que hagas la foto en silencio.

Tu pinta queda guardada para una tarde tranquila entre semana, que es cuando este pub es más él mismo. Brinda por la familia.`,

  'link-06-07.mp3': `Vuelve al puente y métete en el mercado de verdad. Sigue a la multitud hacia el agua, hasta el East Yard. Busca el viejo almacén con el nombre de un muerto pintado en el ladrillo. La última historia es la más grande. Va sobre la noche en que todo se aceleró.`,

  'stop-07.mp3': `El nombre de este edificio pertenece a T.E. Dingwall, un fabricante de cajas de embalaje que estarció su nombre en su almacén y quebró mucho antes de todo esto. El nombre sobrevivió al hombre, al oficio, y casi al siglo. En 1973 el edificio reabrió como salón de baile, conservó el cartel del muerto por estética, y, sin querer, lo hizo inmortal.

Pero esta parada va, en realidad, sobre una sola noche. El cinco de julio de 1976.

La tarde anterior, cuatro hermanos con cazadora de cuero de Queens llamados los Ramones habían tocado en el Roundhouse, calle arriba, y lo redujeron a escombros en menos de cuarenta minutos. La noche siguiente tocaron aquí. Sala más pequeña. La misma motosierra. Y la cola a la puerta de Dingwalls era la lista de invitados más importante jamás reunida: los Sex Pistols. The Clash. The Damned. Chrissie Hynde. Cada grupo que iba a definir los siguientes cinco años de música, todos desconocidos, todos sin un duro, todos aquí.

Los grupos británicos esperaban fuera antes de que abrieran, sentados en los capós de los coches aparcados como una banda de un western, intentando parecer peligrosos para los americanos. The Clash, que habían dado su primerísimo concierto la noche anterior, les preguntaron a los Ramones cómo demonios habían llenado dos locales. La respuesta, más o menos: somos malísimos músicos, tocamos rápido, le damos un espectáculo a la chavalería. Dejad de ensayar. Id a dejarlos boquiabiertos.

Y lo hicieron. Todos lo hicieron. En seis meses, todos los grupos de Londres habían doblado su tempo, y la pelea que estalló aquí delante aquella noche, Clash contra Stranglers, salió en la prensa nacional y puso este almacén en el mapa para siempre. Blondie también hicieron su debut en el Reino Unido sobre este escenario, ya para completar el temario.

Así que esa es tu hora. Una bruja, un boxeador, una mentira sobre el jazz, una mesa de billar, un escondite, y la noche en que el punk salió a la superficie. Todo en medio kilómetro, y todo sigue sirviendo copas.

Tu última pinta te espera en la terraza sobre la esclusa, y tu chapa la puedes reclamar en la barra. Póntela en un sitio donde la gente te pregunte por ella.

Y entonces cuéntales la de la banda de jazz.`,
}
