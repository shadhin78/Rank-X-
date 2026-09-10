import * as React from 'react';
import { cn } from '@/src/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6 space-y-2 sm:mb-8', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span>/</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl lg:text-3xl">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 pt-1 sm:pt-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
