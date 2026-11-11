// Sorties officielles de la Ville de Montréal (calendrier montreal.ca).
// Source : Données ouvertes de Montréal, « Événements publics », licence CC BY 4.0.
// https://donnees.montreal.ca/dataset/evenements-publics — mis à jour chaque jour par la Ville.
const RESOURCE = '6decf611-6f11-4f34-bb36-324d804c9bad'
const API = `https://donnees.montreal.ca/api/3/action/datastore_search?resource_id=${RESOURCE}&limit=5000&sort=date_debut%20asc`

// On garde les sorties (spectacles, fêtes, expos…), pas les séances du conseil ni les ateliers en ligne.
const SKIP_TYPES = new Set(['Initiation à la musique', 'Conseil et comité', 'Assemblée publique', 'Consultation publique', 'Rencontre avec personne élue', 'Informatique', 'Soutien et échange', 'Langues', 'Heure du conte', 'Aide aux devoirs', 'Emploi'])
// Public visé par la Ville : « Adultes » seulement (pas « Pour tous », « Famille », « Enfants »…),
// puis on écarte tout ce qui parle d'enfants, de famille ou d'école dans le titre ou la description.
const KID_WORDS = /enfant|famil|bébé|bebe|tout-petit|toutpetit|parent|jeunesse|jeunes\b|ado\b|ados\b|adolescen|scolaire|garderie|camp de jour|heure du conte|marionnette|\b\d{1,2}\s?(à|-|–)\s?\d{1,2} ans|\bkids?\b|famil|children|toddler|petits?\s(mentors|curieux|explorateurs|lecteurs)|mini-/i
const isAdultOnly = (e) => {
  const aud = clean(e.public_cible)
  if (!/adulte/i.test(aud) || /enfant|famille|préscolaire|tous/i.test(aud)) return false
  return !KID_WORDS.test(`${clean(e.titre)} ${clean(e.description)}`)
}
const clean = (v) => (v == null || v === 'nan' || v === 'NaN' ? '' : String(v).trim())

export default async function handler(req, res) {
  try {
    const r = await fetch(API, { headers: { accept: 'application/json' } })
    if (!r.ok) throw new Error(`Ville de Montréal : ${r.status}`)
    const j = await r.json()
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Montreal' })).toISOString().slice(0, 10)
    const horizon = new Date(Date.now() + 120 * 864e5).toISOString().slice(0, 10)
    const out = []
    for (const e of j.result.records) {
      const start = clean(e.date_debut).slice(0, 10)
      const end = clean(e.date_fin).slice(0, 10) || start
      const type = clean(e.type_evenement)
      if (!start || end < today || start > horizon) continue
      if (SKIP_TYPES.has(type) || clean(e.emplacement) === 'En ligne') continue
      // SpotLa est réservé aux 18 ans et plus : on ne garde que les activités prévues pour les adultes.
      if (!isAdultOnly(e)) continue
      const lat = parseFloat(e.lat), lng = parseFloat(e.long)
      if (!isFinite(lat) || !isFinite(lng)) continue
      out.push({
        id: `mtl:${e._id}`, title: clean(e.titre), url: clean(e.url_fiche), description: clean(e.description),
        start, end, type, audience: clean(e.public_cible), setting: clean(e.emplacement), signup: clean(e.inscription),
        free: /gratuit/i.test(clean(e.cout)), cost: clean(e.cout), borough: clean(e.arrondissement),
        venue: clean(e.titre_adresse), address: [clean(e.adresse_principale), clean(e.adresse_secondaire)].filter(Boolean).join(', '),
        lat, lng,
      })
    }
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400')
    res.status(200).json({ source: 'Ville de Montréal — Données ouvertes (CC BY 4.0)', updated: today, events: out })
  } catch (err) {
    res.setHeader('Cache-Control', 's-maxage=300')
    res.status(502).json({ error: String(err && err.message || err), events: [] })
  }
}
