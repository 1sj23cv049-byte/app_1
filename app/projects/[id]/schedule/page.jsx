'use client';

import { useEffect, useState } from 'react';
import ProjectNav from '../../../../components/ProjectNav';
import { useI18n } from '../../../../lib/i18n/I18nProvider';

const STATUS_STYLE = {
  on_track: 'bg-sage-100 text-sage-600',
  delayed: 'bg-red-50 text-red-600',
  not_started: 'bg-clay-100 text-slate-650'
};

export default function SchedulePage({ params }) {
  const { t } = useI18n();
  const projectId = params.id;
  const [projectName, setProjectName] = useState('');
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`).then((r) => r.json()).then((d) => setProjectName(d.project?.name));
    fetch(`/api/schedule?projectId=${projectId}`).then((r) => r.json()).then((d) => setSchedule(d.schedule || []));
  }, [projectId]);

  const maxDays = Math.max(1, ...schedule.map((s) => Math.max(s.plannedDays, s.actualDays || 0)));

  return (
    <main className="min-h-screen">
      <ProjectNav projectId={projectId} projectName={projectName} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-lg font-semibold mb-1">{t('plannedVsActual')}</h1>
        <p className="text-sm text-slate-650 mb-6">
          Actual duration is measured from the first to the last site-progress entry logged against each stage.
        </p>

        <div className="card p-5 space-y-4">
          {schedule.map((s) => (
            <div key={s.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{s.label}</span>
                <span className={`pill ${STATUS_STYLE[s.status]}`}>
                  {s.status === 'on_track' ? t('onTrack') : s.status === 'delayed' ? t('delayed') : t('notStarted')}
                </span>
              </div>
              <div className="space-y-1">
                <Bar labelValue={s.plannedDays} max={maxDays} color="bg-clay-300" label={t('plannedDays')} />
                {s.actualDays != null && (
                  <Bar labelValue={s.actualDays} max={maxDays} color={s.status === 'delayed' ? 'bg-red-400' : 'bg-sage-500'} label={t('actualDays')} />
                )}
              </div>
              {s.delayReason && <div className="text-xs text-clay-700 mt-1">Delay reason: {s.delayReason}</div>}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function Bar({ labelValue, max, color, label }) {
  const pct = Math.min(100, (labelValue / max) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 text-slate-650">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-clay-50 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right">{labelValue}d</span>
    </div>
  );
}
