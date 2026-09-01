'use client';

import { useState } from 'react';
import { useI18n } from '../lib/i18n/I18nProvider';

export default function StageUploadCard({ projectId, stage, onUploaded }) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null); // { id, extracted, missingFields, note }
  const [fieldValues, setFieldValues] = useState({});
  const [estimate, setEstimate] = useState(null);
  const [error, setError] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    setAnalysis(null);
    setEstimate(null);
    try {
      const form = new FormData();
      form.append('projectId', projectId);
      form.append('stageKey', stage.key);
      form.append('file', file);
      const res = await fetch('/api/plans/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Upload failed');
        return;
      }
      setAnalysis(json.analysis);
      if (json.analysis.missingFields.length === 0) {
        await fetchEstimate(json.analysis.id);
      }
      onUploaded?.();
    } finally {
      setUploading(false);
    }
  }

  async function fetchEstimate(analysisId) {
    const res = await fetch(`/api/plans/${analysisId}/estimate`);
    const json = await res.json();
    setEstimate(json.estimate);
  }

  async function submitMissingFields() {
    const casted = {};
    for (const f of analysis.missingFields) {
      const raw = fieldValues[f.key];
      if (raw === undefined || raw === '') continue;
      casted[f.key] = isNaN(Number(raw)) ? raw : Number(raw);
    }
    await fetch(`/api/plans/${analysis.id}/details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(casted)
    });
    setAnalysis({ ...analysis, missingFields: [] });
    await fetchEstimate(analysis.id);
  }

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="font-medium text-sm text-ink">{stage.label}</div>
        {stage.hasPlan && <span className="pill bg-sage-100 text-sage-600">uploaded</span>}
      </div>

      {!analysis && (
        <label className="btn-secondary cursor-pointer text-xs justify-center py-2">
          {uploading ? t('analyzing') : t('chooseFile')}
          <input type="file" accept="application/pdf" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      )}

      {error && <div className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{error}</div>}

      {analysis && (
        <div className="text-xs text-slate-650 bg-clay-50 rounded-lg p-2">{analysis.note}</div>
      )}

      {analysis && analysis.missingFields.length > 0 && (
        <div className="space-y-2 border-t border-clay-100 pt-3">
          <div className="text-xs font-medium text-clay-700">{t('missingInfo')}</div>
          {analysis.missingFields.map((f) => (
            <div key={f.key}>
              <label className="label">
                {f.label} {f.unit ? `(${f.unit})` : ''}
              </label>
              <input
                className="input"
                value={fieldValues[f.key] || ''}
                onChange={(e) => setFieldValues({ ...fieldValues, [f.key]: e.target.value })}
              />
            </div>
          ))}
          <button className="btn-primary text-xs w-full py-1.5" onClick={submitMissingFields}>
            {t('saveDetails')}
          </button>
        </div>
      )}

      {estimate && <EstimateView estimate={estimate} t={t} />}
    </div>
  );
}

function EstimateView({ estimate, t }) {
  return (
    <div className="border-t border-clay-100 pt-3 space-y-2">
      <div className="text-xs font-medium text-ink">{t('materials')}</div>
      <table className="w-full text-xs">
        <tbody>
          {estimate.items.map((it, i) => (
            <tr key={i} className="border-b border-clay-50 last:border-0">
              <td className="py-1 pr-2 text-slate-650">{it.material}</td>
              <td className="py-1 pr-2 text-right whitespace-nowrap">
                {it.quantity != null ? `${it.quantity} ${it.unit}` : ''}
              </td>
              <td className="py-1 text-right whitespace-nowrap font-medium">
                {it.amount != null ? `₹${it.amount.toLocaleString('en-IN')}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between text-sm font-semibold pt-1">
        <span>{t('subtotal')}</span>
        <span>₹{estimate.subtotal.toLocaleString('en-IN')}</span>
      </div>

      {estimate.warnings.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-clay-700">{t('warnings')}</div>
          {estimate.warnings.map((w, i) => (
            <div
              key={i}
              className={`text-xs rounded-lg p-2 ${w.level === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}
            >
              {w.message}
            </div>
          ))}
        </div>
      )}

      {estimate.citations.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-clay-700 font-medium">{t('citations')} ({estimate.citations.length})</summary>
          <ul className="mt-1 space-y-1 text-slate-650">
            {estimate.citations.map((c, i) => (
              <li key={i}>
                <span className="font-medium">{c.code} cl. {c.clause}:</span> {c.text}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
