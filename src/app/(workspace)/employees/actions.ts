"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/authorization";
import { Prisma } from "@/generated/prisma/client";
import type { AssetActionState } from "../assets/actions";

const employeeSchema = z.object({
  employeeCode: z.string().trim().min(1).max(80).transform((value) => value.toUpperCase()),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.union([z.literal(""), z.email()]).transform((value) => value.toLowerCase() || null),
  departmentId: z.union([z.literal(""), z.string().uuid()]).transform((value) => value || null),
  locationId: z.union([z.literal(""), z.string().uuid()]).transform((value) => value || null),
});

export type EmployeeActionState = AssetActionState;

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

async function validateReferences(
  organizationId: string,
  departmentId: string | null,
  locationId: string | null,
) {
  const { db } = await import("@/lib/db");
  const [department, location] = await Promise.all([
    departmentId
      ? db.department.findFirst({
          where: { id: departmentId, organizationId },
          select: { id: true },
        })
      : null,
    locationId
      ? db.location.findFirst({
          where: { id: locationId, organizationId },
          select: { id: true },
        })
      : null,
  ]);
  return (!departmentId || Boolean(department)) && (!locationId || Boolean(location));
}

function parseEmployee(formData: FormData) {
  return employeeSchema.safeParse({
    employeeCode: formString(formData, "employeeCode"),
    firstName: formString(formData, "firstName"),
    lastName: formString(formData, "lastName"),
    email: formString(formData, "email"),
    departmentId: formString(formData, "departmentId"),
    locationId: formString(formData, "locationId"),
  });
}

export async function createEmployeeAction(
  _previousState: EmployeeActionState,
  formData: FormData,
): Promise<EmployeeActionState> {
  const principal = await requirePermission("employees.create");
  const parsed = parseEmployee(formData);
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Check the employee details." };
  }
  if (!(await validateReferences(
    principal.organizationId,
    parsed.data.departmentId,
    parsed.data.locationId,
  ))) {
    return { message: "Choose department and location records from your organization." };
  }

  const { db } = await import("@/lib/db");
  try {
    await db.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: { ...parsed.data, organizationId: principal.organizationId },
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          isActive: true,
          departmentId: true,
          locationId: true,
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: principal.organizationId,
          userId: principal.id,
          action: "CREATE",
          module: "employees",
          recordId: employee.id,
          newValues: {
            employeeCode: employee.employeeCode,
            firstName: employee.firstName,
            lastName: employee.lastName,
            isActive: employee.isActive,
          },
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { message: "That employee code or email is already in use in this organization." };
    }
    throw error;
  }

  revalidatePath("/employees");
  redirect("/employees?created=1");
}

export async function updateEmployeeAction(
  _previousState: EmployeeActionState,
  formData: FormData,
): Promise<EmployeeActionState> {
  const principal = await requirePermission("employees.update");
  const employeeId = z.string().uuid().safeParse(formString(formData, "employeeId"));
  const parsed = parseEmployee(formData);
  if (!employeeId.success || !parsed.success) {
    return { message: parsed.success ? "Invalid employee record." : parsed.error.issues[0]?.message ?? "Check the employee details." };
  }
  if (!(await validateReferences(
    principal.organizationId,
    parsed.data.departmentId,
    parsed.data.locationId,
  ))) {
    return { message: "Choose department and location records from your organization." };
  }

  const { db } = await import("@/lib/db");
  try {
    const updated = await db.$transaction(async (tx) => {
      const existing = await tx.employee.findFirst({
        where: { id: employeeId.data, organizationId: principal.organizationId },
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          isActive: true,
          departmentId: true,
          locationId: true,
        },
      });
      if (!existing) return "missing" as const;
      if (
        (existing.departmentId !== parsed.data.departmentId ||
          existing.locationId !== parsed.data.locationId) &&
        (await tx.asset.count({
          where: {
            organizationId: principal.organizationId,
            employeeId: existing.id,
            archivedAt: null,
            status: "ASSIGNED",
          },
        }))
      ) {
        return "assigned-assets" as const;
      }

      const employee = await tx.employee.update({
        where: { id: existing.id },
        data: parsed.data,
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          isActive: true,
          departmentId: true,
          locationId: true,
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: principal.organizationId,
          userId: principal.id,
          action: "UPDATE",
          module: "employees",
          recordId: employee.id,
          previousValues: existing,
          newValues: {
            employeeCode: employee.employeeCode,
            firstName: employee.firstName,
            lastName: employee.lastName,
            isActive: employee.isActive,
            departmentId: employee.departmentId,
            locationId: employee.locationId,
          },
        },
      });
      return "updated" as const;
    });
    if (updated === "missing") {
      return { message: "This employee record could not be found." };
    }
    if (updated === "assigned-assets") {
      return { message: "Return or transfer this employee's assigned assets before changing their department or location." };
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { message: "That employee code or email is already in use in this organization." };
    }
    throw error;
  }

  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId.data}`);
  redirect("/employees?updated=1");
}

export async function setEmployeeActiveAction(formData: FormData) {
  const principal = await requirePermission("employees.update");
  const input = z
    .object({ employeeId: z.string().uuid(), isActive: z.enum(["true", "false"]) })
    .safeParse({
      employeeId: formString(formData, "employeeId"),
      isActive: formString(formData, "isActive"),
    });
  if (!input.success) {
    redirect("/employees?invalid=1");
  }

  const isActive = input.data.isActive === "true";
  const { db } = await import("@/lib/db");
  const changed = await db.$transaction(async (tx) => {
    const employee = await tx.employee.findFirst({
      where: { id: input.data.employeeId, organizationId: principal.organizationId },
      select: { id: true, employeeCode: true, isActive: true },
    });
    if (!employee) return "missing" as const;
    if (employee.isActive === isActive) return "unchanged" as const;

    if (!isActive) {
      const activeAssignments = await tx.asset.count({
        where: {
          organizationId: principal.organizationId,
          employeeId: employee.id,
          archivedAt: null,
          status: "ASSIGNED",
        },
      });
      if (activeAssignments) return "assigned-assets" as const;
    }

    await tx.employee.update({ where: { id: employee.id }, data: { isActive } });
    await tx.auditLog.create({
      data: {
        organizationId: principal.organizationId,
        userId: principal.id,
        action: isActive ? "ACTIVATE" : "DEACTIVATE",
        module: "employees",
        recordId: employee.id,
        previousValues: { employeeCode: employee.employeeCode, isActive: employee.isActive },
        newValues: { employeeCode: employee.employeeCode, isActive },
      },
    });
    return "changed" as const;
  });

  if (changed === "assigned-assets") {
    redirect("/employees?assignedAssets=1");
  }
  if (changed === "missing") {
    redirect("/employees?missing=1");
  }
  revalidatePath("/employees");
  redirect(`/employees?${isActive ? "activated" : "deactivated"}=1`);
}

export async function createDepartmentAction(
  _previousState: EmployeeActionState,
  formData: FormData,
): Promise<EmployeeActionState> {
  const principal = await requirePermission("employees.create");
  const name = z.string().trim().min(2).max(150).safeParse(formString(formData, "name"));
  if (!name.success) {
    return { message: "Enter a department name between 2 and 150 characters." };
  }
  const { db } = await import("@/lib/db");
  const existing = await db.department.findFirst({
    where: {
      organizationId: principal.organizationId,
      name: { equals: name.data, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (existing) {
    return { message: "That department already exists." };
  }

  try {
    await db.$transaction(async (tx) => {
      const department = await tx.department.create({
        data: { organizationId: principal.organizationId, name: name.data },
      });
      await tx.auditLog.create({
        data: {
          organizationId: principal.organizationId,
          userId: principal.id,
          action: "CREATE",
          module: "departments",
          recordId: department.id,
          newValues: { name: department.name },
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { message: "That department already exists." };
    }
    throw error;
  }

  revalidatePath("/employees");
  redirect("/employees?departmentCreated=1");
}
