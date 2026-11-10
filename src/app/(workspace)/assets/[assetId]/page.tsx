import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Archive, Clock3, ShieldCheck } from "lucide-react";
import { requirePermission } from "@/lib/authorization";
import { isDatabaseConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import {
  AssetAssignmentControls,
  AssetForm,
  type AssetFormOptions,
  type AssetFormValues,
} from "../asset-form";
import {
  archiveAssetAction,
  assignAssetAction,
  returnAssetAction,
  updateAssetAction,
} from "../actions";

type Params = Promise<{ assetId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function AssetDetailsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<div className="module-loading" role="status" />}>
      <AssetDetailsContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function AssetDetailsContent({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { assetId } = await params;
  const query = await searchParams;
  const configured = isSupabaseConfigured() && isDatabaseConfigured();
  const principal = configured ? await requirePermission("assets.view") : null;

  if (!principal) {
    return (
      <main className="module-page assets-page">
        <div className="page-heading module-heading">
          <div>
            <div className="page-eyebrow"><span className="eyebrow-line" /> ASSET MANAGEMENT</div>
            <h1>Asset details</h1>
            <p>Connect an organization workspace to view its asset records.</p>
          </div>
        </div>
        <Link className="module-back-link" href="/assets"><ArrowLeft size={14} /> Back to assets</Link>
      </main>
    );
  }

  const { db } = await import("@/lib/db");
  const asset = await db.asset.findFirst({
    where: {
      id: assetId,
      organizationId: principal.organizationId,
      archivedAt: null,
    },
    select: {
      id: true,
      assetTag: true,
      categoryId: true,
      brand: true,
      model: true,
      serialNumber: true,
      macAddress: true,
      ipAddress: true,
      purchaseDate: true,
      purchasePrice: true,
      vendorId: true,
      warrantyStart: true,
      warrantyEnd: true,
      departmentId: true,
      locationId: true,
      condition: true,
      status: true,
      notes: true,
      updatedAt: true,
      category: { select: { name: true } },
      vendor: { select: { name: true } },
      department: { select: { name: true } },
      location: { select: { name: true } },
      employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      specs: {
        select: {
          processor: true,
          ram: true,
          storage: true,
          operatingSystem: true,
        },
      },
      statusHistory: {
        where: { organizationId: principal.organizationId },
        orderBy: { changedAt: "desc" },
        take: 30,
        select: {
          previousStatus: true,
          newStatus: true,
          changedAt: true,
          remarks: true,
          changedBy: { select: { displayName: true } },
        },
      },
      assignments: {
        where: { organizationId: principal.organizationId },
        orderBy: { assignedAt: "desc" },
        take: 30,
        select: {
          id: true,
          assignedAt: true,
          returnedAt: true,
          remarks: true,
          employee: {
            select: { employeeCode: true, firstName: true, lastName: true },
          },
          assignedBy: { select: { displayName: true } },
        },
      },
    },
  });

  if (!asset) notFound();

  const canUpdate = principal.permissions.includes("assets.update");
  const canArchive = principal.permissions.includes("assets.delete");
  const canAssign = principal.permissions.includes("assets.assign");
  const assetCanBeAssigned = asset.status === "IN_STOCK" || asset.status === "REPAIRED";
  const isAssigned = asset.status === "ASSIGNED" && asset.employee !== null;
  let options: AssetFormOptions | undefined;
  if (canUpdate) {
    const [categories, vendors, departments, locations] = await Promise.all([
      db.assetCategory.findMany({
        where: { organizationId: principal.organizationId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      db.vendor.findMany({
        where: { organizationId: principal.organizationId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      db.department.findMany({
        where: { organizationId: principal.organizationId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      db.location.findMany({
        where: { organizationId: principal.organizationId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
    options = { categories, vendors, departments, locations };
  }
  const assignableEmployees =
    canAssign && assetCanBeAssigned
      ? await db.employee.findMany({
          where: { organizationId: principal.organizationId, isActive: true },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          select: { id: true, employeeCode: true, firstName: true, lastName: true },
        })
      : [];

  const assetValues: AssetFormValues = {
    id: asset.id,
    assetTag: asset.assetTag,
    categoryId: asset.categoryId,
    brand: asset.brand,
    model: asset.model,
    serialNumber: asset.serialNumber,
    macAddress: asset.macAddress,
    ipAddress: asset.ipAddress,
    purchaseDate: asset.purchaseDate,
    purchasePrice: asset.purchasePrice?.toString() ?? null,
    vendorId: asset.vendorId,
    warrantyStart: asset.warrantyStart,
    warrantyEnd: asset.warrantyEnd,
    departmentId: asset.departmentId,
    locationId: asset.locationId,
    condition: asset.condition,
    status: asset.status,
    processor: asset.specs?.processor ?? null,
    ram: asset.specs?.ram ?? null,
    storage: asset.specs?.storage ?? null,
    operatingSystem: asset.specs?.operatingSystem ?? null,
    notes: asset.notes,
  };

  return (
    <main className="module-page assets-page">
      <Link className="asset-back-link" href="/assets"><ArrowLeft size={14} /> All assets</Link>
      <div className="page-heading module-heading">
        <div>
          <div className="page-eyebrow"><span className="eyebrow-line" /> {asset.category.name.toUpperCase()}</div>
          <h1>{asset.assetTag}</h1>
          <p>{[asset.brand, asset.model].filter(Boolean).join(" ") || "Model not specified"}</p>
        </div>
        <span className="module-ready-badge"><ShieldCheck size={14} /> Organization record</span>
      </div>

      {query.updated === "1" && <p className="asset-notice asset-notice-success" role="status">Asset changes saved.</p>}
      {query.assigned === "1" && <p className="asset-notice asset-notice-success" role="status">Asset assigned to the employee.</p>}
      {query.returned === "1" && <p className="asset-notice asset-notice-success" role="status">Asset returned to stock.</p>}
      <div className="asset-detail-facts">
        <div><span>Status</span><strong>{asset.status.replaceAll("_", " ")}</strong></div>
        <div><span>Condition</span><strong>{asset.condition.replaceAll("_", " ")}</strong></div>
        <div><span>Assigned to</span><strong>{asset.employee ? `${asset.employee.firstName} ${asset.employee.lastName}` : "Unassigned"}</strong></div>
        <div><span>Last updated</span><strong>{asset.updatedAt.toLocaleDateString()}</strong></div>
      </div>

      {canUpdate && options ? (
        <section className="panel asset-create-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-eyebrow">ASSET PROFILE</span>
              <h2>Edit asset details</h2>
            </div>
          </div>
          <AssetForm
            action={updateAssetAction}
            asset={assetValues}
            allowAssignedStatus={asset.status === "ASSIGNED"}
            options={options}
            submitLabel="Save changes"
          />
        </section>
      ) : (
        <section className="panel asset-readonly-panel">
          <h2>Asset profile</h2>
          <dl className="asset-readonly-grid">
            <div><dt>Serial number</dt><dd>{asset.serialNumber ?? "—"}</dd></div>
            <div><dt>MAC address</dt><dd>{asset.macAddress ?? "—"}</dd></div>
            <div><dt>IP address</dt><dd>{asset.ipAddress ?? "—"}</dd></div>
            <div><dt>Vendor</dt><dd>{asset.vendor?.name ?? "—"}</dd></div>
            <div><dt>Department</dt><dd>{asset.department?.name ?? "—"}</dd></div>
            <div><dt>Location</dt><dd>{asset.location?.name ?? "—"}</dd></div>
            <div><dt>Purchase date</dt><dd>{asset.purchaseDate?.toLocaleDateString() ?? "—"}</dd></div>
            <div><dt>Purchase price</dt><dd>{asset.purchasePrice?.toString() ?? "—"}</dd></div>
            <div><dt>Warranty end</dt><dd>{asset.warrantyEnd?.toLocaleDateString() ?? "—"}</dd></div>
            <div><dt>Processor</dt><dd>{asset.specs?.processor ?? "—"}</dd></div>
            <div><dt>RAM</dt><dd>{asset.specs?.ram ?? "—"}</dd></div>
            <div><dt>Storage</dt><dd>{asset.specs?.storage ?? "—"}</dd></div>
            <div><dt>Operating system</dt><dd>{asset.specs?.operatingSystem ?? "—"}</dd></div>
          </dl>
          {asset.notes && <p className="asset-readonly-notes">{asset.notes}</p>}
        </section>
      )}

      {canAssign && (isAssigned || assetCanBeAssigned) && (
        <AssetAssignmentControls
          assetId={asset.id}
          assignAction={assignAssetAction}
          assigned={isAssigned}
          employees={assignableEmployees}
          returnAction={returnAssetAction}
        />
      )}

      <section className="panel asset-history-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-eyebrow">LIFECYCLE</span>
            <h2>Status history</h2>
          </div>
          <Clock3 size={17} className="capabilities-lock" />
        </div>
        {asset.statusHistory.length ? (
          <ol className="asset-history-list">
            {asset.statusHistory.map((event, index) => (
              <li key={`${event.changedAt.toISOString()}-${index}`}>
                <span className="asset-history-dot" />
                <div>
                  <strong>
                    {event.previousStatus
                      ? `${event.previousStatus.replaceAll("_", " ")} → ${event.newStatus.replaceAll("_", " ")}`
                      : `Registered as ${event.newStatus.replaceAll("_", " ")}`}
                  </strong>
                  <span>{event.remarks ?? "Status updated"} · {event.changedBy?.displayName ?? "System"} · {event.changedAt.toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="asset-history-empty">No lifecycle events are recorded yet.</div>
        )}
      </section>

      <section className="panel asset-history-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-eyebrow">EMPLOYEE LIFECYCLE</span>
            <h2>Assignment history</h2>
          </div>
        </div>
        {asset.assignments.length ? (
          <ol className="asset-history-list">
            {asset.assignments.map((assignment) => (
              <li key={assignment.id}>
                <span className="asset-history-dot" />
                <div>
                  <strong>
                    {assignment.employee.firstName} {assignment.employee.lastName}
                    <span className="asset-assignment-code"> · {assignment.employee.employeeCode}</span>
                  </strong>
                  <span>
                    Assigned {assignment.assignedAt.toLocaleString()}
                    {assignment.assignedBy ? ` by ${assignment.assignedBy.displayName}` : ""}
                    {assignment.returnedAt ? ` · Returned ${assignment.returnedAt.toLocaleString()}` : " · Currently assigned"}
                  </span>
                  {assignment.remarks && <span className="asset-assignment-remarks">{assignment.remarks}</span>}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="asset-history-empty">No employee assignment history yet.</div>
        )}
      </section>

      {canArchive && (
        <details className="asset-archive-details">
          <summary><Archive size={14} /> Archive this asset</summary>
          <p>Archiving hides this asset from the active register while preserving its lifecycle and audit history.</p>
          <form action={archiveAssetAction}>
            <input name="assetId" type="hidden" value={asset.id} />
            <button className="button button-danger" type="submit">Archive asset</button>
          </form>
        </details>
      )}
      <Link className="module-back-link" href="/assets"><ArrowLeft size={14} /> Back to assets</Link>
    </main>
  );
}
