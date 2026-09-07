import { X } from 'lucide-react'

export function DeleteConfirmModal({ deleteConfirmLink, onCancel, onConfirm }) {
  if (!deleteConfirmLink) return null

  return (
    <div className="dash-modal-backdrop" onClick={onCancel}>
      <div className="dash-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="dash-modal-header">
          <h3>Delete Short Link?</h3>
          <button
            type="button"
            className="dash-modal-close"
            onClick={onCancel}
          >
            <X size={18} />
          </button>
        </div>
        <div className="dash-modal-body">
          <p className="dash-delete-confirm-text">
            Are you sure you want to delete <strong>{deleteConfirmLink.title}</strong>?
            This action cannot be undone.
          </p>
          <code className="dash-qr-url">{deleteConfirmLink.fullShortUrl}</code>

          <div className="dash-modal-actions">
            <button
              type="button"
              className="dash-btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="dash-submit-btn"
              onClick={onConfirm}
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmModal
