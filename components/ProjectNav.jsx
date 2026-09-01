'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '../lib/i18n/I18nProvider';
import LanguageSwitcher from './LanguageSwitcher';

export default function ProjectNav({ projectId, projectName }) {
  const pathname = usePathname();
  const { t } = useI18n();

  const tabs = [
    { href: `/projects/${projectId}`, key: 'nav_dashboard' },
    { href: `/projects/${projectId}/plans`, key: 'nav_plans' },
    { href: `/projects/${projectId}/progress`, key: 'nav_progress' },
    { href: `/projects/${projectId}/calendar`, key: 'nav_calendar' },
    { href: `/projects/${projectId}/schedule`, key: 'nav_schedule' },
    { href: `/projects/${projectId}/rates`, key: 'nav_rates' }
  ];

  return (
    <header className="border-b border-clay-200 bg-white/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="font-semibold text-ink tracking-tight">
            CivilVerify <span className="text-clay-600">·</span> <span className="text-sm font-normal text-slate-650">{projectName}</span>
          </Link>
          <LanguageSwitcher />
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-2 -mb-px">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap rounded-t-lg px-3 py-1.5 text-sm border-b-2 transition-colors ${
                  active ? 'border-clay-600 text-clay-700 font-medium' : 'border-transparent text-slate-650 hover:text-ink'
                }`}
              >
                {t(tab.key)}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
