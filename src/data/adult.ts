// Règle d'âge de SpotLa : 18 ans et plus, aucune activité pour enfants ou familles.
// Le même filtre sert pour l'agenda de la Ville (api/city-events.js), les soirées publiées par les membres et les publications.
export const KID_WORDS = /enfant|famil|bébé|bebe|tout-petit|parent|jeunesse|jeunes\b|\bados?\b|adolescen|scolaire|garderie|camp de jour|heure du conte|marionnette|\b\d{1,2}\s?(à|-|–)\s?\d{1,2} ans|\bkids?\b|children|toddler|petits?\s(mentors|curieux|explorateurs|lecteurs)/i

/** Vrai si le texte vise des enfants ou des familles. */
export const isForKids = (...texts: (string | undefined)[]) => KID_WORDS.test(texts.filter(Boolean).join(' '))

export const KIDS_REFUSED = 'SpotLa est réservé aux 18 ans et plus : les activités pour enfants ou familles ne sont pas acceptées.'
