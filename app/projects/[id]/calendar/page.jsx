'use client';

import { useEffect, useMemo, useState } from 'react';
import ProjectNav from '../../../../components/ProjectNav';
import { useI18n } from '../../../../lib/i18n/I18nProvider';
import { STAGES } from '../../../../lib/stagesClient';

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function CalendarPage({ params }) {
  const { t } = useI18n();
  const projectId = params.id;
  const [projectName, setProjectName] = useState('');
  const [entries, setEntries] = useState([]);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() }; // month 0-11
  });
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`).then((r) => r.json()).then((d) => setProjectName(d.project?.name));
    fetch(`/api/progress?projectId=${projectId}`).then((r) => r.json()).then((d) => setEntries(d.entries || []));
  }, [projectId]);

  const entriesByDate = useMemo(() => {
    const map = {};
    for (const e of entries) {
      (map[e.entry_date] ||= []).push(e);
    }
    return map;
  }, [entries]);

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function dateKey(d) {
    return `${cursor.year}-${pad(cursor.month + 1)}-${pad(d)}`;
  }

  function changeMonth(delta) {
    let m = cursor.month + delta;
    let y = cursor.year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setCursor({ year: y, month: m });
    setSelectedDate(null);
  }

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const selectedEntries = selectedDate ? entriesByDate[selectedDate] || [] : [];

  return (
    <main className="min-h-screen">
      <ProjectNav projectId={projectId} projectName={projectName} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">{t('calendarTitle')}</h1>
          <div className="flex items-center gap-3">
            <button className="btn-secondary px-2 py-1 text-sm" onClick={() => changeMonth(-1)}>‹</button>
            <span className="text-sm font-medium w-36 text-center">{monthLabel}</span>
            <button className="btn-secondary px-2 py-1 text-sm" onClick={() => changeMonth(1)}>›</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-xs text-slate-650 mb-1 px-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const key = dateKey(d);
            const dayEntries = entriesByDate[key] || [];
            const isSelected = selectedDate === key;
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(key)}
                className={`aspect-square rounded-lg border text-left p-1.5 flex flex-col justify-between transition-colors ${
                  isSelected ? 'border-clay-500 bg-clay-50' : 'border-clay-100 bg-white hover:border-clay-300'
                }`}
              >
                <span className="text-xs text-slate-650">{d}</span>
                {dayEntries.length > 0 && (
                  <span className="pill bg-sage-100 text-sage-600 self-start text-[10px] px-1.5">{dayEntries.length}</span>
                )}
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <div className="card p-4 mt-6">
            <h2 className="text-sm font-semibold mb-3">{selectedDate}</h2>
            {selectedEntries.length === 0 ? (
              <p className="text-sm text-slate-650">{t('noEntriesThisDay')}</p>
            ) : (
              <div className="space-y-3">
                {selectedEntries.map((e) => (
                  <div key={e.id} className="border-b border-clay-50 last:border-0 pb-3 last:pb-0">
                    <div className="text-sm font-medium">{e.title}</div>
                    <div className="text-xs text-slate-650">{STAGES.find((s) => s.key === e.stage_key)?.label}</div>
                    {e.description && <p className="text-sm mt-1">{e.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
