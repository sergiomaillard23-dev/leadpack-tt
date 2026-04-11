'use client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { AnalyticsData } from '@/lib/db/analytics'

// Pipeline funnel colours (ordered NEW→CLOSED_LOST)
const FUNNEL_COLORS: Record<string, string> = {
  NEW:          '#6366f1',
  CONTACTED:    '#8b5cf6',
  QUOTED:       '#a78bfa',
  CLOSED_WON:   '#22c55e',
  CLOSED_LOST:  '#ef4444',
}

function formatTTD(ttd: number) {
  return `TT$${ttd.toLocaleString('en-TT')}`
}

function MetricTile({
  label, value, sub, highlight,
}: {
  label: string
  value: string
  sub?: string
  highlight?: 'green' | 'red' | 'amber'
}) {
  const valueColor =
    highlight === 'green' ? 'text-green-400' :
    highlight === 'red'   ? 'text-red-400'   :
    highlight === 'amber' ? 'text-amber-400' :
    'text-white'

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 flex flex-col gap-1">
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  )
}

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const roi = data.totalSpentTTD > 0
    ? Math.round(((data.closedWonCommissionTTD - data.totalSpentTTD) / data.totalSpentTTD) * 100)
    : 0

  return (
    <div className="flex flex-col gap-8">
      {/* Metric tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricTile
          label="Total Leads"
          value={data.totalLeads.toString()}
          sub="across all packs"
        />
        <MetricTile
          label="Total Spend"
          value={formatTTD(data.totalSpentTTD)}
          sub="pack purchases"
        />
        <MetricTile
          label="Closed-Won Revenue"
          value={formatTTD(data.closedWonCommissionTTD)}
          sub={`ROI: ${roi >= 0 ? '+' : ''}${roi}%`}
          highlight={roi >= 0 ? 'green' : 'red'}
        />
        <MetricTile
          label="Close Rate"
          value={`${data.closeRate}%`}
          sub="won ÷ (won + lost)"
          highlight={data.closeRate >= 50 ? 'green' : data.closeRate >= 25 ? 'amber' : 'red'}
        />
      </div>

      {/* Pipeline funnel + OVR histogram side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pipeline funnel */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-sm font-semibold text-white mb-4">Pipeline Funnel</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.funnel} layout="vertical" margin={{ left: 16, right: 16 }}>
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="status"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                width={90}
                tickFormatter={s => s.replace('_', ' ')}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#f9fafb', fontSize: 12 }}
                itemStyle={{ color: '#d1d5db', fontSize: 12 }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.funnel.map(entry => (
                  <Cell key={entry.status} fill={FUNNEL_COLORS[entry.status] ?? '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* OVR distribution */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-sm font-semibold text-white mb-4">OVR Distribution</p>
          {data.ovrBuckets.length === 0 ? (
            <div className="flex items-center justify-center h-[220px]">
              <p className="text-gray-600 text-sm">No OVR data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.ovrBuckets} margin={{ left: 0, right: 8 }}>
                <XAxis dataKey="bucket" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#f9fafb', fontSize: 12 }}
                  itemStyle={{ color: '#d1d5db', fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.ovrBuckets.map(entry => {
                    const low = parseInt(entry.bucket)
                    const fill = low >= 80 ? '#22c55e' : low >= 60 ? '#eab308' : '#6366f1'
                    return <Cell key={entry.bucket} fill={fill} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Funnel detail table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-5 py-3 text-left text-gray-400 font-medium">Stage</th>
              <th className="px-5 py-3 text-right text-gray-400 font-medium">Leads</th>
              <th className="px-5 py-3 text-right text-gray-400 font-medium">% of Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.funnel.map(row => (
              <tr key={row.status} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-5 py-3 text-white font-medium">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: FUNNEL_COLORS[row.status] ?? '#6b7280' }}
                    />
                    {row.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-gray-300">{row.count}</td>
                <td className="px-5 py-3 text-right text-gray-500">
                  {data.totalLeads > 0
                    ? `${Math.round((row.count / data.totalLeads) * 100)}%`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
