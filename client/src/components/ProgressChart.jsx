import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function ProgressChart({
  title,
  description,
  data,
  lines,
  emptyMessage = 'No data yet for this chart.',
  height = 280,
}) {
  return (
    <article className="glass-panel p-6 sm:p-8">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{title}</p>
          {description ? (
            <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
          ) : null}
        </div>
      </div>

      {data?.length ? (
        <div className="mt-6" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.18)" />
              <XAxis dataKey="label" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '18px',
                  color: '#e2e8f0',
                }}
                labelStyle={{ color: '#f8fafc' }}
              />
              <Legend wrapperStyle={{ color: '#cbd5e1' }} />
              {lines.map((line) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.label}
                  stroke={line.color}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 0, fill: line.color }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-300">
          {emptyMessage}
        </div>
      )}
    </article>
  );
}

