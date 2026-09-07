import { Copy, QrCode, Trash2 } from 'lucide-react'

export function LinksTable({
  links,
  handleCopy,
  setQrModalLink,
  openDeleteConfirm,
  showStatus = false,
  showActionLabels = false,
}) {
  return (
    <div className="dash-table-wrap">
      <table className="dash-table">
        <thead>
          <tr>
            <th>{showStatus ? 'Title & Destination' : 'Title / Target URL'}</th>
            <th>Short Link</th>
            <th>{showStatus ? 'Date Created' : 'Created'}</th>
            <th>Clicks</th>
            {showStatus && <th>Status</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {links.map((link) => (
            <tr key={link.id}>
              <td>
                <div className="dash-link-title">{link.title}</div>
                <div className="dash-link-orig" title={link.originalUrl}>
                  {link.originalUrl}
                </div>
              </td>
              <td>
                <a
                  href={link.fullShortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="dash-short-code-link"
                >
                  {link.shortCode}
                </a>
              </td>
              <td>{link.createdAt}</td>
              <td>
                <span className="dash-clicks-badge">
                  {showStatus ? `${link.clicks} clicks` : link.clicks}
                </span>
              </td>
              {showStatus && (
                <td>
                  <span className="dash-status-tag">{link.status || 'Active'}</span>
                </td>
              )}
              <td>
                <div className="dash-action-buttons">
                  <button
                    type="button"
                    className="dash-icon-btn"
                    onClick={() => handleCopy(link.fullShortUrl)}
                    title={showActionLabels ? 'Copy Link' : 'Copy Short Link'}
                  >
                    <Copy size={showActionLabels ? 14 : 16} />
                    {showActionLabels && ' Copy'}
                  </button>
                  <button
                    type="button"
                    className="dash-icon-btn"
                    onClick={() => setQrModalLink(link)}
                    title={showActionLabels ? 'QR Code' : 'View QR Code'}
                  >
                    <QrCode size={showActionLabels ? 14 : 16} />
                    {showActionLabels && ' QR Code'}
                  </button>
                  <button
                    type="button"
                    className="dash-icon-btn dash-icon-btn--danger"
                    onClick={() => openDeleteConfirm(link)}
                    title={showActionLabels ? 'Delete' : 'Delete Link'}
                  >
                    <Trash2 size={showActionLabels ? 14 : 16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default LinksTable
