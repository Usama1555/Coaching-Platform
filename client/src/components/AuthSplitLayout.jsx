export default function AuthSplitLayout({ title, eyebrow, subtitle, aside, children }) {
  return (
    <div className="grid min-h-[calc(100vh-80px)] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-14">
      <section className="relative overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10 lg:p-12">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(255,255,255,0.04),transparent,rgba(255,255,255,0.03))]" />
        <div className="relative flex h-full flex-col justify-between gap-10">
          <div className="max-w-xl">
            <p className="mb-4 text-xs uppercase tracking-[0.35em] text-tide">{eyebrow}</p>
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-200 sm:text-lg">{subtitle}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {aside.map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-tide">{item.label}</p>
                <p className="mt-3 text-lg font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-panel flex items-center p-6 sm:p-8 lg:p-10">{children}</section>
    </div>
  );
}

