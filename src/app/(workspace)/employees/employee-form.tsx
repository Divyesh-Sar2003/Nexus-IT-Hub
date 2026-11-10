"use client";

import { useActionState } from "react";
import type {
  createEmployeeAction,
  EmployeeActionState,
  updateEmployeeAction,
} from "./actions";

type EmployeeFormAction =
  | typeof createEmployeeAction
  | typeof updateEmployeeAction;

const initialState: EmployeeActionState = undefined;

export type EmployeeFormValues = {
  id?: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string | null;
  departmentId: string | null;
  locationId: string | null;
};

export function EmployeeForm({
  action,
  employee,
  departments,
  locations,
  submitLabel,
}: {
  action: EmployeeFormAction;
  employee?: EmployeeFormValues;
  departments: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} className="employee-form">
      {employee?.id && <input name="employeeId" type="hidden" value={employee.id} />}
      <label className="asset-field">
        <span>Employee code</span>
        <input defaultValue={employee?.employeeCode ?? ""} maxLength={80} name="employeeCode" required />
      </label>
      <label className="asset-field">
        <span>First name</span>
        <input defaultValue={employee?.firstName ?? ""} maxLength={100} name="firstName" required />
      </label>
      <label className="asset-field">
        <span>Last name</span>
        <input defaultValue={employee?.lastName ?? ""} maxLength={100} name="lastName" required />
      </label>
      <label className="asset-field">
        <span>Work email</span>
        <input autoComplete="email" defaultValue={employee?.email ?? ""} maxLength={320} name="email" type="email" />
      </label>
      <label className="asset-field">
        <span>Department</span>
        <select defaultValue={employee?.departmentId ?? ""} name="departmentId">
          <option value="">Not specified</option>
          {departments.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
        </select>
      </label>
      <label className="asset-field">
        <span>Location</span>
        <select defaultValue={employee?.locationId ?? ""} name="locationId">
          <option value="">Not specified</option>
          {locations.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
        </select>
      </label>
      {state?.message && <p className="asset-form-error" role="alert">{state.message}</p>}
      <button className="button button-primary" disabled={pending} type="submit">
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

export function DepartmentForm({
  action,
}: {
  action: (
    previousState: EmployeeActionState,
    formData: FormData,
  ) => Promise<EmployeeActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} className="asset-category-form">
      <label className="asset-field">
        <span>New department</span>
        <input maxLength={150} minLength={2} name="name" required />
      </label>
      <button className="button button-secondary" disabled={pending} type="submit">
        {pending ? "Adding..." : "Add department"}
      </button>
      {state?.message && <p className="asset-form-error" role="alert">{state.message}</p>}
    </form>
  );
}
