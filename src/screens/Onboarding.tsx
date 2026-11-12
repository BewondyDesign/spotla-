import { useEffect, useState } from 'react'
import { ArrowLeft, Building2, Camera, Eye, EyeOff, PartyPopper } from 'lucide-react'
import { toast, useStore } from '../data/store'
import { track } from '../data/track'
import { cleanHandle, createProfile, isRemote, uploadMedia, sendPasswordReset, signIn, signInWithGoogle, signInWithFacebook, signInWithApple, signUp, signupInfo, updatePassword } from '../data/backend'
import { TASTES } from '../data/tastes'
import { LangSwitch, useT } from '../data/i18n'
import { Link } from 'react-router-dom'
import type { AccountKind } from '../data/types'

type View = 'welcome' | 'signup' | 'login' | 'forgot' | 'check-email' | 'profile'

/**
 * Entrée dans l'app, comme sur les réseaux sociaux :
 * accueil → « Créer un compte » / « Se connecter » / « Continuer avec Google »,
 * puis on complète le profil (type de compte, ambiances).
 */
export function Onboarding({ authId }: { authId?: string }) {
  const [view, setView] = useState<View>(authId ? 'profile' : 'welcome')
  const [email, setEmail] = useState('')

  if (view === 'welcome') return <Welcome go={setView} />
  if (view === 'profile' || !isRemote) return <ProfileForm authId={authId} />
  if (view === 'signup') return <SignUp go={setView} onEmail={setEmail} />
  if (view === 'login') return <Login go={setView} onEmail={setEmail} email={email} />
  if (view === 'forgot') return <Forgot go={setView} email={email} />
  return <CheckEmail go={setView} email={email} />
}

function Welcome({ go }: { go: (v: View) => void }) {
  const t = useT()
  return (
    <div className="scr onboard">
      <div className="onboard-art"><div className="glow g1" /><div className="glow g2" /><div className="glow g3" /></div>
      <div className="pad onboard-body">
        <div className="row between"><div className="brand"><span className="dot" />SpotLa</div><LangSwitch /></div>
        <h1 className="title-xl">{t('On fait quoi ', 'What\'s the plan ')}<em>{t('maintenant', 'right now')}</em>{t('\u00a0?', '?')}</h1>
        <p className="lede">{t('Les sorties, activités et soirées près de toi, à toute heure. Même seul·e, même si tu ne connais personne en ville.', 'Outings, activities and parties near you, any time of day. Even solo, even if you don\'t know anyone in town.')}</p>
        {isRemote ? (
          <div className="stack12">
            <button className="btn btn-primary btn-block" onClick={() => go('signup')}>{t('Créer un compte', 'Create an account')}</button>
            <SocialButtons />
            <p className="center muted">{t('Tu as déjà un compte ?', 'Already have an account?')} <button className="link-strong" onClick={() => go('login')}>{t('Se connecter', 'Log in')}</button></p>
            <button className="btn btn-ghost btn-block" onClick={() => useStore.getState().setGuest(true)}>{t('Explorer sans compte', 'Browse without an account')}</button>
          </div>
        ) : (
          <>
            <button className="btn btn-primary btn-block" onClick={() => go('profile')}>{t('C\'est parti', 'Let\'s go')}</button>
            <button className="btn btn-ghost btn-block" onClick={() => useStore.getState().setGuest(true)}>{t('Explorer sans compte', 'Browse without an account')}</button>
            <p className="hint center">Mode démo : tes données restent sur cet appareil.</p>
            <TermsNote />
          </>
        )}
      </div>
    </div>
  )
}

/** Connexion par un compte existant : Apple, Google, Facebook, puis la mention des conditions. */
function SocialButtons() {
  return <><AppleButton /><GoogleButton /><FacebookButton /><TermsNote /></>
}

/** Acceptation des conditions, affichée à côté de chaque façon de créer un compte. */
export function TermsNote() {
  const t = useT()
  return (
    <p className="hint center terms-note">
      {t('En continuant, tu confirmes avoir 18 ans ou plus et tu acceptes les ', 'By continuing, you confirm you are 18 or older and accept the ')}
      <Link to="/legal/conditions">{t('Conditions d\'utilisation', 'Terms of Use')}</Link>{t(', les ', ', the ')}
      <Link to="/legal/regles">{t('Règles de la communauté', 'Community Rules')}</Link>{t(' et la ', ' and the ')}
      <Link to="/legal/confidentialite">{t('Politique de confidentialité', 'Privacy Policy')}</Link>.
    </p>
  )
}

function AppleButton() {
  const [busy, setBusy] = useState(false)
  return (
    <button className="btn btn-apple btn-block" disabled={busy} onClick={async () => {
      setBusy(true)
      try { await signInWithApple() } catch (e) { toast('Connexion Apple impossible', (e as Error).message); setBusy(false) }
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.37 12.62c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-2.99-.79-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.89 1.15 9.14.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.39-.92-2.4-3.66zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.66 1.37-.58.67-1.1 1.76-.96 2.8 1.01.08 2.05-.52 2.68-1.28z"/></svg>
      Continuer avec Apple
    </button>
  )
}

function FacebookButton() {
  const [busy, setBusy] = useState(false)
  return (
    <button className="btn btn-fb btn-block" disabled={busy} onClick={async () => {
      setBusy(true)
      try { await signInWithFacebook() } catch (e) { toast('Connexion Facebook impossible', (e as Error).message); setBusy(false) }
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
      Continuer avec Facebook
    </button>
  )
}

function GoogleButton() {
  const [busy, setBusy] = useState(false)
  return (
    <button className="btn btn-light btn-block" disabled={busy} onClick={async () => {
      setBusy(true)
      try { await signInWithGoogle() } catch (e) { toast('Connexion Google impossible', (e as Error).message); setBusy(false) }
    }}>
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
      Continuer avec Google
    </button>
  )
}

function Header({ title, back }: { title: string; back: () => void }) {
  return (
    <div className="stack12">
      <button className="iconbtn" onClick={back} aria-label="Retour"><ArrowLeft size={20} /></button>
      <h2 className="h2">{title}</h2>
    </div>
  )
}

function PasswordField({ id, value, onChange, label = 'Mot de passe', autoComplete }: { id: string; value: string; onChange: (v: string) => void; label?: string; autoComplete: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="field">
      <label className="lbl" htmlFor={id}>{label}</label>
      <div className="pw">
        <input id={id} className="input" type={show ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="pw-eye" onClick={() => setShow(!show)} aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
      </div>
    </div>
  )
}

const emailOk = (e: string) => /^\S+@\S+\.\S+$/.test(e.trim())

function SignUp({ go, onEmail }: { go: (v: View) => void; onEmail: (e: string) => void }) {
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [touched, setTouched] = useState(false)
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // Propose un nom d'utilisateur à partir du nom, tant que la personne ne l'a pas modifié.
  useEffect(() => { if (!touched) setHandle(cleanHandle(name.replace(/\s+/g, '.'))) }, [name, touched])

  const ok = name.trim().length >= 2 && handle.length >= 3 && emailOk(email) && pw.length >= 8
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    setBusy(true); setErr('')
    try {
      onEmail(email.trim())
      const active = await signUp({ email: email.trim(), password: pw, name: name.trim(), handle })
      if (!active) go('check-email')
      // Sinon, la session arrive et l'app passe d'elle-même à l'étape du profil.
    } catch (e) { setErr((e as Error).message); setBusy(false) }
  }

  return (
    <form className="scr" onSubmit={submit}>
      <div className="pad stack16">
        <Header title="Créer un compte" back={() => go('welcome')} />
        <SocialButtons />
        <div className="or"><span>ou</span></div>
        <div className="field">
          <label className="lbl" htmlFor="su-name">Nom</label>
          <input id="su-name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ton prénom ou le nom de ton lieu" />
        </div>
        <div className="field">
          <label className="lbl" htmlFor="su-handle">Nom d'utilisateur</label>
          <div className="handle"><span>@</span><input id="su-handle" className="input" autoCapitalize="none" autoCorrect="off" value={handle} onChange={(e) => { setTouched(true); setHandle(cleanHandle(e.target.value)) }} placeholder="ines.sort" /></div>
          <span className="hint">Lettres, chiffres, points et _ : c'est ton adresse sur SpotLa.</span>
        </div>
        <div className="field">
          <label className="lbl" htmlFor="su-email">E-mail</label>
          <input id="su-email" className="input" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" />
        </div>
        <PasswordField id="su-pw" value={pw} onChange={setPw} autoComplete="new-password" />
        <span className="hint">{pw.length > 0 && pw.length < 8 ? `Encore ${8 - pw.length} caractère${8 - pw.length > 1 ? 's' : ''} minimum.` : '8 caractères minimum.'}</span>
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={!ok || busy}>{busy ? 'Création…' : 'S\'inscrire'}</button>
        <p className="hint center">En t'inscrivant, tu acceptes les règles de la communauté SpotLa.</p>
        <p className="center muted">Déjà inscrit ? <button type="button" className="link-strong" onClick={() => go('login')}>Se connecter</button></p>
      </div>
    </form>
  )
}

function Login({ go, onEmail, email: initial }: { go: (v: View) => void; onEmail: (e: string) => void; email: string }) {
  const [email, setEmail] = useState(initial)
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try { await signIn(email.trim(), pw) } catch (e) { setErr((e as Error).message); setBusy(false) }
  }
  return (
    <form className="scr" onSubmit={submit}>
      <div className="pad stack16">
        <Header title="Se connecter" back={() => go('welcome')} />
        <div className="field">
          <label className="lbl" htmlFor="li-email">E-mail</label>
          <input id="li-email" className="input" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" />
        </div>
        <PasswordField id="li-pw" value={pw} onChange={setPw} autoComplete="current-password" />
        <button type="button" className="textlink right" onClick={() => { onEmail(email.trim()); go('forgot') }}>Mot de passe oublié ?</button>
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={!emailOk(email) || !pw || busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
        <div className="or"><span>ou</span></div>
        <SocialButtons />
        <p className="center muted">Pas encore de compte ? <button type="button" className="link-strong" onClick={() => go('signup')}>Créer un compte</button></p>
      </div>
    </form>
  )
}

function Forgot({ go, email: initial }: { go: (v: View) => void; email: string }) {
  const [email, setEmail] = useState(initial)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  return (
    <form className="scr" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setErr('')
      try { await sendPasswordReset(email.trim()); setSent(true) } catch (e) { setErr((e as Error).message) }
      setBusy(false)
    }}>
      <div className="pad stack16">
        <Header title="Mot de passe oublié" back={() => go('login')} />
        {sent ? (
          <p className="muted">C'est envoyé. Ouvre l'e-mail reçu sur <b>{email}</b> et clique sur le lien pour choisir un nouveau mot de passe.</p>
        ) : (
          <>
            <p className="muted">Entre ton e-mail, on t'envoie un lien pour choisir un nouveau mot de passe.</p>
            <div className="field">
              <label className="lbl" htmlFor="fg-email">E-mail</label>
              <input id="fg-email" className="input" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {err && <p className="error" role="alert">{err}</p>}
            <button className="btn btn-primary btn-block" type="submit" disabled={!emailOk(email) || busy}>{busy ? 'Envoi…' : 'Envoyer le lien'}</button>
          </>
        )}
      </div>
    </form>
  )
}

function CheckEmail({ go, email }: { go: (v: View) => void; email: string }) {
  return (
    <div className="scr">
      <div className="pad stack16">
        <Header title="Confirme ton e-mail" back={() => go('signup')} />
        <p className="muted">On a envoyé un lien à <b>{email}</b>. Clique dessus pour activer ton compte, puis reviens te connecter.</p>
        <button className="btn btn-primary btn-block" onClick={() => go('login')}>J'ai confirmé, me connecter</button>
      </div>
    </div>
  )
}

/** Nouveau mot de passe, après le lien « mot de passe oublié ». */
export function NewPassword() {
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  return (
    <form className="scr" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setErr('')
      try { await updatePassword(pw); useStore.setState({ recovery: false }); toast('Mot de passe modifié', 'Tu es connecté.') } catch (e) { setErr((e as Error).message); setBusy(false) }
    }}>
      <div className="pad stack16">
        <h2 className="h2">Nouveau mot de passe</h2>
        <PasswordField id="np-pw" value={pw} onChange={setPw} label="Nouveau mot de passe" autoComplete="new-password" />
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={pw.length < 8 || busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}

/** Dernière étape : type de compte et ambiances (nom et @ pré-remplis depuis l'inscription ou Google). */
function ProfileForm({ authId }: { authId?: string }) {
  const onboard = useStore((s) => s.onboard)
  const reload = useStore((s) => s.reload)
  const [busy, setBusy] = useState(false)
  const [kind, setKind] = useState<AccountKind>('perso')
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [addr, setAddr] = useState('')
  const [vibes, setVibes] = useState<string[]>([])
  // Sorties dans des bars et des clubs : l'app est réservée aux 18 ans et plus (âge légal au Québec).
  const [adult, setAdult] = useState(false)
  // Photo de profil : celle de Google par défaut, ou une photo choisie.
  const [photo, setPhoto] = useState<{ url: string; file?: File } | null>(null)

  useEffect(() => {
    if (!isRemote || !authId) return
    signupInfo().then((i) => {
      setName((n) => n || i.name); setHandle((h) => h || cleanHandle(i.handle || i.name.replace(/\s+/g, '.')))
      if (i.avatar) setPhoto((ph) => ph ?? { url: i.avatar })
    })
  }, [authId])

  const ok = adult && name.trim().length >= 2 && (!isRemote || handle.length >= 3) && (kind === 'perso' || addr.trim().length > 4)
  const submit = async () => {
    useStore.setState({ adultOk: true, minorBlocked: false, adultAt: new Date().toISOString() })
    const p = { name: name.trim(), kind, vibes, venueAddress: kind === 'business' ? addr.trim() : undefined }
    if (!isRemote) { onboard(p); if (photo) useStore.getState().updateProfile({ avatarUrl: photo.url }); return }
    setBusy(true)
    try {
      let avatarUrl = photo?.url
      if (photo?.file) avatarUrl = await uploadMedia(authId!, photo.file, 'profile').catch(() => undefined)
      await createProfile({ id: authId!, handle, city: useStore.getState().city, ...p, avatarUrl }); track('signup', { kind: p.kind ?? 'perso' }); await reload()
    } catch (e) { toast('Création du profil impossible', (e as Error).message); setBusy(false) }
  }

  return (
    <div className="scr">
      <div className="pad stack18">
        <div className="steps"><i className="on" /><i className="on" /></div>
        <h2 className="h2">Ton profil</h2>
        <label className="pick-photo">
          <span className="pick-photo-img" style={photo ? { backgroundImage: `url(${photo.url})` } : undefined}>{!photo && <Camera size={26} />}</span>
          <span><b>{photo ? 'Changer la photo' : 'Ajoute ta photo'}</b><small>{kind === 'business' ? 'Ton logo ou une photo du lieu' : 'Pour qu\'on te reconnaisse en soirée'}</small></span>
          <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto({ url: URL.createObjectURL(f), file: f }) }} />
        </label>
        <div className="kind-pick" role="radiogroup" aria-label="Type de compte">
          <button role="radio" aria-checked={kind === 'perso'} onClick={() => setKind('perso')}>
            <PartyPopper /><b>Je veux sortir</b><span>Découvrir, publier mes soirées, partager des stories.</span>
          </button>
          <button role="radio" aria-checked={kind === 'business'} onClick={() => setKind('business')}>
            <Building2 /><b>J'ai un lieu</b><span>Bar, club, salle, orga : page vérifiée, agenda, stats.</span>
          </button>
        </div>
        <div className="field">
          <label className="lbl" htmlFor="nm">{kind === 'business' ? 'Nom du lieu ou de l\'organisation' : 'Nom affiché'}</label>
          <input id="nm" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'business' ? 'Ex. Le Comptoir' : 'Ex. Inès'} autoComplete="name" />
        </div>
        {isRemote && (
          <div className="field">
            <label className="lbl" htmlFor="hd">Nom d'utilisateur</label>
            <div className="handle"><span>@</span><input id="hd" className="input" autoCapitalize="none" value={handle} onChange={(e) => setHandle(cleanHandle(e.target.value))} /></div>
          </div>
        )}
        {kind === 'business' && (
          <div className="field">
            <label className="lbl" htmlFor="ad">Adresse du lieu</label>
            <input id="ad" className="input" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Numéro, rue, code postal" autoComplete="street-address" />
            <span className="hint">On vérifie chaque lieu avant d'afficher le badge (NEQ ou justificatif).</span>
          </div>
        )}
        <div className="field">
          <span className="lbl">Qu'est-ce que tu aimes faire ?</span>
          <span className="hint">On te montrera d'abord ça, et tout le reste juste en dessous. Tu peux changer quand tu veux.</span>
          <div className="wrap-chips">
            {TASTES.map((v) => (
              <button key={v.k} className="chip" aria-pressed={vibes.includes(v.k)} onClick={() => setVibes(vibes.includes(v.k) ? vibes.filter((x) => x !== v.k) : [...vibes, v.k])}>{v.l}</button>
            ))}
          </div>
        </div>
        <label className="adult-check">
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
          <span><b>J'ai 18 ans ou plus</b><small>SpotLa propose des sorties dans des bars et des clubs : l'app est réservée aux personnes majeures.</small></span>
        </label>
        <button className="btn btn-primary btn-block" disabled={!ok || busy} onClick={submit}>{busy ? 'Création…' : 'Voir ce qui se passe maintenant'}</button>
      </div>
    </div>
  )
}
