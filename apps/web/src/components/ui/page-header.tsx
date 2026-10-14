export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="container-page animate-rise pt-8 sm:pt-12 lg:pt-14">
      <div className="flex flex-col gap-4 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}

export function EmptyState({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="card-soft flex flex-col items-center gap-3 px-6 py-12 text-center text-ink-muted">
      <span aria-hidden className="font-display text-2xl text-accent">✦</span>
      <p className="max-w-md leading-relaxed">{children}</p>
      {action}
    </div>
  );
}
