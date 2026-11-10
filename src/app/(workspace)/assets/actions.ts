"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/authorization";
import { AssetCondition, AssetStatus, Prisma } from "@/generated/prisma/client";

const nullableText = (max: number) =>
  z.string().trim().max(max).transform((value) => value || null);

const nullableDate = z
  .union([z.literal(""), z.iso.date()])
  .transform((value) => (value ? new Date(`${value}T00:00:00.000Z`) : null));

const nullablePrice = z
  .union([z.literal(""), z.string().regex(/^\d{1,12}(?:\.\d{1,2})?$/)])
  .transform((value) => (value ? Number(value) : null));

const assetSchema = z
  .object({
    assetTag: z.string().trim().min(1).max(100).transform((value) => value.toUpperCase()),
    categoryId: z.string().uuid(),
    brand: nullableText(120),
    model: nullableText(150),
    serialNumber: nullableText(150).transform((value) => value?.toUpperCase() ?? null),
    macAddress: z
      .string()
      .trim()
      .max(17)
      .regex(/^$|^(?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i)
      .transform((value) => value.replaceAll("-", ":").toUpperCase() || null),
    ipAddress: nullableText(45),
    purchaseDate: nullableDate,
    purchasePrice: nullablePrice,
    vendorId: z.union([z.literal(""), z.string().uuid()]).transform((value) => value || null),
    warrantyStart: nullableDate,
    warrantyEnd: nullableDate,
    departmentId: z.union([z.literal(""), z.string().uuid()]).transform((value) => value || null),
    locationId: z.union([z.literal(""), z.string().uuid()]).transform((value) => value || null),
    condition: z.enum(AssetCondition),
    status: z.enum(AssetStatus),
    processor: nullableText(200),
    ram: nullableText(100),
    storage: nullableText(100),
    operatingSystem: nullableText(150),
    notes: nullableText(5000),
  })
  .refine(
    ({ warrantyStart, warrantyEnd }) =>
      !warrantyStart || !warrantyEnd || warrantyEnd >= warrantyStart,
    { path: ["warrantyEnd"], message: "Warranty end must be on or after its start." },
  );

export type AssetActionState = { message?: string } | undefined;

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseAssetForm(formData: FormData) {
  return assetSchema.safeParse({
    assetTag: formString(formData, "assetTag"),
    categoryId: formString(formData, "categoryId"),
    brand: formString(formData, "brand"),
    model: formString(formData, "model"),
    serialNumber: formString(formData, "serialNumber"),
    macAddress: formString(formData, "macAddress"),
    ipAddress: formString(formData, "ipAddress"),
    purchaseDate: formString(formData, "purchaseDate"),
    purchasePrice: formString(formData, "purchasePrice"),
    vendorId: formString(formData, "vendorId"),
    warrantyStart: formString(formData, "warrantyStart"),
    warrantyEnd: formString(formData, "warrantyEnd"),
    departmentId: formString(formData, "departmentId"),
    locationId: formString(formData, "locationId"),
    condition: formString(formData, "condition") || "NEW",
    status: formString(formData, "status") || "IN_STOCK",
    processor: formString(formData, "processor"),
    ram: formString(formData, "ram"),
    storage: formString(formData, "storage"),
    operatingSystem: formString(formData, "operatingSystem"),
    notes: formString(formData, "notes"),
  });
}

function getValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the asset details and try again.";
}

async function validateOrganizationReferences(
  organizationId: string,
  asset: z.output<typeof assetSchema>,
) {
  const { db } = await import("@/lib/db");
  const [category, vendor, department, location] = await Promise.all([
    db.assetCategory.findFirst({
      where: { id: asset.categoryId, organizationId },
      select: { id: true },
    }),
    asset.vendorId
      ? db.vendor.findFirst({
          where: { id: asset.vendorId, organizationId },
          select: { id: true },
        })
      : null,
    asset.departmentId
      ? db.department.findFirst({
          where: { id: asset.departmentId, organizationId },
          select: { id: true },
        })
      : null,
    asset.locationId
      ? db.location.findFirst({
          where: { id: asset.locationId, organizationId },
          select: { id: true },
        })
      : null,
  ]);

  if (!category || (asset.vendorId && !vendor) || (asset.departmentId && !department) || (asset.locationId && !location)) {
    return false;
  }
  return true;
}

function assetSnapshot(asset: {
  assetTag: string;
  categoryId: string;
  serialNumber: string | null;
  status: AssetStatus;
  condition: AssetCondition;
}) {
  return {
    assetTag: asset.assetTag,
    categoryId: asset.categoryId,
    serialNumber: asset.serialNumber,
    status: asset.status,
    condition: asset.condition,
  };
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export async function createAssetAction(
  _previousState: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const principal = await requirePermission("assets.create");
  const parsed = parseAssetForm(formData);
  if (!parsed.success) {
    return { message: getValidationMessage(parsed.error) };
  }
  if (parsed.data.status === "ASSIGNED") {
    return { message: "Use the employee assignment workflow to assign an asset." };
  }

  if (!(await validateOrganizationReferences(principal.organizationId, parsed.data))) {
    return { message: "Choose a category and related records from your organization." };
  }
  const { processor, ram, storage, operatingSystem, ...assetData } = parsed.data;
  const { db } = await import("@/lib/db");

  try {
    await db.$transaction(async (tx) => {
      const asset = await tx.asset.create({
        data: {
          ...assetData,
          organizationId: principal.organizationId,
          specs: {
            create: {
              organizationId: principal.organizationId,
              processor,
              ram,
              storage,
              operatingSystem,
            },
          },
        },
        select: { id: true, assetTag: true, categoryId: true, status: true, condition: true, serialNumber: true },
      });

      await tx.assetStatusHistory.create({
        data: {
          organizationId: principal.organizationId,
          assetId: asset.id,
          newStatus: asset.status,
          changedById: principal.id,
          remarks: "Asset registered",
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: principal.organizationId,
          userId: principal.id,
          action: "CREATE",
          module: "assets",
          recordId: asset.id,
          newValues: assetSnapshot(asset),
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { message: "That asset ID or serial number is already in use in this organization." };
    }
    throw error;
  }

  revalidatePath("/assets");
  redirect("/assets?created=1");
}

export async function updateAssetAction(
  _previousState: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const principal = await requirePermission("assets.update");
  const assetId = z.string().uuid().safeParse(formString(formData, "assetId"));
  const parsed = parseAssetForm(formData);
  if (!assetId.success || !parsed.success) {
    return { message: parsed.success ? "Invalid asset record." : getValidationMessage(parsed.error) };
  }

  if (!(await validateOrganizationReferences(principal.organizationId, parsed.data))) {
    return { message: "Choose a category and related records from your organization." };
  }
  const { processor, ram, storage, operatingSystem, ...assetData } = parsed.data;
  const { db } = await import("@/lib/db");

  try {
    const updated = await db.$transaction(async (tx) => {
      const existing = await tx.asset.findFirst({
        where: {
          id: assetId.data,
          organizationId: principal.organizationId,
          archivedAt: null,
        },
        select: {
          id: true,
          assetTag: true,
          categoryId: true,
          serialNumber: true,
          status: true,
          condition: true,
        },
      });
      if (!existing) {
        return "missing" as const;
      }
      if (
        parsed.data.status !== existing.status &&
        (parsed.data.status === "ASSIGNED" || existing.status === "ASSIGNED")
      ) {
        return "assignment-required" as const;
      }

      const asset = await tx.asset.update({
        where: {
          id: existing.id,
          organizationId: principal.organizationId,
          archivedAt: null,
        },
        data: {
          ...assetData,
          specs: {
            upsert: {
              create: {
                organizationId: principal.organizationId,
                processor,
                ram,
                storage,
                operatingSystem,
              },
              update: {
                processor,
                ram,
                storage,
                operatingSystem,
              },
            },
          },
        },
        select: { id: true, assetTag: true, categoryId: true, status: true, condition: true, serialNumber: true },
      });

      if (existing.status !== asset.status) {
        await tx.assetStatusHistory.create({
          data: {
            organizationId: principal.organizationId,
            assetId: asset.id,
            previousStatus: existing.status,
            newStatus: asset.status,
            changedById: principal.id,
          },
        });
      }
      await tx.auditLog.create({
        data: {
          organizationId: principal.organizationId,
          userId: principal.id,
          action: "UPDATE",
          module: "assets",
          recordId: asset.id,
          previousValues: assetSnapshot(existing),
          newValues: assetSnapshot(asset),
        },
      });
      return "updated" as const;
    });
    if (updated === "missing") {
      return { message: "This asset was archived or removed by another user." };
    }
    if (updated === "assignment-required") {
      return { message: "Use the employee assignment workflow to mark an asset as assigned." };
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { message: "That asset ID or serial number is already in use in this organization." };
    }
    throw error;
  }

  revalidatePath("/assets");
  revalidatePath(`/assets/${assetId.data}`);
  redirect(`/assets/${assetId.data}?updated=1`);
}

export async function archiveAssetAction(formData: FormData) {
  const principal = await requirePermission("assets.delete");
  const assetId = z.string().uuid().parse(formString(formData, "assetId"));
  const { db } = await import("@/lib/db");

  const archived = await db.$transaction(async (tx) => {
    const existing = await tx.asset.findFirst({
      where: {
        id: assetId,
        organizationId: principal.organizationId,
        archivedAt: null,
      },
      select: { id: true, assetTag: true, status: true, employeeId: true },
    });
    if (!existing) {
      return "missing" as const;
    }
    if (existing.status === "ASSIGNED" || existing.employeeId) {
      return "assigned" as const;
    }

    const archivedAt = new Date();
    const archived = await tx.asset.updateMany({
      where: {
        id: existing.id,
        organizationId: principal.organizationId,
        archivedAt: null,
        status: { not: "ASSIGNED" },
        employeeId: null,
      },
      data: { archivedAt },
    });
    if (!archived.count) return "assigned" as const;
    await tx.auditLog.create({
      data: {
        organizationId: principal.organizationId,
        userId: principal.id,
        action: "ARCHIVE",
        module: "assets",
        recordId: existing.id,
        previousValues: existing,
        newValues: { archivedAt: archivedAt.toISOString() },
      },
    });
    return "archived" as const;
  });

  if (archived === "missing") {
    redirect("/assets?missing=1");
  }
  if (archived === "assigned") {
    redirect("/assets?activeAssignment=1");
  }
  revalidatePath("/assets");
  redirect("/assets?archived=1");
}

export async function createAssetCategoryAction(
  _previousState: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const principal = await requirePermission("assets.create");
  const name = z.string().trim().min(2).max(120).safeParse(formString(formData, "name"));
  if (!name.success) {
    return { message: "Enter a category name between 2 and 120 characters." };
  }

  const { db } = await import("@/lib/db");
  const existing = await db.assetCategory.findFirst({
    where: { organizationId: principal.organizationId, name: { equals: name.data, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) {
    return { message: "That asset category already exists." };
  }

  try {
    await db.$transaction(async (tx) => {
      const category = await tx.assetCategory.create({
        data: { organizationId: principal.organizationId, name: name.data },
      });
      await tx.auditLog.create({
        data: {
          organizationId: principal.organizationId,
          userId: principal.id,
          action: "CREATE",
          module: "asset_categories",
          recordId: category.id,
          newValues: { name: category.name },
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { message: "That asset category already exists." };
    }
    throw error;
  }

  revalidatePath("/assets");
  redirect("/assets?categoryCreated=1");
}

export async function assignAssetAction(
  _previousState: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const principal = await requirePermission("assets.assign");
  const input = z
    .object({
      assetId: z.string().uuid(),
      employeeId: z.string().uuid(),
      remarks: z.string().trim().max(1000),
    })
    .safeParse({
      assetId: formString(formData, "assetId"),
      employeeId: formString(formData, "employeeId"),
      remarks: formString(formData, "remarks"),
    });
  if (!input.success) {
    return { message: "Choose an employee and check the assignment details." };
  }

  const { db } = await import("@/lib/db");
  const result = await db.$transaction(async (tx) => {
    const employee = await tx.employee.findFirst({
      where: {
        id: input.data.employeeId,
        organizationId: principal.organizationId,
        isActive: true,
      },
      select: { id: true, departmentId: true, locationId: true },
    });
    if (!employee) {
      return "employee-unavailable" as const;
    }

    const asset = await tx.asset.findFirst({
      where: {
        id: input.data.assetId,
        organizationId: principal.organizationId,
        archivedAt: null,
        employeeId: null,
        status: { in: ["IN_STOCK", "REPAIRED"] },
      },
      select: { id: true, assetTag: true, status: true, locationId: true },
    });
    if (!asset) {
      return "asset-unavailable" as const;
    }

    const claimed = await tx.asset.updateMany({
      where: {
        id: asset.id,
        organizationId: principal.organizationId,
        archivedAt: null,
        employeeId: null,
        status: { in: ["IN_STOCK", "REPAIRED"] },
      },
      data: {
        employeeId: employee.id,
        departmentId: employee.departmentId,
        locationId: employee.locationId,
        status: "ASSIGNED",
      },
    });
    if (!claimed.count) {
      return "asset-unavailable" as const;
    }

    await tx.assetAssignment.create({
      data: {
        organizationId: principal.organizationId,
        assetId: asset.id,
        employeeId: employee.id,
        assignedById: principal.id,
        remarks: input.data.remarks || null,
      },
    });
    await tx.assetStatusHistory.create({
      data: {
        organizationId: principal.organizationId,
        assetId: asset.id,
        previousStatus: asset.status,
        newStatus: "ASSIGNED",
        changedById: principal.id,
        remarks: "Asset assigned to employee",
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: principal.organizationId,
        userId: principal.id,
        action: "ASSIGN",
        module: "assets",
        recordId: asset.id,
        previousValues: {
          status: asset.status,
          employeeId: null,
          locationId: asset.locationId,
        },
        newValues: {
          status: "ASSIGNED",
          employeeId: employee.id,
          locationId: employee.locationId,
        },
      },
    });
    return "assigned" as const;
  });

  if (result === "employee-unavailable") {
    return { message: "That employee is inactive or is not in this organization." };
  }
  if (result === "asset-unavailable") {
    return { message: "This asset is no longer available for assignment." };
  }

  revalidatePath("/assets");
  revalidatePath(`/assets/${input.data.assetId}`);
  revalidatePath("/employees");
  redirect(`/assets/${input.data.assetId}?assigned=1`);
}

export async function returnAssetAction(
  _previousState: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const principal = await requirePermission("assets.assign");
  const input = z
    .object({
      assetId: z.string().uuid(),
      remarks: z.string().trim().max(1000),
    })
    .safeParse({
      assetId: formString(formData, "assetId"),
      remarks: formString(formData, "remarks"),
    });
  if (!input.success) {
    return { message: "Check the return details and try again." };
  }

  const { db } = await import("@/lib/db");
  const result = await db.$transaction(async (tx) => {
    const asset = await tx.asset.findFirst({
      where: {
        id: input.data.assetId,
        organizationId: principal.organizationId,
        archivedAt: null,
        status: "ASSIGNED",
        employeeId: { not: null },
      },
      select: { id: true, assetTag: true, status: true, employeeId: true },
    });
    if (!asset?.employeeId) {
      return "asset-unavailable" as const;
    }

    const returnedAt = new Date();
    const returned = await tx.asset.updateMany({
      where: {
        id: asset.id,
        organizationId: principal.organizationId,
        archivedAt: null,
        status: "ASSIGNED",
        employeeId: asset.employeeId,
      },
      data: { employeeId: null, departmentId: null, status: "IN_STOCK" },
    });
    if (!returned.count) {
      return "asset-unavailable" as const;
    }

    const assignment = await tx.assetAssignment.findFirst({
      where: {
        organizationId: principal.organizationId,
        assetId: asset.id,
        employeeId: asset.employeeId,
        returnedAt: null,
      },
      orderBy: { assignedAt: "desc" },
      select: { id: true, remarks: true },
    });
    if (!assignment) {
      throw new Error("Assigned asset is missing its active assignment history.");
    }

    await tx.assetAssignment.update({
      where: { id: assignment.id },
      data: {
        returnedAt,
        remarks: input.data.remarks
          ? [
              assignment.remarks ? `Assignment notes: ${assignment.remarks}` : "",
              `Return notes: ${input.data.remarks}`,
            ]
              .filter(Boolean)
              .join("\n")
          : undefined,
      },
    });
    await tx.assetStatusHistory.create({
      data: {
        organizationId: principal.organizationId,
        assetId: asset.id,
        previousStatus: asset.status,
        newStatus: "IN_STOCK",
        changedById: principal.id,
        remarks: "Asset returned to stock",
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: principal.organizationId,
        userId: principal.id,
        action: "RETURN",
        module: "assets",
        recordId: asset.id,
        previousValues: { status: asset.status, employeeId: asset.employeeId },
        newValues: { status: "IN_STOCK", employeeId: null },
      },
    });
    return "returned" as const;
  });

  if (result === "asset-unavailable") {
    return { message: "This asset is no longer assigned or has already been returned." };
  }

  revalidatePath("/assets");
  revalidatePath(`/assets/${input.data.assetId}`);
  revalidatePath("/employees");
  redirect(`/assets/${input.data.assetId}?returned=1`);
}
