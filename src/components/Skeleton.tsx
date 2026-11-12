// Squelettes de chargement (comme Instagram et Facebook) : des formes grises qui brillent
// à la place des cartes, le temps que le contenu arrive.

/** Une rangée de cartes en attente. */
export function SkelRail({ n = 3, kind = 'ev' }: { n?: number; kind?: 'ev' | 'place' | 'agenda' }) {
  return (
    <div className="rail skel-rail" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className={`skel skel-card skel-${kind}`}>
          <span className="skel-line w60" />
          <span className="skel-line w40" />
        </div>
      ))}
    </div>
  )
}

/** Écran en attente : utilisé pendant le tout premier chargement et à l'ouverture d'un écran. */
export function SkelScreen({ home }: { home?: boolean }) {
  return (
    <div className="scr skel-scr" aria-busy="true" aria-label="Chargement">
      <div className={`skel skel-hero ${home ? '' : 'short'}`} />
      {home && (
        <div className="skel-stories">
          {Array.from({ length: 5 }, (_, i) => <span key={i} className="skel skel-dot" />)}
        </div>
      )}
      <div className="pad stack8 skel-head"><span className="skel skel-line w30" /><span className="skel skel-line w60 big" /></div>
      <SkelRail />
      <div className="pad stack8 skel-head"><span className="skel skel-line w30" /><span className="skel skel-line w50 big" /></div>
      <SkelRail kind="place" />
    </div>
  )
}
