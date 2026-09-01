'use client';

import { useEffect, useState } from 'react';
import ProjectNav from '../../../../components/ProjectNav';
import { useI18n } from '../../../../lib/i18n/I18nProvider';
import { STAGES } from '../../../../lib/stagesClient';

export default function ProgressPage({ params }) {
  const { t } = useI18n();
  const projectId = params.id;
  const [projectName, setProjectName] = useState('');
  const [entries, setEntries] = useState([]);
  const [stageKey, setStageKey] = useState(STAGES[0].key);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoError, setPhotoError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const res = await fetch(`/api/progress?projectId=${projectId}`);
    const json = await res.json();
    setEntries(json.entries || []);
  }

  useEffect(() => {
    fetch(`/api/projects/${projectId}`).then((r) => r.json()).then((d) => setProjectName(d.project?.name));
    load();
  }, [projectId]);

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setPhotoError(null);
    try {
      let photoId = null;
      if (photoFile) {
        const form = new FormData();
        form.append('projectId', projectId);
        form.append('stageKey', stageKey);
        form.append('file', photoFile);
        const res = await fetch('/api/photos', { method: 'POST', body: form });
        const json = await res.json();
        if (!res.ok) {
          setPhotoError(`${json.error} ${json.problems?.join(' ') || ''}`);
          setSubmitting(false);
          return;
        }
        photoId = json.photo.id;
      }

      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, stageKey, title, description, delayReason, photoId })
      });

      setTitle('');
      setDescription('');
      setDelayReason('');
      setPhotoFile(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleChecklist(itemId, checked, entryId) {
    await fetch(`/api/checklist/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked })
    });
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, checklist: e.checklist.map((c) => (c.id === itemId ? { ...c, checked: checked ? 1 : 0 } : c)) } : e))
    );
  }

  return (
    <main className="min-h-screen">
      <ProjectNav projectId={projectId} projectName={projectName} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <form onSubmit={submit} className="card p-5 space-y-3">
          <h2 className="text-sm font-semibold">{t('logProgress')}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('stage')}</label>
              <select className="input" value={stageKey} onChange={(e) => setStageKey(e.target.value)}>
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('title')}</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Column casting - Grid A1-A4" />
            </div>
          </div>
          <div>
            <label className="label">{t('description')}</label>
            <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('photo')}</label>
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="text-sm" />
            <p className="text-xs text-slate-650 mt-1">
              Upload is rejected if the photo has no EXIF capture timestamp or GPS location — take it with a normal phone
              camera with location on, not a screenshot or a downloaded image.
            </p>
            {photoError && <div className="text-xs text-red-600 bg-red-50 rounded-lg p-2 mt-1">{photoError}</div>}
          </div>
          <div>
            <label className="label">{t('delayReason')}</label>
            <input className="input" value={delayReason} onChange={(e) => setDelayReason(e.target.value)} placeholder="Optional — e.g. rain, material delivery delay" />
          </div>
          <button className="btn-primary" disabled={submitting}>
            {t('save')}
          </button>
        </form>

        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-sm text-ink">{entry.title}</div>
                  <div className="text-xs text-slate-650">
                    {entry.entry_date} · {STAGES.find((s) => s.key === entry.stage_key)?.label}
                  </div>
                </div>
                {entry.photo_filename && <span className="pill bg-sage-100 text-sage-600">verified photo</span>}
              </div>
              {entry.photo_filename && (
                <img
                  src={`/api/files/${entry.photo_filename}`}
                  alt=""
                  className="mt-2 h-32 w-full object-cover rounded-lg border border-clay-100"
                />
              )}
              {entry.description && <p className="text-sm text-ink mt-2">{entry.description}</p>}
              {entry.ai_remark && (
                <div className="text-xs bg-clay-50 rounded-lg p-2 mt-2">
                  <span className="font-medium">{t('aiRemark')}: </span>
                  {entry.ai_remark}
                </div>
              )}
              {entry.delay_reason && <div className="text-xs text-clay-700 mt-1">Delay: {entry.delay_reason}</div>}
              {entry.checklist?.length > 0 && (
                <div className="mt-3 border-t border-clay-100 pt-2">
                  <div className="text-xs font-medium mb-1">{t('curingChecklist')}</div>
                  {entry.checklist.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 text-sm py-0.5">
                      <input
                        type="checkbox"
                        checked={!!item.checked}
                        onChange={(e) => toggleChecklist(item.id, e.target.checked, entry.id)}
                      />
                      <span className={item.checked ? 'line-through text-slate-650' : ''}>{item.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
