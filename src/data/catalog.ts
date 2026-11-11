// Sélection SpotLa pour Montréal : les lieux et rendez-vous que l'app propose d'office.
// Sources (novembre 2026) : guides The Main et SORTiRMTL (vie nocturne), Tastet (cocktails),
// Tourisme Montréal (marchés de Noël 2026, quoi faire ce week-end), igloofest.ca, montrealenlumiere.com.
// Coordonnées : OpenStreetMap. Les dates sont celles annoncées par les organisateurs : à revérifier chaque saison.

export type Category = 'club' | 'bar' | 'soiree' | 'fetes' | 'gastro' | 'jeux'

export interface CatalogItem {
  id: string
  name: string
  category: Category
  kind: string
  area: string
  address?: string
  lat: number
  lng: number
  blurb: string
  /** Quand y aller : « Tous les lundis », « 13 nov. – 3 janv. »… */
  when?: string
  /** Période de validité (AAAA-MM-JJ). Hors période, la carte est cachée. */
  from?: string
  to?: string
  free?: boolean
  photo?: string
  /** Courte vidéo en boucle à la place de la photo */
  video?: string
  /** Galerie de la fiche (photos et vidéos .mp4), sinon une galerie d'ambiance par catégorie */
  gallery?: string[]
  rank: number
}

export const CATEGORIES: { k: Category; title: string; sub: string }[] = [
  { k: 'club', title: 'Top 10 clubs', sub: 'Pour danser jusqu\'au bout de la nuit' },
  { k: 'bar', title: 'Top 10 bars', sub: 'Cocktails, speakeasies et bars de quartier' },
  { k: 'soiree', title: 'Soirées récurrentes', sub: 'Les rendez-vous qui reviennent' },
  { k: 'fetes', title: 'Temps des fêtes', sub: 'Marchés et sorties d\'hiver en ville' },
  { k: 'gastro', title: 'Gourmand', sub: 'Festivals et marchés pour bien manger' },
  { k: 'jeux', title: 'Activités', sub: 'Arcades, escalade, escape games : du fun à toute heure' },
]

// Photos d'ambiance Unsplash (licence Unsplash : usage commercial libre, sans attribution obligatoire).
// Une photo officielle du lieu peut les remplacer via la table places (photo_url, même id).
const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=720&h=1000&q=70&auto=format&fit=crop`

export const CATALOG: CatalogItem[] = [
  // ---------- Clubs ----------
  { id: 'osm:node/4486771295', category: 'club', rank: 1, photo: U('1541126274323-dbac58d14741'), name: 'Stereo', kind: 'Boîte de nuit', area: 'Village', address: '858 rue Sainte-Catherine Est', lat: 45.5159988, lng: -73.5581204, blurb: 'After-hours house et techno depuis 1998, réputé pour l\'un des meilleurs systèmes de son d\'Amérique du Nord.' },
  { id: 'osm:node/6005804263', category: 'club', rank: 2, photo: U('1570207859654-a9a7ad65ed3d'), name: 'Newspeak', kind: 'Boîte de nuit', area: 'Quartier latin', address: '1403 rue Sainte-Élisabeth', lat: 45.5124604, lng: -73.5621494, blurb: 'Salle sombre, gros son et une programmation électronique loin du grand public.' },
  { id: 'osm:node/11888760955', category: 'club', rank: 3, photo: U('1630395822970-acd6a691d97e'), name: 'New City Gas', kind: 'Boîte de nuit', area: 'Griffintown', address: '950 rue Ottawa', lat: 45.4954476, lng: -73.5576521, blurb: 'Grande salle dans une ancienne usine à gaz, DJ internationaux.' },
  { id: 'osm:node/13234865274', category: 'club', rank: 4, photo: U('1603910234616-3b5f4a6be2b4'), name: 'Francesco\'s Discoteca', kind: 'Boîte de nuit', area: 'Vieux-Montréal', address: '394 rue Saint-Jacques', lat: 45.5018707, lng: -73.5597574, blurb: 'L\'esprit du disco italien sur une piste house.' },
  { id: 'osm:node/2424892846', category: 'club', rank: 5, photo: U('1687511844598-165c1fc387cc'), name: 'Club Unity', kind: 'Boîte de nuit', area: 'Village', address: '1171 rue Sainte-Catherine Est', lat: 45.5183456, lng: -73.5564576, blurb: 'Trois étages, deux ambiances musicales, spectacles de drag. Un pilier du Village.' },
  { id: 'osm:node/2424590588', category: 'club', rank: 6, photo: U('1622743941533-cde694bff56a'), name: 'Complexe Sky', kind: 'Boîte de nuit', area: 'Village', address: '1488 rue Sainte-Catherine Est', lat: 45.5209934, lng: -73.5536799, blurb: 'Pilier de la vie nocturne queer depuis 1994, avec terrasse sur le toit.' },
  { id: 'osm:node/13947882201', category: 'club', rank: 7, photo: U('1509824227185-9c5a01ceba0d'), name: 'Jet Montréal', kind: 'Boîte de nuit', area: 'Centre-ville', address: '2020 rue Crescent', lat: 45.4980107, lng: -73.5778815, blurb: 'Décor moderne, house, R&B et top 40 sur Crescent.' },
  { id: 'osm:node/3744335928', category: 'club', rank: 8, photo: U('1544586784-b9ee32edb3ff'), name: 'Lamouche', kind: 'Boîte de nuit', area: 'Quartier latin', address: '1284 rue Saint-Denis', lat: 45.5134617, lng: -73.5602229, blurb: 'Club de la rue Saint-Denis, en plein Quartier latin.' },
  { id: 'osm:node/458918546', category: 'club', rank: 9, photo: U('1663668566971-afaa3f07903d'), name: 'Café Campus', kind: 'Boîte de nuit', area: 'Plateau', address: '57 rue Prince-Arthur Est', lat: 45.5145413, lng: -73.5721828, blurb: 'Soirées dansantes et concerts sur Prince-Arthur.' },
  { id: 'osm:node/11265181044', category: 'club', rank: 10, photo: U('1649185356311-f090ae96ee5a'), name: 'Muzique', kind: 'Boîte de nuit', area: 'Plateau', address: '3781 boulevard Saint-Laurent', lat: 45.5154176, lng: -73.5756478, blurb: 'Club du boulevard Saint-Laurent, au cœur de la Main.' },

  // ---------- Bars ----------
  { id: 'osm:node/13739215443', category: 'bar', rank: 1, photo: U('1759273621982-ac250d994775'), name: 'Gokudo', kind: 'Bar à cocktails', area: 'Centre-ville', address: '630 rue Cathcart', lat: 45.5031316, lng: -73.5685339, blurb: 'Cité parmi les meilleurs cocktails de Montréal.' },
  { id: 'osm:node/5416663552', category: 'bar', rank: 2, photo: U('1775955849483-5992deefbed3'), name: 'Velvet Speakeasy', kind: 'Speakeasy', area: 'Vieux-Montréal', address: '426 rue Saint-Gabriel', lat: 45.5063757, lng: -73.5539371, blurb: 'Bar caché sous l\'historique Auberge Saint-Gabriel.' },
  { id: 'osm:node/13936960001', category: 'bar', rank: 3, photo: U('1792670846245-09ef04789925'), name: 'Sans Soleil', kind: 'Bar d\'écoute', area: 'Quartier chinois', address: '1002 rue Saint-Urbain', lat: 45.5065435, lng: -73.5605424, blurb: 'Bar d\'écoute au sous-sol, vinyles et bons verres.' },
  { id: 'osm:node/11973468695', category: 'bar', rank: 4, photo: U('1598994392980-53a7fb033bcc'), name: 'Bar Le Mal Nécessaire', kind: 'Bar tiki', area: 'Vieux-Montréal', address: '1015 rue Saint-Alexandre', lat: 45.5031684, lng: -73.5628983, blurb: 'Cocktails tiki dans une ambiance souterraine.' },
  { id: 'osm:node/11265612651', category: 'bar', rank: 5, photo: U('1788713199492-8865db01e752'), name: 'Barbossa', kind: 'Bar', area: 'Plateau', address: 'Boulevard Saint-Laurent', lat: 45.5166375, lng: -73.5789966, blurb: 'L\'ancien Blizzarts, repère nocturne de la Main. Jazz en direct le lundi.' },
  { id: 'osm:node/4654823871', category: 'bar', rank: 6, photo: U('1749015375406-d60a989d64c4'), name: 'La Rockette', kind: 'Bar', area: 'Plateau', address: '4479 rue Saint-Denis', lat: 45.5239019, lng: -73.582482, blurb: 'Rockeurs, vinyles et verres bien tassés.' },
  { id: 'osm:way/122209641', category: 'bar', rank: 7, photo: U('1640902106532-47dd3a2e833e'), name: 'Furco', kind: 'Bar', area: 'Centre-ville', address: '425 rue Mayor', lat: 45.5063357, lng: -73.5690872, blurb: 'Grand bar animé dans un ancien entrepôt de fourrures.' },
  { id: 'osm:node/5893382885', category: 'bar', rank: 8, photo: U('1785765904806-0d687601b0d5'), name: 'Club Pelicano', kind: 'Bar', area: 'Quartier des spectacles', address: '1076 rue De Bleury', lat: 45.5044851, lng: -73.5634203, blurb: 'Bar festif près du Quartier des spectacles.' },
  { id: 'osm:node/12194843602', category: 'bar', rank: 9, photo: U('1569924995012-c4c706bfcd51'), name: 'Bisou Bisou', kind: 'Bar', area: 'Vieux-Montréal', address: 'Rue Saint-Vincent', lat: 45.5070714, lng: -73.5534284, blurb: 'Petit bar de la rue Saint-Vincent, dans le Vieux.' },
  { id: 'osm:node/9500927617', category: 'bar', rank: 10, photo: U('1792343948361-1f57fbff12e9'), name: 'Midway', kind: 'Bar', area: 'Quartier des spectacles', address: '1219 boulevard Saint-Laurent', lat: 45.5097464, lng: -73.5632684, blurb: 'Bar de la Main, à deux pas des salles de spectacle.' },

  // ---------- Soirées récurrentes ----------
  { id: 'cat:igloofest-2027', category: 'soiree', rank: 1, photo: U('1656283384093-1e227e621fad'), name: 'Igloofest', kind: 'Festival électro', area: 'Vieux-Port', address: 'Quai Jacques-Cartier', lat: 45.5073098, lng: -73.5487733, when: 'Chaque fin de semaine, du 14 janv. au 6 févr. 2027', from: '2026-11-01', to: '2027-02-06', blurb: 'Le festival de musique électronique le plus froid : KAYTRANADA, Fatboy Slim, deadmau5, Boris Brejcha à l\'affiche.' },
  { id: 'cat:barbossa-jazz', category: 'soiree', rank: 2, photo: U('1774544809959-1991aa21c904'), name: 'Jazz du lundi au Barbossa', kind: 'Musique live', area: 'Plateau', address: 'Boulevard Saint-Laurent', lat: 45.5166375, lng: -73.5789966, when: 'Tous les lundis', blurb: 'Jazz en direct chaque lundi soir sur la Main.' },
  { id: 'cat:mtlatable-2026', category: 'soiree', rank: 3, photo: U('1716194769922-a969b2ece6c5'), name: 'MTLàTABLE', kind: 'Semaine des restos', area: 'Partout en ville', lat: 45.5088, lng: -73.5617, when: 'Jusqu\'au 15 nov. 2026', from: '2026-10-29', to: '2026-11-15', blurb: 'Tables d\'hôte à prix réduit dans des dizaines de restaurants. Dernière fin de semaine !' },

  // ---------- Temps des fêtes ----------
  { id: 'cat:grand-marche-noel-2026', category: 'fetes', rank: 1, photo: U('1765044203136-fa42c59771ff'), name: 'Grand Marché de Noël de Montréal', kind: 'Marché de Noël', area: 'Quartier des spectacles', address: 'Place des Festivals', lat: 45.5074387, lng: -73.5673739, when: '13 nov. 2026 – 3 janv. 2027', from: '2026-11-13', to: '2027-01-03', free: true, blurb: 'Une cinquantaine de chalets d\'artisans, boissons chaudes et gourmandises en plein centre-ville.' },
  { id: 'cat:marche-pvm-2026', category: 'fetes', rank: 2, photo: U('1732989359382-1f37cde4479e'), name: 'Marché hivernal de PVM', kind: 'Marché de Noël', area: 'Centre-ville', address: 'Esplanade Place Ville Marie', lat: 45.5016, lng: -73.5692, when: '17 nov. – 13 déc. 2026', from: '2026-11-17', to: '2026-12-13', free: true, blurb: 'Marché d\'hiver sur l\'esplanade de Place Ville Marie.' },
  { id: 'cat:village-noel-atwater-2026', category: 'fetes', rank: 3, photo: U('1575410813944-8fe3f5dca6fe'), name: 'Village de Noël de Montréal', kind: 'Marché de Noël', area: 'Quartiers du Canal', address: 'Marché Atwater', lat: 45.4796443, lng: -73.5767813, when: '26 nov. – 24 déc. 2026', from: '2026-11-26', to: '2026-12-24', free: true, blurb: 'Village de Noël au marché Atwater, au bord du canal.' },
  { id: 'cat:marche-vieux-port-2026', category: 'fetes', rank: 4, photo: U('1733991354048-26f6b5eb7e81'), name: 'Marché artisanal du Vieux-Port', kind: 'Marché de Noël', area: 'Vieux-Port', address: 'Pavillon Jacques-Cartier, 2 rue de la Commune Est', lat: 45.5073098, lng: -73.5487733, when: '27–29 nov. et 4–6 déc. 2026', from: '2026-11-27', to: '2026-12-06', free: true, blurb: 'Artisans et créateurs locaux au bord du fleuve.' },
  { id: 'cat:noel-parc-2026', category: 'fetes', rank: 5, photo: U('1764422474375-97b032a5190d'), name: 'Noël dans le parc', kind: 'Marché et concerts', area: 'Plateau', address: 'Parc La Fontaine', lat: 45.5262562, lng: -73.5689672, when: '4 – 25 déc. 2026', from: '2026-12-04', to: '2026-12-25', free: true, blurb: 'Le marché OFF de Noël : sapins, feu, musique et chocolat chaud.' },
  { id: 'cat:salon-metiers-art-2026', category: 'fetes', rank: 6, photo: U('1701943513658-b66020f2d6ef'), name: 'Salon des métiers d\'art du Québec', kind: 'Salon', area: 'Vieux-Port', address: 'Grand Quai, 200 rue de la Commune Ouest', lat: 45.5027244, lng: -73.550422, when: '15 – 20 déc. 2026', from: '2026-12-15', to: '2026-12-20', blurb: 'Le grand rendez-vous des artisans pour les cadeaux de dernière minute.' },
  { id: 'cat:jean-talon-fetes-2026', category: 'fetes', rank: 7, photo: U('1766126222376-797d87966c88'), name: 'Marché des fêtes Jean-Talon', kind: 'Marché de Noël', area: 'Petite Italie', address: '7070 avenue Henri-Julien', lat: 45.5359145, lng: -73.6150625, when: 'Fins de semaine du 4 au 20 déc. 2026', from: '2026-12-04', to: '2026-12-20', free: true, blurb: 'Produits locaux et cadeaux gourmands au marché Jean-Talon.' },

  // ---------- Gourmand ----------
  { id: 'cat:raw-wine-2026', category: 'gastro', rank: 1, photo: U('1621866908556-4f0a830707c9'), name: 'RAW WINE Montréal', kind: 'Salon des vins', area: 'Vieux-Port', address: 'Grand Quai du Port de Montréal', lat: 45.5027244, lng: -73.550422, when: 'Fin de semaine du 13 au 15 nov. 2026', from: '2026-11-01', to: '2026-11-15', blurb: 'Vins naturels, bio et biodynamiques : une fin de semaine de dégustation avec des vignerons du monde entier.' },
  { id: 'cat:timeout-fetes-2026', category: 'gastro', rank: 2, photo: U('1703692331013-84894ff8cdab'), name: 'Marché des Fêtes du Time Out Market', kind: 'Marché gourmand', area: 'Centre-ville', address: '705 rue Sainte-Catherine Ouest', lat: 45.5024818, lng: -73.5706406, when: '18 – 20 déc. 2026', from: '2026-11-01', to: '2026-12-20', blurb: 'Marché des fêtes dans l\'aire gourmande du Centre Eaton.' },
  { id: 'cat:noel-vegane-2026', category: 'gastro', rank: 3, photo: U('1769690094015-d68518b79d6f'), name: 'Marché de Noël Végane', kind: 'Marché gourmand', area: 'Quartier des spectacles', address: 'Salle Agora, 175 av. du Président-Kennedy', lat: 45.5093537, lng: -73.5692907, when: '5 – 6 déc. 2026', from: '2026-11-01', to: '2026-12-06', blurb: 'Gourmandises et cadeaux 100 % véganes.' },
  { id: 'cat:mtl-en-lumiere-2027', category: 'gastro', rank: 4, photo: U('1766348248661-f4888351ad94'), name: 'MONTRÉAL EN LUMIÈRE', kind: 'Festival gourmand', area: 'Quartier des spectacles', address: 'Place des Festivals', lat: 45.5074387, lng: -73.5673739, when: '18 – 28 févr. 2027', from: '2026-11-01', to: '2027-02-28', blurb: 'Le grand festival d\'hiver : chefs invités, gastronomie et activités extérieures.' },
  // Activités à toute heure (adresses : fiches Maps des établissements, novembre 2026). Horaires à vérifier auprès de chaque lieu.
  { id: 'act:funhub-centre-ville', category: 'jeux', rank: 1, photo: U('1511512578047-dfb367046420'), name: "FUNHUB Centre-ville", kind: "Arcade et réalité virtuelle", area: "Centre-ville", address: "733 rue Cathcart", lat: 45.50221, lng: -73.56969, blurb: "Arcades haut de gamme, réalité virtuelle en équipe, billard, fléchettes et un resto-bar." },
  { id: 'act:prison-island', category: 'jeux', rank: 2, photo: U('1569002925653-ed18f55d7292'), name: "Prison Island Montréal", kind: "Défis en équipe", area: "Centre-ville", address: "1231 rue Sainte-Catherine Ouest, local 202", lat: 45.49847, lng: -73.57488, blurb: "Des dizaines de cellules à défis physiques et casse-têtes, à faire en petite équipe." },
  { id: 'act:sandbox-vr', category: 'jeux', rank: 3, photo: U('1535223289827-42f1e9919769'), name: "Sandbox VR Centre-ville", kind: "Réalité virtuelle", area: "Centre-ville", address: "1231 rue Sainte-Catherine Ouest", lat: 45.49843, lng: -73.57466, blurb: "Aventures en réalité virtuelle à plusieurs, en corps entier." },
  { id: 'act:north-star', category: 'jeux', rank: 4, photo: U('1640301133815-4bec64fca33f'), name: "North Star Machines à piastres", kind: "Bar à flippers", area: "Plateau", address: "3908 boulevard Saint-Laurent", lat: 45.51631, lng: -73.57825, blurb: "Bar de la Main rempli de flippers et de jeux d'arcade classiques." },
  { id: 'act:arcade-mtl', category: 'jeux', rank: 5, photo: U('1558271697-dd9f331ca8b3'), name: "Arcade MTL", kind: "Bar arcade", area: "Quartier latin", address: "2031 rue Saint-Denis", lat: 45.51636, lng: -73.56584, blurb: "Entrée unique, jeux illimités et pop-corn à volonté, en plein Quartier latin." },
  { id: 'act:randolph-quartier-latin', category: 'jeux', rank: 6, photo: U('1677188010559-0667a1ed33a0'), name: "Randolph Pub Ludique", kind: "Pub de jeux de société", area: "Quartier latin", address: "2041 rue Saint-Denis", lat: 45.5164, lng: -73.56595, blurb: "Des centaines de jeux de société et des animateurs pour expliquer les règles." },
  { id: 'act:cafe-yvonne', category: 'jeux', rank: 7, photo: U('1677188010559-0667a1ed33a0'), name: "Café Yvonne", kind: "Café jeux de société", area: "Plateau", address: "3778A rue Saint-Denis", lat: 45.51905, lng: -73.57252, blurb: "Petit café du Plateau pour jouer entre amis autour d'un latte." },
  { id: 'act:colonel-moutarde', category: 'jeux', rank: 8, photo: U('1514863775978-c611132e6691'), name: "Le Colonel Moutarde", kind: "Café-resto ludique", area: "Plateau", address: "4418 rue Saint-Denis", lat: 45.52331, lng: -73.58185, blurb: "Bouffe, bières et une grande ludothèque, en plein Plateau." },
  { id: 'act:cafe-bloc', category: 'jeux', rank: 9, photo: U('1564769662533-4f00a87b4056'), name: "Café Bloc", kind: "Escalade de bloc", area: "Quartier chinois", address: "1209 boulevard Saint-Laurent", lat: 45.50969, lng: -73.56311, blurb: "Salle de bloc avec café, au pied du Quartier latin. Location de chaussons sur place." },
  { id: 'act:allez-up', category: 'jeux', rank: 10, photo: U('1696105538782-7815474f28e0'), name: "Allez Up", kind: "Escalade", area: "Pointe-Saint-Charles", address: "1555 rue Saint-Patrick", lat: 45.48688, lng: -73.56102, blurb: "Grande salle d'escalade dans d'anciens silos, au bord du canal de Lachine." },
  { id: 'act:bloc-shop-hochelaga', category: 'jeux', rank: 11, photo: U('1696105538708-6be6c90707a1'), name: "Bloc Shop Hochelaga", kind: "Escalade de bloc", area: "Hochelaga", address: "2985 rue Sainte-Catherine Est", lat: 45.53633, lng: -73.54322, blurb: "Bloc pour tous les niveaux, ambiance détendue et cours d'initiation." },
  { id: 'act:ezkapaz', category: 'jeux', rank: 12, photo: U('1782472312824-cc8c39a26bbd'), name: "EZKAPAZ", kind: "Escape game", area: "Plateau", address: "3955 boulevard Saint-Laurent", lat: 45.5165, lng: -73.57809, blurb: "Jeux d'évasion immersifs, à faire à 2 comme à 8." },
  { id: 'act:question-escape', category: 'jeux', rank: 13, photo: U('1569002925653-ed18f55d7292'), name: "QUESTION Escape Games", kind: "Escape game", area: "Plateau", address: "4119 boulevard Saint-Laurent", lat: 45.51772, lng: -73.5806, blurb: "Salles d'évasion à énigmes sur la Main." },
  { id: 'act:trapped-mtl', category: 'jeux', rank: 14, photo: U('1782472312824-cc8c39a26bbd'), name: "TRAPPED Montréal", kind: "Escape game", area: "Quartier des spectacles", address: "1405 boulevard Saint-Laurent, 3e étage", lat: 45.51014, lng: -73.5641, blurb: "Salles à thème au cœur du Quartier des spectacles." },
  { id: 'act:rage-academie', category: 'jeux', rank: 15, photo: U('1776951129406-d844d86ebccd'), name: "Rage Académie", kind: "Lancer de hache", area: "Village", address: "1436 rue Atateken", lat: 45.51765, lng: -73.55768, blurb: "Lancer de hache encadré par des moniteurs, parfait en groupe." },
  { id: 'act:combat-archers', category: 'jeux', rank: 16, photo: U('1776847651583-1d804b5cc339'), name: "Combat d'Archers", kind: "Tir à l'arc en équipe", area: "Hochelaga", address: "3955 rue de Rouen", lat: 45.5504, lng: -73.54569, blurb: "Le ballon chasseur version tir à l'arc, avec flèches à embout mousse." },
  { id: 'act:zero-latency', category: 'jeux', rank: 17, photo: U('1576633587382-13ddf37b1fc1'), name: "Zero Latency VR", kind: "Réalité virtuelle", area: "Villeray", address: "910 rue Jean-Talon Est", lat: 45.54126, lng: -73.61268, blurb: "Grande arène de réalité virtuelle en libre déplacement, jusqu'à 8 joueurs." },
  { id: 'act:le-mic', category: 'jeux', rank: 18, photo: U('1531463368359-151247409561'), name: "Le Mic Karaoke Lounge", kind: "Karaoké privé", area: "Centre-ville", address: "1695 boulevard De Maisonneuve Ouest", lat: 45.49474, lng: -73.58057, blurb: "Salles de karaoké privées pour chanter entre amis." },
  { id: 'act:quilles-darling', category: 'jeux', rank: 19, photo: U('1763819527452-f01bfb155013'), name: "Salon de quilles Darling", kind: "Quilles", area: "Hochelaga", address: "3350 rue Ontario Est", lat: 45.54278, lng: -73.54611, blurb: "Salon de quilles de quartier, ambiance rétro." },
  { id: 'act:montreal-bowling', category: 'jeux', rank: 20, photo: U('1538511059256-46e76f13f071'), name: "Montreal Bowling", kind: "Quilles", area: "Centre-ville", address: "2313 rue Sainte-Catherine Ouest, 4e étage", lat: 45.48987, lng: -73.58414, blurb: "Quilles au Forum de Montréal, en plein centre-ville." },
]

/** Cartes pas encore terminées (les événements à venir restent visibles pour donner envie). */
export function activeCatalog(now = new Date()) {
  const today = now.toISOString().slice(0, 10)
  return CATALOG.filter((c) => !c.to || c.to >= today)
}

// Vidéos d'ambiance Mixkit (licence gratuite Mixkit, usage commercial libre).
const MK = (id: number) => `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`
const CAT_VIDEOS: Record<Category, string[]> = {
  club: [MK(9586), MK(341), MK(832)],
  bar: [MK(4043), MK(4295), MK(22441)],
  soiree: [MK(14088), MK(4043), MK(341)],
  fetes: [MK(46591), MK(29479), MK(34702), MK(41949)],
  gastro: [MK(32558), MK(22441), MK(4295)],
  jeux: [MK(41913), MK(49588), MK(50929), MK(5333)],
}
/** Vidéo choisie pour chaque lieu selon ce qu'on y fait (Noël, jazz, cocktails, vinyles…). Mixkit, licence gratuite. */
const VIDEO_OF: Record<string, number> = {
  'act:funhub-centre-ville': 41913,
  'act:prison-island': 50922,
  'act:sandbox-vr': 43597,
  'act:north-star': 41913,
  'act:arcade-mtl': 41924,
  'act:randolph-quartier-latin': 5333,
  'act:cafe-yvonne': 5333,
  'act:colonel-moutarde': 5333,
  'act:cafe-bloc': 50929,
  'act:allez-up': 50922,
  'act:bloc-shop-hochelaga': 50929,
  'act:ezkapaz': 42185,
  'act:question-escape': 42185,
  'act:trapped-mtl': 42185,
  'act:zero-latency': 52068,
  'act:le-mic': 4632,
  'act:quilles-darling': 49588,
  'act:montreal-bowling': 49587,
  'osm:node/4486771295': 832,
  'osm:node/6005804263': 45439,
  'osm:node/11888760955': 4187,
  'osm:node/13234865274': 1352,
  'osm:node/2424892846': 33900,
  'osm:node/2424590588': 33899,
  'osm:node/13947882201': 303,
  'osm:node/3744335928': 14105,
  'osm:node/458918546': 14106,
  'osm:node/11265181044': 33901,
  'osm:node/13739215443': 4172,
  'osm:node/5416663552': 4043,
  'osm:node/13936960001': 42920,
  'osm:node/11973468695': 24823,
  'osm:node/11265612651': 50319,
  'osm:node/4654823871': 486,
  'osm:way/122209641': 25459,
  'osm:node/5893382885': 22441,
  'osm:node/12194843602': 4295,
  'osm:node/9500927617': 15171,
  'cat:igloofest-2027': 13265,
  'cat:barbossa-jazz': 24759,
  'cat:mtlatable-2026': 13261,
  'cat:grand-marche-noel-2026': 29431,
  'cat:marche-pvm-2026': 46591,
  'cat:village-noel-atwater-2026': 46530,
  'cat:marche-vieux-port-2026': 25034,
  'cat:noel-parc-2026': 3323,
  'cat:salon-metiers-art-2026': 13979,
  'cat:jean-talon-fetes-2026': 22743,
  'cat:raw-wine-2026': 41257,
  'cat:timeout-fetes-2026': 39535,
  'cat:noel-vegane-2026': 13258,
  'cat:mtl-en-lumiere-2027': 15875,
}
for (const c of CATALOG) if (!c.video && VIDEO_OF[c.id]) c.video = MK(VIDEO_OF[c.id])

export const isVideo = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url)
/** Miniature d'une vidéo Mixkit (affichée avant la lecture). */
export const posterOf = (url: string) => url.match(/assets\.mixkit\.co\/videos\/(\d+)\//) ? url.replace(/-720\.mp4$/, '-thumb-720-0.jpg') : undefined

/** Galerie de la fiche : la photo du lieu, une vidéo d'ambiance, puis deux autres photos de la même catégorie. */
export function galleryOf(p: CatalogItem): string[] {
  if (p.gallery?.length) return p.gallery
  const same = CATALOG.filter((c) => c.category === p.category && c.id !== p.id && c.photo)
  const i = Math.max(0, CATALOG.findIndex((c) => c.id === p.id))
  const vids = CAT_VIDEOS[p.category]
  const extra = [same[(i + 1) % Math.max(1, same.length)]?.photo, same[(i + 3) % Math.max(1, same.length)]?.photo]
  return [...new Set([p.video, p.photo, vids[i % vids.length], ...extra].filter((x): x is string => !!x))]
}
