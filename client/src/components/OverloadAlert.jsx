export default function OverloadAlert({ alerts }) {
  if (!alerts?.length) {
    return null;
  }

  return (
    <div className="rounded-[2rem] border border-amber-300/30 bg-amber-400/10 p-5">
      <p className="text-sm uppercase tracking-[0.25em] text-amber-200">Progressive Overload Alert</p>
      <div className="mt-4 space-y-3">
        {alerts.map((alert) => (
          <div key={alert.exerciseName} className="rounded-2xl border border-amber-200/20 bg-slate-950/30 p-4">
            <p className="font-display text-lg font-semibold text-white">{alert.exerciseName}</p>
            <p className="mt-2 text-sm leading-6 text-amber-50">{alert.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

