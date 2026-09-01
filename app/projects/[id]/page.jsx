'use client';

import { useEffect, useState } from 'react';
import ProjectNav from '../../../components/ProjectNav';
import { useI18n } from '../../../lib/i18n/I18nProvider';

export default function ProjectDashboard({ params }) {
  const { t } = useI18n();
  const projectId = params.id;
  const [data, setData] = useState(null);
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`).then((r) => r.json()).then(setData);
    fetch(`/api/schedule?projectId=${projectId}`).then((r) => r.json()).then((d) => setSchedule(d.schedule || []));
  }, [projectId]);

  if (!data) return null;

  const plansUploaded = data.stages.filter((s) => s.hasPlan).length;
  const delayed = schedule.filter((s) => s.status === 'delayed').length;
  const onTrack = schedule.filter((s) => s.status === 'on_track').length;

  return (
    <main className="min-h-screen">
      <ProjectNav projectId={projectId} projectName={data.project?.name} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-lg font-semibold">{data.project?.name}</h1>
          <p className="text-sm text-slate-650 mt-1">{data.project?.district}</p>
        </div>

        <div className="grid sm:grid-cols-4 gap-4">
          <StatCard label="Stages with plans" value={`${plansUploaded} / ${data.stages.length}`} />
          <StatCard label="Progress entries logged" value={data.progressCount} />
          <StatCard label="Verified site photos" value={data.photoCount} />
          <StatCard label="Stages delayed" value={delayed} tone={delayed > 0 ? 'warn' : 'ok'} />
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-3">Stage overview</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.stages.map((s) => (
              <div key={s.key} className="flex items-center justify-between text-sm border border-clay-100 rounded-lg px-3 py-2">
                <span>{s.label}</span>
                <span className={`pill ${s.hasPlan ? 'bg-sage-100 text-sage-600' : 'bg-clay-100 text-slate-650'}`}>
                  {s.hasPlan ? 'plan uploaded' : 'no plan'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, tone }) {
  const toneClass = tone === 'warn' ? 'text-clay-700' : tone === 'ok' ? 'text-sage-600' : 'text-ink';
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-650">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${toneClass}`}>{value}</div>
    </div>
  );
}
