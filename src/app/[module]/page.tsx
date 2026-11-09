import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Database,
  LockKeyhole,
} from "lucide-react";
import { AppWindow } from "lucide-react";
import { moduleDetails, type ModuleSlug } from "@/lib/modules";

function isModuleSlug(value: string): value is ModuleSlug {
  return Object.hasOwn(moduleDetails, value);
}

export default function ModulePage({
  params,
}: PageProps<"/[module]">) {
  return (
    <Suspense fallback={<ModuleLoading />}>
      <ModulePageContent params={params} />
    </Suspense>
  );
}

async function ModulePageContent({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: slug } = await params;
  if (!isModuleSlug(slug)) notFound();

  const moduleInfo = moduleDetails[slug];

  return (
    <div className="module-page">
      <div className="page-heading module-heading">
        <div>
          <div className="page-eyebrow"><span className="eyebrow-line" /> {moduleInfo.eyebrow}</div>
          <h1>{moduleInfo.title}</h1>
          <p>{moduleInfo.description}</p>
        </div>
        <span className="module-ready-badge"><Check size={14} /> Interface ready</span>
      </div>

      <section className="module-connection-panel">
        <span className="module-connection-icon"><Database size={19} /></span>
        <div className="module-connection-copy">
          <strong>This module is waiting for workspace data.</strong>
          <span>
            No organizational records are loaded. Connect authentication and the
            database before creating or importing company data.
          </span>
        </div>
        <Link href="/settings" className="module-setup-link">View setup <ArrowUpRight size={15} /></Link>
      </section>

      <div className="module-stat-grid">
        {["Total records", "Active", "Needs attention"].map((label) => (
          <article className="module-stat-card" key={label}>
            <span>{label}</span>
            <strong>—</strong>
            <small>Data not connected</small>
          </article>
        ))}
      </div>

      <section className="panel module-records-panel">
        <div className="panel-heading module-records-heading">
          <div>
            <span className="panel-eyebrow">WORKSPACE RECORDS</span>
            <h2>{moduleInfo.title}</h2>
          </div>
          <span className="records-count">Data unavailable</span>
        </div>
        <div className="module-empty-state">
          <span className="module-empty-icon"><AppWindow size={21} /></span>
          <h2>No records yet</h2>
          <p>
            Records will appear here after your workspace is connected. Nexus
            does not use demo records as company data.
          </p>
          <Link className="button button-secondary" href="/settings">
            <CircleHelp size={15} /> Configure workspace <ChevronRight size={15} />
          </Link>
        </div>
      </section>

      <section className="panel module-capabilities">
        <div className="panel-heading">
          <div>
            <span className="panel-eyebrow">MODULE OVERVIEW</span>
            <h2>Built for your workflow</h2>
          </div>
          <LockKeyhole size={17} className="capabilities-lock" aria-label="Permission protected" />
        </div>
        <div className="capability-grid">
          {moduleInfo.features.map((feature) => (
            <div className="capability-item" key={feature}>
              <span><Check size={14} /></span>
              <p>{feature}</p>
            </div>
          ))}
        </div>
      </section>

      <Link href="/" className="module-back-link">
        <ChevronRight size={14} className="back-chevron" /> Back to dashboard
      </Link>
    </div>
  );
}

function ModuleLoading() {
  return (
    <div className="module-loading" role="status" aria-label="Loading module">
      <span />
      <span />
      <span />
      <div className="module-loading-card" />
    </div>
  );
}
