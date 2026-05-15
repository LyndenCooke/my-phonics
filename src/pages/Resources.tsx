import Layout from '@/components/Layout';
import { SoundMatsResources } from '@/components/SoundMatsResources';

export default function Resources() {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Resources
          </h1>
          <p className="text-base text-muted-foreground mt-2 max-w-2xl">
            Free printable phonics resources for parents and teachers. Sound mats, posters, and worksheets — all aligned with the UK Letters and Sounds curriculum.
          </p>
        </header>

        <SoundMatsResources />
      </div>
    </Layout>
  );
}
