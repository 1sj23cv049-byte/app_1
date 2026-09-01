'use client';

import { useEffect, useState } from 'react';
import ProjectNav from '../../../../components/ProjectNav';
import { useI18n } from '../../../../lib/i18n/I18nProvider';
import StageUploadCard from '../../../../components/StageUploadCard';

export default function PlansPage({ params }) {
  const { t } = useI18n();
  const projectId = params.id;
  const [data, setData] = useState(null);

  async function load() {
    const res = await fetch(`/api/projects/${projectId}`);
    const json = await res.json();
    setData(json);
  }

  useEffect(() => {
    load();
  }, [projectId]);

  if (!data) return null;

  return (
    <main className="min-h-screen">
      <ProjectNav projectId={projectId} projectName={data.project?.name} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">{t('uploadPlan')}</h1>
          <p className="text-sm text-slate-650 mt-1">
            Each construction stage has its own upload slot — this breaks the drawing down by stage and keeps the material
            estimate for each stage separate and easy to check. PDF only.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.stages.map((stage) => (
            <StageUploadCard key={stage.key} projectId={projectId} stage={stage} onUploaded={load} />
          ))}
        </div>
      </div>
    </main>
  );
}
