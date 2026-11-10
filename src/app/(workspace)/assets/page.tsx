import Link from "next/link";
import { Suspense } from "react";
import { Archive, Laptop, Plus, Search, ShieldCheck } from "lucide-react";
import { AssetStatus } from "@/generated/prisma/enums";
import { AssetCategoryForm, AssetForm } from "./asset-form";
import {
  createAssetAction,
  createAssetCategoryAction,
} from "./actions";
import { requirePermission } from "@/lib/authorization";
import { isDatabaseConfigured, isSupabaseConfigured } from "@/lib/supabase/config";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function isAssetStatus(value: string): value is (typeof AssetStatus)[keyof typeof AssetStatus] {
  return Object.values(AssetStatus).some((status) => status === value);
}

function displayStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

export default function AssetsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<div className="module-loading" role="status" />}>
      <AssetsPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AssetsPageContent({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const configured = isSupabaseConfigured() && isDatabaseConfigured();
  const principal = configured
    ? await requirePermission("assets.view")
    : null;

  if (!principal) {
    return (
      <main className="module-page assets-page">
        <div className="page-heading module-heading">
          <div>
            <div className="page-eyebrow"><span className="eyebrow-line" /> ASSET MANAGEMENT</div>
            <h1>Hardware assets</h1>
            <p>Register and track company equipment throughout its lifecycle.</p>
          </div>
        </div>
        <section className="module-connection-panel">
          <span className="module-connection-icon"><ShieldCheck size={19} /></span>
          <div className="module-connection-copy">
            <strong>Connect a workspace to manage assets.</strong>
            <span>Asset records are stored in your organization database. No demo records are shown.</span>
          </div>
          <Link className="module-setup-link" href="/settings">Setup guide <Plus size={15} /></Link>
        </section>
      </main>
    );
  }

  const { db } = await import("@/lib/db");
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  const statusValue = typeof query.status === "string" ? query.status : "";
  const status = isAssetStatus(statusValue) ? statusValue : undefined;
  const where = {
    organizationId: principal.organizationId,
    archivedAt: null,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { assetTag: { contains: search, mode: "insensitive" as const } },
            { brand: { contains: search, mode: "insensitive" as const } },
            { model: { contains: search, mode: "insensitive" as const } },
            { serialNumber: { contains: search, mode: "insensitive" as const } },
            { macAddress: { contains: search, mode: "insensitive" as const } },
            { ipAddress: { contains: search, mode: "insensitive" as const } },
            { category: { is: { organizationId: principal.organizationId, name: { contains: search, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };

  const [assets, total, assigned, categories, vendors, departments, locations] =
    await Promise.all([
      db.asset.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { assetTag: "asc" }],
        take: 100,
        select: {
          id: true,
          assetTag: true,
          brand: true,
          model: true,
          serialNumber: true,
          status: true,
          condition: true,
          updatedAt: true,
          category: { select: { name: true } },
          employee: { select: { firstName: true, lastName: true } },
        },
      }),
      db.asset.count({
        where: { organizationId: principal.organizationId, archivedAt: null },
      }),
      db.asset.count({
        where: {
          organizationId: principal.organizationId,
          archivedAt: null,
          status: "ASSIGNED",
        },
      }),
      principal.permissions.includes("assets.create")
        ? db.assetCategory.findMany({
            where: { organizationId: principal.organizationId },
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          })
        : [],
      principal.permissions.includes("assets.create")
        ? db.vendor.findMany({
            where: { organizationId: principal.organizationId },
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          })
        : [],
      principal.permissions.includes("assets.create")
        ? db.department.findMany({
            where: { organizationId: principal.organizationId },
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          })
        : [],
      principal.permissions.includes("assets.create")
        ? db.location.findMany({
            where: { organizationId: principal.organizationId },
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          })
        : [],
    ]);

  const canCreate = principal.permissions.includes("assets.create");
  const hasFilters = Boolean(search || status);

  return (
    <main className="module-page assets-page">
      <div className="page-heading module-heading">
        <div>
          <div className="page-eyebrow"><span className="eyebrow-line" /> ASSET MANAGEMENT</div>
          <h1>Hardware assets</h1>
          <p>Register and track company equipment throughout its lifecycle.</p>
        </div>
        <span className="module-ready-badge"><ShieldCheck size={14} /> Organization scoped</span>
      </div>

      {query.created === "1" && <p className="asset-notice asset-notice-success" role="status">Asset registered.</p>}
      {query.categoryCreated === "1" && <p className="asset-notice asset-notice-success" role="status">Asset category created.</p>}
      {query.archived === "1" && <p className="asset-notice asset-notice-success" role="status">Asset archived. Historical records are preserved.</p>}
      {query.missing === "1" && <p className="asset-notice" role="status">That asset was not found or has already been archived.</p>}
      {query.activeAssignment === "1" && <p className="asset-notice" role="status">Return or unassign this asset before archiving it.</p>}

      <div className="asset-metrics">
        <article className="module-stat-card">
          <span>Active assets</span>
          <strong>{total}</strong>
          <small>Across your organization</small>
        </article>
        <article className="module-stat-card">
          <span>Assigned</span>
          <strong>{assigned}</strong>
          <small>Current lifecycle status</small>
        </article>
      </div>

      {canCreate && (
        <section className="panel asset-create-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-eyebrow">REGISTER EQUIPMENT</span>
              <h2>Add an asset</h2>
            </div>
            <Laptop size={18} className="capabilities-lock" />
          </div>
          {categories.length === 0 ? (
            <div className="asset-category-first">
              <p>Create an organization-specific category before registering an asset.</p>
              <AssetCategoryForm action={createAssetCategoryAction} />
            </div>
          ) : (
            <>
              <AssetForm
                action={createAssetAction}
                options={{ categories, vendors, departments, locations }}
                submitLabel="Register asset"
              />
              <details className="asset-category-details">
                <summary>Add an asset category</summary>
                <AssetCategoryForm action={createAssetCategoryAction} />
              </details>
            </>
          )}
        </section>
      )}

      <section className="panel asset-list-panel">
        <div className="panel-heading asset-list-heading">
          <div>
            <span className="panel-eyebrow">ASSET REGISTER</span>
            <h2>Organization assets</h2>
          </div>
          <span className="records-count">{assets.length} shown · {total} total</span>
        </div>
        <form action="/assets" className="asset-filter-form" method="get">
          <label className="asset-search">
            <Search size={16} aria-hidden="true" />
            <input defaultValue={search} name="q" placeholder="Search ID, serial, model, MAC or IP" />
          </label>
          <select aria-label="Filter by status" defaultValue={status ?? ""} name="status">
            <option value="">All statuses</option>
            {Object.values(AssetStatus).map((value) => (
              <option key={value} value={value}>{displayStatus(value)}</option>
            ))}
          </select>
          <button className="button button-secondary" type="submit">Filter</button>
          {hasFilters && <Link className="asset-clear-filter" href="/assets">Clear</Link>}
        </form>

        {assets.length ? (
          <div className="asset-table-wrap">
            <table className="asset-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Category</th>
                  <th>Serial number</th>
                  <th>Status</th>
                  <th>Assigned to</th>
                  <th><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      <Link className="asset-record-link" href={`/assets/${asset.id}`}>{asset.assetTag}</Link>
                      <span className="asset-secondary">{[asset.brand, asset.model].filter(Boolean).join(" ") || "Model not specified"}</span>
                    </td>
                    <td>{asset.category.name}</td>
                    <td>{asset.serialNumber ?? "—"}</td>
                    <td><span className={`asset-status asset-status-${asset.status.toLowerCase()}`}>{displayStatus(asset.status)}</span></td>
                    <td>{asset.employee ? `${asset.employee.firstName} ${asset.employee.lastName}` : "Unassigned"}</td>
                    <td><Link className="asset-row-action" href={`/assets/${asset.id}`}>View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total > assets.length && <p className="asset-limit-note">Showing the 100 most recently updated assets. Use search or status filters to narrow the results.</p>}
          </div>
        ) : (
          <div className="module-empty-state asset-empty-state">
            <span className="module-empty-icon"><Archive size={20} /></span>
            <h2>{hasFilters ? "No matching assets" : "No assets registered"}</h2>
            <p>{hasFilters ? "Adjust or clear your filters and try again." : "Create the first asset above. Asset records are real organization data; no sample records are inserted."}</p>
            {hasFilters && <Link className="button button-secondary" href="/assets">Clear filters</Link>}
          </div>
        )}
      </section>
    </main>
  );
}
