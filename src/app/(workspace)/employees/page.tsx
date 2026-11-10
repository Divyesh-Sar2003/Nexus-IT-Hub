import Link from "next/link";
import { Suspense } from "react";
import { Building2, MapPin, Search, Users } from "lucide-react";
import { requirePermission } from "@/lib/authorization";
import { isDatabaseConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import {
  createDepartmentAction,
  createEmployeeAction,
  setEmployeeActiveAction,
  updateEmployeeAction,
} from "./actions";
import { DepartmentForm, EmployeeForm } from "./employee-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function EmployeesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<div className="module-loading" role="status" />}>
      <EmployeesPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function EmployeesPageContent({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const configured = isSupabaseConfigured() && isDatabaseConfigured();
  const principal = configured ? await requirePermission("employees.view") : null;

  if (!principal) {
    return (
      <main className="module-page assets-page">
        <div className="page-heading module-heading">
          <div>
            <div className="page-eyebrow"><span className="eyebrow-line" /> EMPLOYEE LIFECYCLE</div>
            <h1>People & assignments</h1>
            <p>Keep employee records connected to equipment and its assignment history.</p>
          </div>
        </div>
        <section className="module-connection-panel">
          <span className="module-connection-icon"><Users size={19} /></span>
          <div className="module-connection-copy">
            <strong>Connect a workspace to manage employee records.</strong>
            <span>Employee records and assignment histories are organization data; no demo people are shown.</span>
          </div>
          <Link className="module-setup-link" href="/settings">Setup guide</Link>
        </section>
      </main>
    );
  }

  const { db } = await import("@/lib/db");
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  const where = {
    organizationId: principal.organizationId,
    ...(search
      ? {
          OR: [
            { employeeCode: { contains: search, mode: "insensitive" as const } },
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const canCreate = principal.permissions.includes("employees.create");
  const canUpdate = principal.permissions.includes("employees.update");

  const [employees, total, active, assignedGroups, departments, locations] =
    await Promise.all([
      db.employee.findMany({
        where,
        orderBy: [{ isActive: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
        take: 100,
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          email: true,
          departmentId: true,
          locationId: true,
          isActive: true,
          department: { select: { name: true } },
          location: { select: { name: true } },
        },
      }),
      db.employee.count({ where: { organizationId: principal.organizationId } }),
      db.employee.count({ where: { organizationId: principal.organizationId, isActive: true } }),
      db.asset.groupBy({
        by: ["employeeId"],
        where: {
          organizationId: principal.organizationId,
          archivedAt: null,
          status: "ASSIGNED",
          employeeId: { not: null },
        },
        _count: { _all: true },
      }),
      canCreate || canUpdate
        ? db.department.findMany({
            where: { organizationId: principal.organizationId },
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          })
        : [],
      canCreate || canUpdate
        ? db.location.findMany({
            where: { organizationId: principal.organizationId },
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          })
        : [],
    ]);

  const assignedByEmployee = new Map<string, number>();
  for (const group of assignedGroups) {
    if (group.employeeId) {
      assignedByEmployee.set(group.employeeId, group._count._all);
    }
  }
  const assignedTotal = assignedGroups.reduce((sum, group) => sum + group._count._all, 0);

  return (
    <main className="module-page assets-page">
      <div className="page-heading module-heading">
        <div>
          <div className="page-eyebrow"><span className="eyebrow-line" /> EMPLOYEE LIFECYCLE</div>
          <h1>People & assignments</h1>
          <p>Manage employees and view current equipment assignments.</p>
        </div>
      </div>

      {query.created === "1" && <p className="asset-notice asset-notice-success" role="status">Employee record created.</p>}
      {query.updated === "1" && <p className="asset-notice asset-notice-success" role="status">Employee record updated.</p>}
      {query.departmentCreated === "1" && <p className="asset-notice asset-notice-success" role="status">Department created.</p>}
      {query.activated === "1" && <p className="asset-notice asset-notice-success" role="status">Employee activated.</p>}
      {query.deactivated === "1" && <p className="asset-notice asset-notice-success" role="status">Employee deactivated.</p>}
      {query.assignedAssets === "1" && <p className="asset-notice" role="status">Return all assigned assets before deactivating this employee.</p>}
      {query.missing === "1" && <p className="asset-notice" role="status">That employee record was not found.</p>}

      <div className="asset-metrics">
        <article className="module-stat-card">
          <span>Active employees</span>
          <strong>{active}</strong>
          <small>{total} total records</small>
        </article>
        <article className="module-stat-card">
          <span>Assigned devices</span>
          <strong>{assignedTotal}</strong>
          <small>Current active assignments</small>
        </article>
      </div>

      {canCreate && (
        <section className="panel asset-create-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-eyebrow">EMPLOYEE DIRECTORY</span>
              <h2>Add an employee</h2>
            </div>
            <Users size={18} className="capabilities-lock" />
          </div>
          <EmployeeForm
            action={createEmployeeAction}
            departments={departments}
            locations={locations}
            submitLabel="Add employee"
          />
          <details className="asset-category-details">
            <summary><Building2 size={14} /> Add a department</summary>
            <DepartmentForm action={createDepartmentAction} />
          </details>
          {!locations.length && <p className="employee-location-note"><MapPin size={13} /> Locations must be configured by a workspace administrator.</p>}
        </section>
      )}

      <section className="panel asset-list-panel employee-list-panel">
        <div className="panel-heading asset-list-heading">
          <div>
            <span className="panel-eyebrow">DIRECTORY</span>
            <h2>Organization employees</h2>
          </div>
          <span className="records-count">{employees.length} shown · {total} total</span>
        </div>
        <form action="/employees" className="asset-filter-form" method="get">
          <label className="asset-search">
            <Search size={16} aria-hidden="true" />
            <input defaultValue={search} name="q" placeholder="Search name, code or email" />
          </label>
          <button className="button button-secondary" type="submit">Search</button>
          {search && <Link className="asset-clear-filter" href="/employees">Clear</Link>}
        </form>

        {employees.length ? (
          <div className="asset-table-wrap">
            <table className="asset-table employee-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Assets</th>
                  <th>Status</th>
                  <th>Manage</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <strong className="employee-name">{employee.firstName} {employee.lastName}</strong>
                      <span className="asset-secondary">{employee.employeeCode} · {employee.email ?? "No email"}</span>
                    </td>
                    <td>{employee.department?.name ?? "—"}</td>
                    <td>{employee.location?.name ?? "—"}</td>
                    <td>{assignedByEmployee.get(employee.id) ?? 0}</td>
                    <td><span className={`asset-status${employee.isActive ? " asset-status-assigned" : ""}`}>{employee.isActive ? "Active" : "Inactive"}</span></td>
                    <td>
                      {canUpdate ? (
                        <details className="employee-manage">
                          <summary>Manage</summary>
                          <div className="employee-manage-panel">
                            <EmployeeForm
                              action={updateEmployeeAction}
                              departments={departments}
                              employee={{
                                id: employee.id,
                                employeeCode: employee.employeeCode,
                                firstName: employee.firstName,
                                lastName: employee.lastName,
                                email: employee.email,
                                departmentId: employee.departmentId,
                                locationId: employee.locationId,
                              }}
                              locations={locations}
                              submitLabel="Save employee"
                            />
                            <form action={setEmployeeActiveAction} className="employee-state-form">
                              <input name="employeeId" type="hidden" value={employee.id} />
                              <input name="isActive" type="hidden" value={String(!employee.isActive)} />
                              <button className="button button-secondary" type="submit">
                                {employee.isActive ? "Deactivate" : "Reactivate"}
                              </button>
                            </form>
                          </div>
                        </details>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total > employees.length && <p className="asset-limit-note">Showing the first 100 employee records. Use search to narrow the results.</p>}
          </div>
        ) : (
          <div className="module-empty-state asset-empty-state">
            <span className="module-empty-icon"><Users size={20} /></span>
            <h2>{search ? "No matching employees" : "No employees yet"}</h2>
            <p>{search ? "Try another name, employee code, or email address." : "Create the first employee record above. Only active employees can receive asset assignments."}</p>
          </div>
        )}
      </section>
    </main>
  );
}
