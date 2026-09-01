'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '../lib/i18n/I18nProvider';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function HomePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => setProjects(data.projects || []))
      .finally(() => setLoading(false));
  }, []);

  async function createProject(e) {
    e.preventDefault();
    if (!name.trim() || !district.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, district })
      });
      const data = await res.json();
      if (data.project) router.push(`/projects/${data.project.id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-clay-200 bg-white/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div>
            <div className="font-semibold text-ink text-lg tracking-tight">CivilVerify</div>
            <div className="text-xs text-slate-650">{t('tagline')}</div>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <section className="card p-6">
          <h2 className="text-base font-semibold mb-4">{t('newProject')}</h2>
          <form onSubmit={createProject} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div>
              <label className="label">{t('projectName')}</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sundaraiah PMAY House 4B" />
            </div>
            <div>
              <label className="label">{t('district')}</label>
              <input className="input" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Bengaluru Rural" />
            </div>
            <button className="btn-primary h-[38px]" disabled={creating}>
              {t('create')}
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-4">{t('projects')}</h2>
          {loading ? (
            <div className="text-sm text-slate-650">Loading…</div>
          ) : projects.length === 0 ? (
            <div className="text-sm text-slate-650">No projects yet — create one above.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {projects.map((p) => (
                <a key={p.id} href={`/projects/${p.id}`} className="card p-5 hover:border-clay-400 transition-colors">
                  <div className="font-medium text-ink">{p.name}</div>
                  <div className="text-sm text-slate-650 mt-1">{p.district}</div>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
