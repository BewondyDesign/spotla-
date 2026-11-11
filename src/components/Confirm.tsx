import { createPortal } from 'react-dom'
/** Petite feuille de confirmation avant une suppression (rien n'est supprimé sans ce second geste). */
export function ConfirmDelete({ title, text, onConfirm, onClose }: { title: string; text: string; onConfirm: () => void; onClose: () => void }) {
  return createPortal(
    <div className="backdrop fixed" onClick={onClose} onPointerDown={(e) => e.stopPropagation()}>
      <div className="confirm del-sheet" role="alertdialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="stack4"><b className="sec-title">{title}</b><p className="muted small">{text}</p></div>
        <button className="btn btn-block btn-danger" onClick={() => { onConfirm(); onClose() }}>Supprimer</button>
        <button className="btn btn-block btn-ghost" onClick={onClose}>Annuler</button>
      </div>
    </div>,
    document.body,
  )
}
