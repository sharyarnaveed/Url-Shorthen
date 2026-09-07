import { QRCodeSVG } from 'qrcode.react'
import { X } from 'lucide-react'

export function QrCodeModal({ qrModalLink, onClose, handleCopy }) {
  if (!qrModalLink) return null

  return (
    <div className="dash-modal-backdrop" onClick={onClose}>
      <div className="dash-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="dash-modal-header">
          <h3>QR Code Preview</h3>
          <button
            type="button"
            className="dash-modal-close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="dash-modal-body">
          <div className="dash-qr-preview">
            <QRCodeSVG
              value={qrModalLink.fullShortUrl || ''}
              size={180}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              marginSize={2}
            />
          </div>
          <p className="dash-qr-title">{qrModalLink.title}</p>
          <code className="dash-qr-url">{qrModalLink.fullShortUrl}</code>

          <div className="dash-modal-actions">
            <button
              type="button"
              className="dash-submit-btn"
              onClick={() => handleCopy(qrModalLink.fullShortUrl)}
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QrCodeModal
