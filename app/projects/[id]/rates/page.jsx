'use client';

import { useEffect, useState } from 'react';
import ProjectNav from '../../../../components/ProjectNav';
import { useI18n } from '../../../../lib/i18n/I18nProvider';

export default function RatesPage({ params }) {
  const { t } = useI18n();
  const projectId = params.id;
  const [projectName, setProjectName] = useState('');
  const [district, setDistrict] = useState('');
  const [rates, setRates] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [edits, setEdits] = useState({});

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((d) => {
        setProjectName(d.project?.name);
        setDistrict(d.project?.district);
        return fetch(`/api/rates?district=${encodeURIComponent(d.project.district)}`);
      })
      .then((r) => r.json())
      .then((d) => {
        setRates(d.rates || []);
        setMaterials(d.materials || []);
      });
  }, [projectId]);

  async function saveRate(material) {
    const value = edits[material];
    if (value === undefined || value === '') return;
    const res = await fetch('/api/rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ district, material, rate_inr: Number(value) })
    });
    const json = await res.json();
    setRates(json.rates);
    setEdits({ ...edits, [material]: undefined });
  }

  return (
    <main className="min-h-screen">
      <ProjectNav projectId={projectId} projectName={projectName} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-lg font-semibold mb-1">{t('ratesTitle')}</h1>
        <p className="text-sm text-slate-650 mb-2">District: {district}</p>
        <p className="text-xs text-clay-700 bg-clay-50 rounded-lg p-3 mb-6">
          Every new district is seeded with placeholder rates so the estimator has something to price against
          immediately — these are rough approximations, not verified local prices. Replace each one below with the
          real current rate for {district} before trusting any cost total.
        </p>

        <div className="card divide-y divide-clay-100">
          {materials.map((m) => {
            const current = rates.find((r) => r.material === m.material);
            return (
              <div key={m.material} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <div className="text-sm font-medium">{m.label}</div>
                  <div className="text-xs text-slate-650">{m.unit_label}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-650">₹{current ? current.rate_inr : '—'}</span>
                  <input
                    className="input w-24"
                    placeholder="new rate"
                    value={edits[m.material] ?? ''}
                    onChange={(e) => setEdits({ ...edits, [m.material]: e.target.value })}
                  />
                  <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => saveRate(m.material)}>
                    {t('addRate')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
