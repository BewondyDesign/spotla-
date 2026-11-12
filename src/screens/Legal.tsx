import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useLang } from '../data/i18n'
import { CONTACT_EMAIL } from '../config'

/**
 * Pages publiques (sans compte, sans écran d'âge) exigées par l'App Store, Google Play et Meta :
 * conditions d'utilisation, politique de confidentialité, règles de la communauté, suppression du compte.
 * Adresses : https://spotla.vercel.app/#/legal/conditions · /confidentialite · /regles · /suppression
 */
const UPDATED = '12 novembre 2026'
const UPDATED_EN = 'November 12, 2026'

type Doc = { title: string; body: (string | [string, string[]])[] }

const contact = (en: boolean) => CONTACT_EMAIL
  ? (en ? `by email at ${CONTACT_EMAIL} or with the "Contact SpotLa" form in Settings` : `par e-mail à ${CONTACT_EMAIL} ou avec le formulaire « Contacter SpotLa » dans les Réglages`)
  : (en ? 'with the "Contact SpotLa" form in the app (Settings)' : 'avec le formulaire « Contacter SpotLa » dans l\'app (Réglages)')

function fr(): Record<string, Doc> {
  const c = contact(false)
  return {
    conditions: { title: 'Conditions d\'utilisation', body: [
      `Dernière mise à jour : ${UPDATED}. En créant un compte ou en utilisant SpotLa, tu acceptes ces conditions.`,
      ['1. Qui peut utiliser SpotLa', ['SpotLa est réservé aux personnes de 18 ans et plus. Fournir un faux âge entraîne la suppression du compte.', 'Un seul compte par personne. Les comptes « business » doivent représenter un lieu ou un organisateur réel.']],
      ['2. Ce que fait SpotLa', ['SpotLa aide à trouver des sorties, des lieux et des activités pour adultes près de toi, et à y aller seul·e ou à plusieurs.', 'Les informations sur les lieux et l\'agenda (horaires, prix, adresses) viennent des membres, des lieux et de sources publiques comme les données ouvertes de la Ville de Montréal. Elles peuvent changer : vérifie auprès du lieu avant de te déplacer.']],
      ['3. Tolérance zéro', ['Aucun contenu ou comportement abusif n\'est toléré : harcèlement, haine, menaces, contenu sexuel, nudité, violence, drogues, arnaques, usurpation d\'identité, contenu visant des enfants ou impliquant des mineurs.', 'Tout contenu qui ne respecte pas les Règles de la communauté peut être retiré sans préavis, et le compte suspendu ou supprimé.', 'Chaque contenu et chaque profil peut être signalé, et chaque membre peut être bloqué. L\'équipe examine les signalements sous 24 heures et retire le contenu fautif ainsi que son auteur si nécessaire.']],
      ['4. Tes contenus', ['Tu restes propriétaire de ce que tu publies (sorties, photos, vidéos, stories, commentaires, messages).', 'Tu donnes à SpotLa le droit non exclusif et gratuit de les afficher dans l\'app et dans les partages que tu fais, le temps qu\'ils restent publiés.', 'Tu dois avoir le droit de publier ce que tu publies, y compris l\'accord des personnes qui apparaissent sur tes photos et vidéos.']],
      ['5. Sorties et sécurité', ['Les sorties sont organisées par les membres et les lieux, pas par SpotLa. Tu restes responsable de ta sécurité : retrouve les gens dans un lieu public, préviens un proche, et ne pars jamais avec quelqu\'un qui te met mal à l\'aise.', 'L\'adresse exacte des sorties privées n\'est montrée que 2 heures avant le début, aux personnes acceptées.', 'L\'abus d\'alcool est dangereux pour la santé. Consomme avec modération et ne prends jamais le volant après avoir bu.']],
      ['6. Comptes professionnels', ['La mise en avant d\'une sortie est gratuite pendant la période de lancement. Aucun paiement n\'est demandé dans l\'app.']],
      ['7. Suppression', ['Tu peux supprimer ton compte à tout moment depuis Réglages → Supprimer mon compte. Tes données sont alors effacées (voir la Politique de confidentialité).', 'SpotLa peut suspendre ou fermer un compte qui ne respecte pas ces conditions.']],
      ['8. Responsabilité', ['SpotLa est fourni « tel quel ». Dans les limites permises par la loi, SpotLa n\'est pas responsable des sorties, des lieux, ni des échanges entre membres.']],
      ['9. Droit applicable', ['Ces conditions sont régies par les lois du Québec et du Canada.', `Questions : ${c}.`]],
    ] },
    confidentialite: { title: 'Politique de confidentialité', body: [
      `Dernière mise à jour : ${UPDATED}. Cette politique explique quels renseignements SpotLa recueille, pourquoi, et comment tu gardes le contrôle. Elle respecte la Loi 25 du Québec et la LPRPDE (Canada).`,
      ['Ce que nous recueillons', ['Compte : adresse e-mail, nom affiché, nom d\'utilisateur, photo de profil, ville, et date de confirmation de tes 18 ans. Si tu te connectes avec Google, Facebook ou Apple, nous recevons seulement ton nom, ton e-mail et ta photo.', 'Tes contenus : sorties publiées, publications, photos, vidéos, stories, commentaires, messages du groupe « J\'y vais seul·e », avis et « j\'aime » sur les lieux, votes d\'ambiance, lien Instagram si tu l\'ajoutes.', 'Ta position : utilisée sur ton téléphone pour montrer ce qui se passe près de toi. Elle n\'est pas enregistrée dans ton profil ni montrée aux autres membres. Tu peux refuser la localisation et choisir ta ville à la main.', 'Sécurité : signalements que tu envoies, membres que tu bloques.', 'Technique : langue de l\'app et préférences enregistrées sur ton appareil.', 'Mesure d\'utilisation : pour améliorer l\'app, nous notons les actions principales (ouverture, écrans vus, « J\'y vais », partages) avec un identifiant au hasard propre à ton appareil, et les erreurs techniques (message d\'erreur, type d\'appareil). Pas d\'adresse IP, aucun service externe : tout reste dans la base de SpotLa.']],
      ['Ce que nous ne faisons pas', ['Pas de publicité ciblée, pas de revente de données, pas de traçage entre applications ou sites.']],
      ['Pourquoi', ['Faire fonctionner l\'app (compte, sorties, groupes, partages), te montrer les sorties proches et celles que tu aimes, assurer la sécurité et la modération, répondre à tes demandes.']],
      ['Qui y a accès', ['Les autres membres voient ton profil public et ce que tu publies. Les messages de groupe ne sont visibles que par les membres du groupe.', 'Nos sous-traitants techniques, uniquement pour faire fonctionner l\'app : Supabase (base de données, connexion et stockage), Vercel (hébergement), Google, Meta et Apple (si tu choisis leur connexion), OpenStreetMap / Photon (recherche d\'adresse, sans ton identité).', 'Les données peuvent être hébergées hors du Québec (Canada ou États-Unis), avec des protections équivalentes.']],
      ['Combien de temps', ['Tant que ton compte existe. Les stories disparaissent après 24 h. Les groupes de discussion ferment 12 h après la fin de la sortie. Les signalements sont gardés 1 an pour la sécurité.', 'Quand tu supprimes ton compte, ton profil et tous tes contenus sont effacés immédiatement de l\'app, puis des sauvegardes sous 30 jours.']],
      ['Tes droits', ['Tu peux consulter, corriger ou supprimer tes renseignements à tout moment : la plupart directement dans Réglages, et la suppression complète dans Réglages → Supprimer mon compte.', `Pour toute autre demande (copie de tes données, retrait du consentement, plainte), écris au responsable de la protection des renseignements personnels de SpotLa ${c}. Tu peux aussi t\'adresser à la Commission d\'accès à l\'information du Québec.`]],
      ['Personnes mineures', ['SpotLa est réservé aux 18 ans et plus. Si nous apprenons qu\'un compte appartient à une personne mineure, il est supprimé.']],
    ] },
    regles: { title: 'Règles de la communauté', body: [
      'SpotLa, c\'est pour sortir, rencontrer du monde et passer un bon moment, en sécurité. Ces règles s\'appliquent partout : profils, sorties, stories, publications, commentaires et messages.',
      ['Ce qui est interdit', ['Harcèlement, intimidation, menaces, propos haineux ou discriminatoires.', 'Nudité, contenu sexuel, sollicitation ou services sexuels.', 'Violence, armes, mise en danger, incitation à l\'abus d\'alcool.', 'Vente ou promotion de drogues ou de produits illégaux.', 'Arnaques, spam, faux profils, usurpation d\'un lieu ou d\'une personne.', 'Toute activité pour enfants ou familles, et tout contenu montrant ou visant des personnes mineures.', 'Publier l\'adresse privée ou les infos personnelles de quelqu\'un sans son accord.']],
      ['Ce qu\'on attend de toi', ['Être respectueux·se, en ligne et sur place.', 'Retrouver les gens dans un lieu public.', 'Publier des sorties réelles, avec des infos exactes.']],
      ['Signaler et bloquer', ['Touche le drapeau sur un profil, une publication, un commentaire, une story, un message ou une sortie pour le signaler. Tu peux aussi bloquer la personne.', 'L\'équipe examine chaque signalement sous 24 heures. Un contenu signalé par plusieurs personnes est retiré automatiquement en attendant. Les comptes qui ne respectent pas ces règles sont suspendus ou supprimés.', 'En cas de danger immédiat, appelle le 911.']],
    ] },
    suppression: { title: 'Supprimer ton compte SpotLa', body: [
      'Tu peux supprimer ton compte et toutes tes données à tout moment, directement dans l\'app :',
      ['Dans l\'app', ['Ouvre SpotLa et va sur ton Profil.', 'Touche l\'icône Réglages (roue dentée).', 'Tout en bas, touche « Supprimer mon compte », écris SUPPRIMER puis confirme.']],
      ['Ce qui est effacé', ['Ton compte de connexion, ton profil, ta photo et ta couverture.', 'Tes sorties, publications, photos, vidéos, stories, commentaires, messages, avis, « j\'aime » et votes.', 'Tes abonnements, tes blocages et tes inscriptions aux sorties.', 'L\'effacement est immédiat dans l\'app, puis complet dans les sauvegardes sous 30 jours. Les signalements que tu as envoyés sont gardés 1 an de façon anonyme, pour la sécurité.']],
      ['Tu n\'as plus accès à l\'app ?', [`Fais ta demande ${c}, depuis l\'adresse e-mail de ton compte. Nous la traitons sous 30 jours.`]],
    ] },
  }
}

function en(): Record<string, Doc> {
  const c = contact(true)
  return {
    conditions: { title: 'Terms of use', body: [
      `Last updated: ${UPDATED_EN}. By creating an account or using SpotLa, you accept these terms.`,
      ['1. Who can use SpotLa', ['SpotLa is for people 18 and older. Giving a false age leads to account deletion.', 'One account per person. Business accounts must represent a real venue or organiser.']],
      ['2. What SpotLa does', ['SpotLa helps you find adult outings, places and activities near you, and go solo or with friends.', 'Venue and agenda information (hours, prices, addresses) comes from members, venues and public sources such as the City of Montréal open data. It may change: check with the venue before heading out.']],
      ['3. Zero tolerance', ['No abusive content or behaviour is tolerated: harassment, hate, threats, sexual content, nudity, violence, drugs, scams, impersonation, content aimed at children or involving minors.', 'Content that breaks the Community rules can be removed without notice, and the account suspended or deleted.', 'Every piece of content and every profile can be reported, and every member can be blocked. The team reviews reports within 24 hours and removes offending content and its author when needed.']],
      ['4. Your content', ['You own what you post (outings, photos, videos, stories, comments, messages).', 'You give SpotLa a free, non-exclusive right to display it in the app and in the shares you make, for as long as it stays published.', 'You must have the right to post it, including consent from people who appear in your photos and videos.']],
      ['5. Outings and safety', ['Outings are organised by members and venues, not by SpotLa. You are responsible for your own safety: meet people in public places, tell a friend, and never leave with someone who makes you uncomfortable.', 'The exact address of private outings is only shown 2 hours before the start, to accepted people.', 'Alcohol abuse is dangerous. Drink responsibly and never drive after drinking.']],
      ['6. Business accounts', ['Promoting an outing is free during the launch period. No payment is requested in the app.']],
      ['7. Deletion', ['You can delete your account at any time from Settings → Delete my account. Your data is then erased (see the Privacy policy).', 'SpotLa may suspend or close accounts that break these terms.']],
      ['8. Liability', ['SpotLa is provided "as is". To the extent permitted by law, SpotLa is not responsible for outings, venues or exchanges between members.']],
      ['9. Governing law', ['These terms are governed by the laws of Québec and Canada.', `Questions: ${c}.`]],
    ] },
    confidentialite: { title: 'Privacy policy', body: [
      `Last updated: ${UPDATED_EN}. This policy explains what SpotLa collects, why, and how you stay in control. It follows Québec's Law 25 and Canada's PIPEDA.`,
      ['What we collect', ['Account: email, display name, username, profile photo, city, and the date you confirmed being 18+. If you sign in with Google, Facebook or Apple, we only receive your name, email and photo.', 'Your content: outings, posts, photos, videos, stories, comments, "Going solo" group messages, venue reviews and likes, vibe votes, Instagram link if you add it.', 'Your location: used on your phone to show what\'s happening near you. It is not saved to your profile nor shown to other members. You can refuse location and pick your city manually.', 'Safety: reports you send, members you block.', 'Technical: app language and preferences stored on your device.', 'Usage measurement: to improve the app, we record the main actions (opening, screens viewed, "I\'m going", shares) with a random identifier specific to your device, and technical errors (error message, device type). No IP address, no outside service: everything stays in SpotLa\'s database.']],
      ['What we don\'t do', ['No targeted advertising, no selling of data, no tracking across apps or websites.']],
      ['Why', ['To run the app (account, outings, groups, sharing), show nearby outings and the ones you like, keep the community safe and moderated, and answer your requests.']],
      ['Who can see it', ['Other members see your public profile and what you post. Group messages are only visible to group members.', 'Our technical providers, only to run the app: Supabase (database, sign-in and storage), Vercel (hosting), Google, Meta and Apple (if you use their sign-in), OpenStreetMap / Photon (address search, without your identity).', 'Data may be hosted outside Québec (Canada or the United States) with equivalent protection.']],
      ['How long', ['As long as your account exists. Stories disappear after 24 h. Group chats close 12 h after the outing ends. Reports are kept 1 year for safety.', 'When you delete your account, your profile and all your content are erased from the app immediately, and from backups within 30 days.']],
      ['Your rights', ['You can view, correct or delete your information at any time: most of it directly in Settings, and full deletion in Settings → Delete my account.', `For any other request (copy of your data, withdrawing consent, complaint), contact SpotLa's privacy officer ${c}. You can also contact the Commission d'accès à l'information du Québec.`]],
      ['Minors', ['SpotLa is for people 18 and older. If we learn an account belongs to a minor, it is deleted.']],
    ] },
    regles: { title: 'Community rules', body: [
      'SpotLa is for going out, meeting people and having a good time, safely. These rules apply everywhere: profiles, outings, stories, posts, comments and messages.',
      ['Not allowed', ['Harassment, bullying, threats, hateful or discriminatory speech.', 'Nudity, sexual content, sexual solicitation or services.', 'Violence, weapons, endangerment, encouraging alcohol abuse.', 'Selling or promoting drugs or illegal goods.', 'Scams, spam, fake profiles, impersonating a venue or a person.', 'Any activity for children or families, and any content showing or targeting minors.', 'Posting someone\'s private address or personal info without consent.']],
      ['What we expect', ['Be respectful, online and in person.', 'Meet people in public places.', 'Post real outings with accurate info.']],
      ['Report and block', ['Tap the flag on a profile, post, comment, story, message or outing to report it. You can also block the person.', 'The team reviews every report within 24 hours. Content reported by several people is removed automatically in the meantime. Accounts that break these rules are suspended or deleted.', 'In immediate danger, call 911.']],
    ] },
    suppression: { title: 'Delete your SpotLa account', body: [
      'You can delete your account and all your data at any time, right in the app:',
      ['In the app', ['Open SpotLa and go to your Profile.', 'Tap the Settings icon (gear).', 'At the bottom, tap "Delete my account", type SUPPRIMER and confirm.']],
      ['What gets deleted', ['Your sign-in account, profile, photo and cover.', 'Your outings, posts, photos, videos, stories, comments, messages, reviews, likes and votes.', 'Your follows, blocks and outing sign-ups.', 'Deletion is immediate in the app and complete in backups within 30 days. Reports you sent are kept anonymously for 1 year for safety.']],
      ['Can\'t access the app anymore?', [`Send your request ${c}, from your account's email address. We handle it within 30 days.`]],
    ] },
  }
}

export const LEGAL_DOCS = ['conditions', 'confidentialite', 'regles', 'suppression'] as const

export function Legal() {
  const { doc = 'conditions' } = useParams()
  const nav = useNavigate()
  const isEn = useLang((s) => s.lang) === 'en'
  const all = isEn ? en() : fr()
  const d = all[doc] ?? all.conditions
  const back = () => (window.history.length > 1 ? nav(-1) : nav('/'))
  return (
    <div className="scr no-tab legal" data-no-translate>
      <header className="pad set-head">
        <button className="iconbtn soft" onClick={back} aria-label={isEn ? 'Back' : 'Retour'}><ArrowLeft size={20} /></button>
        <h1>{d.title}</h1>
        <span />
      </header>
      <article className="pad legal-body">
        {d.body.map((b, i) => typeof b === 'string'
          ? <p key={i}>{b}</p>
          : <section key={i}><h2>{b[0]}</h2><ul>{b[1].map((li, j) => <li key={j}>{li}</li>)}</ul></section>)}
        <nav className="legal-links">
          {LEGAL_DOCS.filter((k) => k !== doc).map((k) => <button key={k} className="textlink" onClick={() => nav(`/legal/${k}`, { replace: true })}>{all[k].title}</button>)}
        </nav>
      </article>
    </div>
  )
}
