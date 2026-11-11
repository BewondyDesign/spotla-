import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, LogOut } from 'lucide-react'
import { askConfirm, toast, useMe, useStore } from '../data/store'
import { accountInfo, cleanHandle, isRemote, updateEmail, updatePassword } from '../data/backend'

/** Réglages du compte : infos de base, e-mail, mot de passe, déconnexion. */
export function Settings() {
  const nav = useNavigate()
  const me = useMe()!
  const updateProfile = useStore((s) => s.updateProfile)
  const logout = useStore((s) => s.logout)
  const [name, setName] = useState(me.name)
  const [handle, setHandle] = useState(me.handle)
  const [city, setCity] = useState(me.city)
  const [bio, setBio] = useState(me.bio)
  const [email, setEmail] = useState('')
  const [email0, setEmail0] = useState('')
  const [google, setGoogle] = useState(false)
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => { if (isRemote) accountInfo().then((a) => { setEmail(a.email); setEmail0(a.email); setGoogle(a.google) }) }, [])

  const dirty = name.trim() !== me.name || handle !== me.handle || city.trim() !== me.city || bio.trim() !== me.bio
  const run = async (k: string, fn: () => Promise<unknown>, ok: string, sub?: string) => {
    setBusy(k)
    try { await fn(); toast(ok, sub) } catch (e) { toast('Ça n\'a pas marché', (e as Error).message) }
    setBusy(null)
  }

  return (
    <div className="scr settings">
      <header className="pad set-head">
        <button className="iconbtn soft" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft size={20} /></button>
        <h1>Réglages</h1>
        <span />
      </header>

      <div className="pad stack16">
        <section className="set-group">
          <h2>Profil</h2>
          <label className="set-row"><span>Nom affiché</span><input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></label>
          <label className="set-row"><span>Nom d'utilisateur</span><div className="set-at">@<input value={handle} onChange={(e) => setHandle(cleanHandle(e.target.value))} autoCapitalize="none" /></div></label>
          <label className="set-row"><span>Ville</span><input value={city} onChange={(e) => setCity(e.target.value)} maxLength={40} /></label>
          <label className="set-row col"><span>Bio</span><textarea rows={2} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} placeholder="Tes spots, ton style de soirée…" /></label>
          {dirty && (
            <button className="btn btn-primary btn-block" disabled={busy === 'p' || name.trim().length < 2 || handle.length < 3}
              onClick={() => run('p', () => updateProfile({ name: name.trim(), handle, city: city.trim(), bio: bio.trim() }), 'Profil mis à jour')}>
              {busy === 'p' ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          )}
        </section>

        <section className="set-group">
          <h2>Compte</h2>
          {!isRemote ? <p className="hint">En mode démo, il n'y a pas d'e-mail ni de mot de passe.</p> : (
            <>
              <label className="set-row"><span>E-mail</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
              {email.trim() && email.trim() !== email0 && (
                <button className="btn btn-ghost btn-block" disabled={busy === 'e'} onClick={() => run('e', () => updateEmail(email.trim()), 'Vérifie ta boîte mail', 'On t\'a envoyé un lien pour confirmer la nouvelle adresse.')}>
                  {busy === 'e' ? 'Envoi…' : 'Changer d\'e-mail'}
                </button>
              )}
              <label className="set-row"><span>{google ? 'Créer un mot de passe' : 'Nouveau mot de passe'}</span><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="8 caractères min." autoComplete="new-password" /></label>
              {pw.length > 0 && (
                <button className="btn btn-ghost btn-block" disabled={pw.length < 8 || busy === 'w'} onClick={() => run('w', async () => { await updatePassword(pw); setPw('') }, 'Mot de passe changé')}>
                  {busy === 'w' ? 'Enregistrement…' : 'Changer le mot de passe'}
                </button>
              )}
              {google && <p className="hint">Tu te connectes avec Google.</p>}
            </>
          )}
        </section>

        <section className="set-group">
          <h2>Préférences</h2>
          <button className="set-row link" onClick={() => nav('/u/me')}><span>Photo, couverture</span><ChevronRight size={18} /></button>
          {me.kind === 'business' && <button className="set-row link" onClick={() => nav('/business')}><span>Espace business</span><ChevronRight size={18} /></button>}
        </section>

        <button className="set-out" onClick={async () => { if (await askConfirm('Se déconnecter ?', 'Se déconnecter')) logout() }}><LogOut size={18} /> Se déconnecter</button>
        <p className="hint center">Pour supprimer ton compte, écris-nous depuis l'adresse de ton compte.</p>
      </div>
    </div>
  )
}
