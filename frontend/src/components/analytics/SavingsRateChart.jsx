import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-1 font-medium text-slate-700 dark:text-slate-300">{label}</p>
      <p className="text-indigo-500">Savings rate: {payload[0].value.toFixed(1)}%</p>
    </div>
  )
}

export default function SavingsRateChart({ points }) {
  const data = points.map((p) => ({ period: p.period, rate: p.savings_rate }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 20, left: 20, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 12, fill: 'currentColor' }}
          className="text-slate-400"
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: 'currentColor' }}
          className="text-slate-400"
          axisLine={false}
          tickLine={false}
          width={20}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="rate"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ r: 3, fill: '#6366f1' }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
