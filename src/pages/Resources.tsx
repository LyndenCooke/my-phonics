import Layout from '@/components/Layout';
import WorksheetsPanel from '@/components/WorksheetsPanel';
import { useTranslation } from 'react-i18next';

// Worksheets moved into /library as a sub-tab. This page is kept alive so
// old links (emails, ads, sitemap) still resolve — it just renders the same
// panel the Library Worksheets tab shows.
export default function Resources() {
  const { t } = useTranslation('library');
  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            {t('resources.title')}
          </h1>
        </header>
        <WorksheetsPanel />
      </div>
    </Layout>
  );
}
