"use client";

import { useActionState } from "react";
import {
  AssetCondition,
  AssetStatus,
} from "@/generated/prisma/enums";
import type {
  assignAssetAction,
  AssetActionState,
  returnAssetAction,
  createAssetAction,
  updateAssetAction,
} from "./actions";

type FormAction = typeof createAssetAction | typeof updateAssetAction;
type AssignmentFormAction =
  | typeof assignAssetAction
  | typeof returnAssetAction;

export type AssetFormValues = {
  id?: string;
  assetTag: string;
  categoryId: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  macAddress: string | null;
  ipAddress: string | null;
  purchaseDate: Date | null;
  purchasePrice: string | null;
  vendorId: string | null;
  warrantyStart: Date | null;
  warrantyEnd: Date | null;
  departmentId: string | null;
  locationId: string | null;
  condition: AssetCondition;
  status: AssetStatus;
  processor: string | null;
  ram: string | null;
  storage: string | null;
  operatingSystem: string | null;
  notes: string | null;
};

export type AssetFormOptions = {
  categories: { id: string; name: string }[];
  vendors: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  locations: { id: string; name: string }[];
};

const initialState: AssetActionState = undefined;

function dateValue(value: Date | null | undefined) {
  return value?.toISOString().slice(0, 10) ?? "";
}

function TextField({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  maxLength,
  minLength,
  placeholder,
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  placeholder?: string;
  step?: string;
}) {
  return (
    <label className="asset-field">
      <span>{label}</span>
      <input
        defaultValue={defaultValue ?? ""}
        maxLength={maxLength}
        name={name}
        minLength={minLength}
        placeholder={placeholder}
        required={required}
        step={step}
        type={type}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="asset-field">
      <span>{label}</span>
      <select
        defaultValue={defaultValue ?? ""}
        name={name}
        required={required}
      >
        {!required && <option value="">Not specified</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AssetForm({
  action,
  options,
  asset,
  allowAssignedStatus = false,
  submitLabel,
}: {
  action: FormAction;
  options: AssetFormOptions;
  asset?: AssetFormValues;
  allowAssignedStatus?: boolean;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="asset-form">
      {asset?.id && <input name="assetId" type="hidden" value={asset.id} />}
      <div className="asset-form-grid">
        <TextField
          defaultValue={asset?.assetTag}
          label="Asset ID"
          maxLength={100}
          name="assetTag"
          required
        />
        <SelectField
          defaultValue={asset?.categoryId}
          label="Category"
          name="categoryId"
          options={options.categories.map(({ id, name }) => ({ value: id, label: name }))}
          required
        />
        <TextField defaultValue={asset?.brand ?? ""} label="Brand" maxLength={120} name="brand" />
        <TextField defaultValue={asset?.model ?? ""} label="Model" maxLength={150} name="model" />
        <TextField defaultValue={asset?.serialNumber ?? ""} label="Serial number" maxLength={150} name="serialNumber" />
        <TextField defaultValue={asset?.macAddress ?? ""} label="MAC address" maxLength={17} name="macAddress" placeholder="00:1A:2B:3C:4D:5E" />
        <TextField defaultValue={asset?.ipAddress ?? ""} label="IP address" maxLength={45} name="ipAddress" placeholder="192.0.2.10 or IPv6" />
        <SelectField
          defaultValue={asset?.condition ?? "NEW"}
          label="Condition"
          name="condition"
          options={Object.values(AssetCondition).map((value) => ({
            value,
            label: value.replaceAll("_", " "),
          }))}
          required
        />
        <SelectField
          defaultValue={asset?.status ?? "IN_STOCK"}
          label="Lifecycle status"
          name="status"
          options={Object.values(AssetStatus)
            .filter((value) => allowAssignedStatus || value !== "ASSIGNED")
            .map((value) => ({
            value,
            label: value.replaceAll("_", " "),
            }))}
          required
        />
        <SelectField
          defaultValue={asset?.vendorId ?? ""}
          label="Vendor"
          name="vendorId"
          options={options.vendors.map(({ id, name }) => ({ value: id, label: name }))}
        />
        <SelectField
          defaultValue={asset?.departmentId ?? ""}
          label="Department"
          name="departmentId"
          options={options.departments.map(({ id, name }) => ({ value: id, label: name }))}
        />
        <SelectField
          defaultValue={asset?.locationId ?? ""}
          label="Location"
          name="locationId"
          options={options.locations.map(({ id, name }) => ({ value: id, label: name }))}
        />
        <TextField defaultValue={dateValue(asset?.purchaseDate)} label="Purchase date" name="purchaseDate" type="date" />
        <TextField defaultValue={asset?.purchasePrice ?? ""} label="Purchase price" name="purchasePrice" step="0.01" type="number" />
        <TextField defaultValue={dateValue(asset?.warrantyStart)} label="Warranty start" name="warrantyStart" type="date" />
        <TextField defaultValue={dateValue(asset?.warrantyEnd)} label="Warranty end" name="warrantyEnd" type="date" />
      </div>

      <div className="asset-form-section-title">Technical specifications</div>
      <div className="asset-form-grid">
        <TextField defaultValue={asset?.processor ?? ""} label="Processor" maxLength={200} name="processor" />
        <TextField defaultValue={asset?.ram ?? ""} label="Memory / RAM" maxLength={100} name="ram" />
        <TextField defaultValue={asset?.storage ?? ""} label="Storage" maxLength={100} name="storage" />
        <TextField defaultValue={asset?.operatingSystem ?? ""} label="Operating system" maxLength={150} name="operatingSystem" />
      </div>
      <label className="asset-field asset-notes-field">
        <span>Notes</span>
        <textarea defaultValue={asset?.notes ?? ""} maxLength={5000} name="notes" rows={3} />
      </label>
      {state?.message && <p className="asset-form-error" role="alert">{state.message}</p>}
      <div className="asset-form-actions">
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function AssetCategoryForm({
  action,
}: {
  action: (
    previousState: AssetActionState,
    formData: FormData,
  ) => Promise<AssetActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} className="asset-category-form">
      <label className="asset-field">
        <span>New category</span>
        <input maxLength={120} minLength={2} name="name" required />
      </label>
      <button className="button button-secondary" disabled={pending} type="submit">
        {pending ? "Adding..." : "Add category"}
      </button>
      {state?.message && <p className="asset-form-error" role="alert">{state.message}</p>}
    </form>
  );
}

export function AssetAssignmentControls({
  assetId,
  employees,
  assigned,
  assignAction,
  returnAction,
}: {
  assetId: string;
  employees: { id: string; employeeCode: string; firstName: string; lastName: string }[];
  assigned: boolean;
  assignAction: AssignmentFormAction;
  returnAction: AssignmentFormAction;
}) {
  const [assignState, assignFormAction, assigning] = useActionState(
    assignAction,
    initialState,
  );
  const [returnState, returnFormAction, returning] = useActionState(
    returnAction,
    initialState,
  );

  return (
    <section className="panel asset-assignment-panel">
      <div className="panel-heading">
        <div>
          <span className="panel-eyebrow">EMPLOYEE LIFECYCLE</span>
          <h2>{assigned ? "Current assignment" : "Assign this asset"}</h2>
        </div>
      </div>
      {assigned ? (
        <form action={returnFormAction} className="asset-assignment-form">
          <input name="assetId" type="hidden" value={assetId} />
          <label className="asset-field">
            <span>Return remarks</span>
            <input maxLength={1000} name="remarks" placeholder="Optional condition or return notes" />
          </label>
          <button className="button button-secondary" disabled={returning} type="submit">
            {returning ? "Returning..." : "Return to stock"}
          </button>
          {returnState?.message && <p className="asset-form-error" role="alert">{returnState.message}</p>}
        </form>
      ) : employees.length ? (
        <form action={assignFormAction} className="asset-assignment-form">
          <input name="assetId" type="hidden" value={assetId} />
          <label className="asset-field">
            <span>Employee</span>
            <select defaultValue="" name="employeeId" required>
              <option disabled value="">Select an active employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName} · {employee.employeeCode}
                </option>
              ))}
            </select>
          </label>
          <label className="asset-field">
            <span>Assignment remarks</span>
            <input maxLength={1000} name="remarks" placeholder="Optional issue or handover notes" />
          </label>
          <button className="button button-primary" disabled={assigning} type="submit">
            {assigning ? "Assigning..." : "Assign asset"}
          </button>
          {assignState?.message && <p className="asset-form-error" role="alert">{assignState.message}</p>}
        </form>
      ) : (
        <p className="asset-assignment-empty">
          Add an active employee before assigning this asset.
        </p>
      )}
    </section>
  );
}
