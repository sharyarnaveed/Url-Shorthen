export function SkeletonMetricCard() {
  return (
    <div className="dash-metric-card dash-skeleton-card">
      <div className="dash-metric-header">
        <span className="dash-skeleton-line" style={{ width: '60%', height: 14 }} />
        <span className="dash-skeleton-circle" />
      </div>
      <div className="dash-skeleton-line" style={{ width: '40%', height: 28, marginTop: 12 }} />
      <div className="dash-skeleton-line" style={{ width: '70%', height: 12, marginTop: 8 }} />
    </div>
  )
}

export function SkeletonMetricsGrid({ count = 4 }) {
  return (
    <div className="dash-metrics-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMetricCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonTableRow({ columns = 5 }) {
  return (
    <tr className="dash-skeleton-row">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i}>
          <div className="dash-skeleton-line" style={{ width: i === 0 ? '80%' : '60%', height: 14 }} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonTable({ rows = 4, columns = 5 }) {
  return (
    <div className="dash-table-wrap">
      <table className="dash-table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <div className="dash-skeleton-line" style={{ width: '70%', height: 12 }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SkeletonBarChart() {
  return (
    <div className="dash-analytics-card dash-skeleton-chart">
      <div className="dash-analytics-card-header">
        <div>
          <div className="dash-skeleton-line" style={{ width: '60%', height: 16 }} />
          <div className="dash-skeleton-line" style={{ width: '80%', height: 12, marginTop: 8 }} />
        </div>
      </div>
      <div style={{ padding: '20px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dash-barchart-row" style={{ marginBottom: 12 }}>
            <div className="dash-skeleton-line" style={{ width: `${80 - i * 15}%`, height: 20, borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
