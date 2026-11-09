-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('REQUESTED', 'APPROVED', 'ORDERED', 'RECEIVED', 'IN_STOCK', 'ASSIGNED', 'UNDER_MAINTENANCE', 'REPAIRED', 'RETIRED', 'DISPOSED');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'RESERVED', 'DAMAGED', 'UNDER_REPAIR', 'RETURNED');

-- CreateEnum
CREATE TYPE "StockTransactionType" AS ENUM ('INWARD', 'OUTWARD', 'RESERVATION', 'ASSIGNMENT', 'RETURN', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RecordSource" AS ENUM ('MANUAL', 'IMPORT', 'INTEGRATION');

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "authUserId" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "displayName" VARCHAR(200) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "isSystem" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "assignedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "organizationId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "employeeCode" VARCHAR(80) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(320),
    "departmentId" UUID,
    "locationId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "address" VARCHAR(500),

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetCategory" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,

    CONSTRAINT "AssetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(320),
    "phone" VARCHAR(50),
    "notes" TEXT,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "assetTag" VARCHAR(100) NOT NULL,
    "categoryId" UUID NOT NULL,
    "brand" VARCHAR(120),
    "model" VARCHAR(150),
    "serialNumber" VARCHAR(150),
    "macAddress" VARCHAR(17),
    "ipAddress" VARCHAR(45),
    "purchaseDate" DATE,
    "purchasePrice" DECIMAL(14,2),
    "vendorId" UUID,
    "warrantyStart" DATE,
    "warrantyEnd" DATE,
    "employeeId" UUID,
    "departmentId" UUID,
    "locationId" UUID,
    "condition" "AssetCondition" NOT NULL DEFAULT 'NEW',
    "status" "AssetStatus" NOT NULL DEFAULT 'IN_STOCK',
    "notes" TEXT,
    "archivedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetSpecs" (
    "organizationId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "processor" VARCHAR(200),
    "ram" VARCHAR(100),
    "storage" VARCHAR(100),
    "operatingSystem" VARCHAR(150),

    CONSTRAINT "AssetSpecs_pkey" PRIMARY KEY ("assetId")
);

-- CreateTable
CREATE TABLE "AssetAssignment" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "assignedById" UUID,
    "assignedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMPTZ(6),
    "remarks" TEXT,

    CONSTRAINT "AssetAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetStatusHistory" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "previousStatus" "AssetStatus",
    "newStatus" "AssetStatus" NOT NULL,
    "changedById" UUID,
    "changedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,

    CONSTRAINT "AssetStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetMaintenance" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "vendorId" UUID,
    "issue" TEXT NOT NULL,
    "repairCost" DECIMAL(14,2),
    "startedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(6),
    "resolution" TEXT,

    CONSTRAINT "AssetMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warranty" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "vendorId" UUID,
    "startsAt" DATE NOT NULL,
    "expiresAt" DATE NOT NULL,
    "reference" VARCHAR(150),

    CONSTRAINT "Warranty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetPurchase" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "purchaseItemId" UUID NOT NULL,

    CONSTRAINT "AssetPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "purchaseOrderId" UUID,
    "invoiceNumber" VARCHAR(100) NOT NULL,
    "issuedAt" DATE,
    "amount" DECIMAL(14,2) NOT NULL,
    "storagePath" VARCHAR(500),

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkDevice" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "assetId" UUID,
    "employeeId" UUID,
    "locationId" UUID,
    "name" VARCHAR(150) NOT NULL,
    "deviceType" VARCHAR(80) NOT NULL,
    "managementIp" VARCHAR(45),
    "macAddress" VARCHAR(17),
    "notes" TEXT,

    CONSTRAINT "NetworkDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Firewall" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "manufacturer" VARCHAR(120),
    "model" VARCHAR(150),
    "managementIp" VARCHAR(45),
    "locationId" UUID,
    "firmware" VARCHAR(100),
    "notes" TEXT,
    "source" "RecordSource" NOT NULL DEFAULT 'MANUAL',
    "lastUpdatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Firewall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirewallUser" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "firewallId" UUID NOT NULL,
    "username" VARCHAR(150) NOT NULL,
    "employeeId" UUID,
    "ipAddress" VARCHAR(45),
    "macAddress" VARCHAR(17),
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" DATE,
    "source" "RecordSource" NOT NULL DEFAULT 'MANUAL',
    "lastUpdatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FirewallUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VpnUser" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "firewallId" UUID,
    "username" VARCHAR(150) NOT NULL,
    "employeeId" UUID,
    "vpnType" VARCHAR(80),
    "assignedIp" VARCHAR(45),
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "accessStartsAt" DATE,
    "expiresAt" DATE,
    "source" "RecordSource" NOT NULL DEFAULT 'MANUAL',
    "lastUpdatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VpnUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MacBinding" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "firewallId" UUID,
    "assetId" UUID,
    "employeeId" UUID,
    "macAddress" VARCHAR(17) NOT NULL,
    "ipAddress" VARCHAR(45) NOT NULL,
    "deviceName" VARCHAR(150),
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "source" "RecordSource" NOT NULL DEFAULT 'MANUAL',
    "lastUpdatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MacBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirewallGroup" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "firewallId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,

    CONSTRAINT "FirewallGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirewallUserGroup" (
    "organizationId" UUID NOT NULL,
    "firewallUserId" UUID NOT NULL,
    "groupId" UUID NOT NULL,

    CONSTRAINT "FirewallUserGroup_pkey" PRIMARY KEY ("firewallUserId","groupId")
);

-- CreateTable
CREATE TABLE "BandwidthPolicy" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "downloadMbps" DECIMAL(10,2),
    "uploadMbps" DECIMAL(10,2),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BandwidthPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirewallUserPolicy" (
    "organizationId" UUID NOT NULL,
    "firewallUserId" UUID NOT NULL,
    "policyId" UUID NOT NULL,

    CONSTRAINT "FirewallUserPolicy_pkey" PRIMARY KEY ("firewallUserId","policyId")
);

-- CreateTable
CREATE TABLE "Vlan" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "vlanId" INTEGER NOT NULL,
    "subnet" VARCHAR(50),

    CONSTRAINT "Vlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IpAllocation" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "firewallId" UUID,
    "address" VARCHAR(45) NOT NULL,
    "subnet" VARCHAR(50),
    "vlanId" UUID,
    "deviceName" VARCHAR(150),
    "employeeId" UUID,
    "status" VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "IpAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirewallImportBatch" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "firewallId" UUID,
    "fileName" VARCHAR(255) NOT NULL,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "importedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FirewallImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "sku" VARCHAR(100),
    "description" VARCHAR(300) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minimumQuantity" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(14,2),
    "archivedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransaction" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "inventoryId" UUID NOT NULL,
    "type" "StockTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reference" VARCHAR(150),
    "remarks" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "orderNumber" VARCHAR(100) NOT NULL,
    "vendorId" UUID NOT NULL,
    "purchaseDate" DATE NOT NULL,
    "invoiceNumber" VARCHAR(100),
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "deliveryDate" DATE,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "purchaseOrderId" UUID NOT NULL,
    "assetId" UUID,
    "description" VARCHAR(300) NOT NULL,
    "category" VARCHAR(120),
    "model" VARCHAR(150),
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "warrantyMonths" INTEGER,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftwareProduct" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "publisher" VARCHAR(150),

    CONSTRAINT "SoftwareProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftwareLicense" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "softwareProductId" UUID NOT NULL,
    "vendorId" UUID,
    "licenseType" VARCHAR(100) NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "purchasedAt" DATE,
    "expiresAt" DATE,
    "renewalCost" DECIMAL(14,2),
    "status" "LicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "secretReference" VARCHAR(300),

    CONSTRAINT "SoftwareLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseAssignment" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "licenseId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "assignedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMPTZ(6),

    CONSTRAINT "LicenseAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseRenewal" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "licenseId" UUID NOT NULL,
    "renewedAt" DATE NOT NULL,
    "expiresAt" DATE NOT NULL,
    "cost" DECIMAL(14,2),
    "notes" TEXT,

    CONSTRAINT "LicenseRenewal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItExpense" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "vendorId" UUID,
    "category" VARCHAR(100) NOT NULL,
    "description" VARCHAR(300) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "incurredAt" DATE NOT NULL,

    CONSTRAINT "ItExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "departmentId" UUID,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetDepreciation" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "calculatedAt" DATE NOT NULL,
    "bookValue" DECIMAL(14,2) NOT NULL,
    "method" VARCHAR(50) NOT NULL,

    CONSTRAINT "AssetDepreciation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "ticketNumber" VARCHAR(100) NOT NULL,
    "assetId" UUID,
    "createdById" UUID NOT NULL,
    "technicianId" UUID,
    "issue" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "repairCost" DECIMAL(14,2),
    "resolution" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMPTZ(6),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedReport" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "reportType" VARCHAR(100) NOT NULL,
    "filters" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID,
    "action" VARCHAR(100) NOT NULL,
    "module" VARCHAR(100) NOT NULL,
    "recordId" UUID,
    "previousValues" JSONB,
    "newValues" JSONB,
    "ipAddress" VARCHAR(45),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "assetId" UUID,
    "storagePath" VARCHAR(500) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "contentType" VARCHAR(150) NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "module" VARCHAR(100) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportError" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "importJobId" UUID NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "field" VARCHAR(150),
    "message" TEXT NOT NULL,

    CONSTRAINT "ImportError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "eventKey" VARCHAR(200) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "key" VARCHAR(150) NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");

-- CreateIndex
CREATE INDEX "User_organizationId_isActive_idx" ON "User"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "User_organizationId_email_key" ON "User"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_organizationId_name_key" ON "Role"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_organizationId_key_key" ON "Permission"("organizationId", "key");

-- CreateIndex
CREATE INDEX "UserRole_organizationId_idx" ON "UserRole"("organizationId");

-- CreateIndex
CREATE INDEX "RolePermission_organizationId_idx" ON "RolePermission"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_organizationId_name_key" ON "Department"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Employee_organizationId_departmentId_idx" ON "Employee"("organizationId", "departmentId");

-- CreateIndex
CREATE INDEX "Employee_organizationId_lastName_firstName_idx" ON "Employee"("organizationId", "lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_organizationId_employeeCode_key" ON "Employee"("organizationId", "employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "Location_organizationId_name_key" ON "Location"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AssetCategory_organizationId_name_key" ON "AssetCategory"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_organizationId_name_key" ON "Vendor"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Asset_organizationId_categoryId_status_idx" ON "Asset"("organizationId", "categoryId", "status");

-- CreateIndex
CREATE INDEX "Asset_organizationId_employeeId_idx" ON "Asset"("organizationId", "employeeId");

-- CreateIndex
CREATE INDEX "Asset_organizationId_warrantyEnd_idx" ON "Asset"("organizationId", "warrantyEnd");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_organizationId_assetTag_key" ON "Asset"("organizationId", "assetTag");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_organizationId_serialNumber_key" ON "Asset"("organizationId", "serialNumber");

-- CreateIndex
CREATE INDEX "AssetSpecs_organizationId_idx" ON "AssetSpecs"("organizationId");

-- CreateIndex
CREATE INDEX "AssetAssignment_organizationId_assetId_returnedAt_idx" ON "AssetAssignment"("organizationId", "assetId", "returnedAt");

-- CreateIndex
CREATE INDEX "AssetAssignment_organizationId_employeeId_returnedAt_idx" ON "AssetAssignment"("organizationId", "employeeId", "returnedAt");

-- CreateIndex
CREATE INDEX "AssetStatusHistory_organizationId_assetId_changedAt_idx" ON "AssetStatusHistory"("organizationId", "assetId", "changedAt");

-- CreateIndex
CREATE INDEX "AssetMaintenance_organizationId_assetId_startedAt_idx" ON "AssetMaintenance"("organizationId", "assetId", "startedAt");

-- CreateIndex
CREATE INDEX "Warranty_organizationId_expiresAt_idx" ON "Warranty"("organizationId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssetPurchase_organizationId_assetId_purchaseItemId_key" ON "AssetPurchase"("organizationId", "assetId", "purchaseItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_organizationId_invoiceNumber_key" ON "Invoice"("organizationId", "invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkDevice_assetId_key" ON "NetworkDevice"("assetId");

-- CreateIndex
CREATE INDEX "NetworkDevice_organizationId_managementIp_idx" ON "NetworkDevice"("organizationId", "managementIp");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkDevice_organizationId_name_key" ON "NetworkDevice"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Firewall_organizationId_managementIp_idx" ON "Firewall"("organizationId", "managementIp");

-- CreateIndex
CREATE UNIQUE INDEX "Firewall_organizationId_name_key" ON "Firewall"("organizationId", "name");

-- CreateIndex
CREATE INDEX "FirewallUser_organizationId_employeeId_idx" ON "FirewallUser"("organizationId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "FirewallUser_organizationId_firewallId_username_key" ON "FirewallUser"("organizationId", "firewallId", "username");

-- CreateIndex
CREATE INDEX "VpnUser_organizationId_expiresAt_idx" ON "VpnUser"("organizationId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "VpnUser_organizationId_username_key" ON "VpnUser"("organizationId", "username");

-- CreateIndex
CREATE INDEX "MacBinding_organizationId_ipAddress_idx" ON "MacBinding"("organizationId", "ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "MacBinding_organizationId_macAddress_ipAddress_key" ON "MacBinding"("organizationId", "macAddress", "ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "FirewallGroup_organizationId_firewallId_name_key" ON "FirewallGroup"("organizationId", "firewallId", "name");

-- CreateIndex
CREATE INDEX "FirewallUserGroup_organizationId_idx" ON "FirewallUserGroup"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "BandwidthPolicy_organizationId_name_key" ON "BandwidthPolicy"("organizationId", "name");

-- CreateIndex
CREATE INDEX "FirewallUserPolicy_organizationId_idx" ON "FirewallUserPolicy"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Vlan_organizationId_vlanId_key" ON "Vlan"("organizationId", "vlanId");

-- CreateIndex
CREATE INDEX "IpAllocation_organizationId_status_idx" ON "IpAllocation"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "IpAllocation_organizationId_address_key" ON "IpAllocation"("organizationId", "address");

-- CreateIndex
CREATE INDEX "FirewallImportBatch_organizationId_importedAt_idx" ON "FirewallImportBatch"("organizationId", "importedAt");

-- CreateIndex
CREATE INDEX "Inventory_organizationId_categoryId_idx" ON "Inventory"("organizationId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_organizationId_sku_key" ON "Inventory"("organizationId", "sku");

-- CreateIndex
CREATE INDEX "StockTransaction_organizationId_inventoryId_createdAt_idx" ON "StockTransaction"("organizationId", "inventoryId", "createdAt");

-- CreateIndex
CREATE INDEX "PurchaseOrder_organizationId_purchaseDate_idx" ON "PurchaseOrder"("organizationId", "purchaseDate");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_organizationId_orderNumber_key" ON "PurchaseOrder"("organizationId", "orderNumber");

-- CreateIndex
CREATE INDEX "PurchaseItem_organizationId_purchaseOrderId_idx" ON "PurchaseItem"("organizationId", "purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "SoftwareProduct_organizationId_name_publisher_key" ON "SoftwareProduct"("organizationId", "name", "publisher");

-- CreateIndex
CREATE INDEX "SoftwareLicense_organizationId_expiresAt_idx" ON "SoftwareLicense"("organizationId", "expiresAt");

-- CreateIndex
CREATE INDEX "LicenseAssignment_organizationId_licenseId_returnedAt_idx" ON "LicenseAssignment"("organizationId", "licenseId", "returnedAt");

-- CreateIndex
CREATE INDEX "LicenseRenewal_organizationId_expiresAt_idx" ON "LicenseRenewal"("organizationId", "expiresAt");

-- CreateIndex
CREATE INDEX "ItExpense_organizationId_incurredAt_idx" ON "ItExpense"("organizationId", "incurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_organizationId_name_fiscalYear_key" ON "Budget"("organizationId", "name", "fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "AssetDepreciation_organizationId_assetId_calculatedAt_key" ON "AssetDepreciation"("organizationId", "assetId", "calculatedAt");

-- CreateIndex
CREATE INDEX "SupportTicket_organizationId_status_priority_idx" ON "SupportTicket"("organizationId", "status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_organizationId_ticketNumber_key" ON "SupportTicket"("organizationId", "ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SavedReport_organizationId_name_key" ON "SavedReport"("organizationId", "name");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_module_recordId_idx" ON "AuditLog"("organizationId", "module", "recordId");

-- CreateIndex
CREATE INDEX "Attachment_organizationId_assetId_idx" ON "Attachment"("organizationId", "assetId");

-- CreateIndex
CREATE INDEX "ImportJob_organizationId_createdAt_idx" ON "ImportJob"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "ImportError_importJobId_rowNumber_idx" ON "ImportError"("importJobId", "rowNumber");

-- CreateIndex
CREATE INDEX "Notification_organizationId_readAt_createdAt_idx" ON "Notification"("organizationId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_organizationId_eventKey_key" ON "Notification"("organizationId", "eventKey");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_organizationId_key_key" ON "SystemSetting"("organizationId", "key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetCategory" ADD CONSTRAINT "AssetCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssetCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetSpecs" ADD CONSTRAINT "AssetSpecs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetSpecs" ADD CONSTRAINT "AssetSpecs_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetStatusHistory" ADD CONSTRAINT "AssetStatusHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetStatusHistory" ADD CONSTRAINT "AssetStatusHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetStatusHistory" ADD CONSTRAINT "AssetStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warranty" ADD CONSTRAINT "Warranty_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warranty" ADD CONSTRAINT "Warranty_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warranty" ADD CONSTRAINT "Warranty_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetPurchase" ADD CONSTRAINT "AssetPurchase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetPurchase" ADD CONSTRAINT "AssetPurchase_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetPurchase" ADD CONSTRAINT "AssetPurchase_purchaseItemId_fkey" FOREIGN KEY ("purchaseItemId") REFERENCES "PurchaseItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkDevice" ADD CONSTRAINT "NetworkDevice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkDevice" ADD CONSTRAINT "NetworkDevice_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkDevice" ADD CONSTRAINT "NetworkDevice_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkDevice" ADD CONSTRAINT "NetworkDevice_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Firewall" ADD CONSTRAINT "Firewall_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Firewall" ADD CONSTRAINT "Firewall_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirewallUser" ADD CONSTRAINT "FirewallUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirewallUser" ADD CONSTRAINT "FirewallUser_firewallId_fkey" FOREIGN KEY ("firewallId") REFERENCES "Firewall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirewallUser" ADD CONSTRAINT "FirewallUser_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VpnUser" ADD CONSTRAINT "VpnUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VpnUser" ADD CONSTRAINT "VpnUser_firewallId_fkey" FOREIGN KEY ("firewallId") REFERENCES "Firewall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VpnUser" ADD CONSTRAINT "VpnUser_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MacBinding" ADD CONSTRAINT "MacBinding_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MacBinding" ADD CONSTRAINT "MacBinding_firewallId_fkey" FOREIGN KEY ("firewallId") REFERENCES "Firewall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MacBinding" ADD CONSTRAINT "MacBinding_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MacBinding" ADD CONSTRAINT "MacBinding_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirewallGroup" ADD CONSTRAINT "FirewallGroup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirewallGroup" ADD CONSTRAINT "FirewallGroup_firewallId_fkey" FOREIGN KEY ("firewallId") REFERENCES "Firewall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirewallUserGroup" ADD CONSTRAINT "FirewallUserGroup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirewallUserGroup" ADD CONSTRAINT "FirewallUserGroup_firewallUserId_fkey" FOREIGN KEY ("firewallUserId") REFERENCES "FirewallUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirewallUserGroup" ADD CONSTRAINT "FirewallUserGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "FirewallGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BandwidthPolicy" ADD CONSTRAINT "BandwidthPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirewallUserPolicy" ADD CONSTRAINT "FirewallUserPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirewallUserPolicy" ADD CONSTRAINT "FirewallUserPolicy_firewallUserId_fkey" FOREIGN KEY ("firewallUserId") REFERENCES "FirewallUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirewallUserPolicy" ADD CONSTRAINT "FirewallUserPolicy_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "BandwidthPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vlan" ADD CONSTRAINT "Vlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IpAllocation" ADD CONSTRAINT "IpAllocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IpAllocation" ADD CONSTRAINT "IpAllocation_firewallId_fkey" FOREIGN KEY ("firewallId") REFERENCES "Firewall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IpAllocation" ADD CONSTRAINT "IpAllocation_vlanId_fkey" FOREIGN KEY ("vlanId") REFERENCES "Vlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IpAllocation" ADD CONSTRAINT "IpAllocation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirewallImportBatch" ADD CONSTRAINT "FirewallImportBatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirewallImportBatch" ADD CONSTRAINT "FirewallImportBatch_firewallId_fkey" FOREIGN KEY ("firewallId") REFERENCES "Firewall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssetCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareProduct" ADD CONSTRAINT "SoftwareProduct_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareLicense" ADD CONSTRAINT "SoftwareLicense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareLicense" ADD CONSTRAINT "SoftwareLicense_softwareProductId_fkey" FOREIGN KEY ("softwareProductId") REFERENCES "SoftwareProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareLicense" ADD CONSTRAINT "SoftwareLicense_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseAssignment" ADD CONSTRAINT "LicenseAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseAssignment" ADD CONSTRAINT "LicenseAssignment_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "SoftwareLicense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseAssignment" ADD CONSTRAINT "LicenseAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseRenewal" ADD CONSTRAINT "LicenseRenewal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseRenewal" ADD CONSTRAINT "LicenseRenewal_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "SoftwareLicense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItExpense" ADD CONSTRAINT "ItExpense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItExpense" ADD CONSTRAINT "ItExpense_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDepreciation" ADD CONSTRAINT "AssetDepreciation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDepreciation" ADD CONSTRAINT "AssetDepreciation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedReport" ADD CONSTRAINT "SavedReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportError" ADD CONSTRAINT "ImportError_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportError" ADD CONSTRAINT "ImportError_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Tenant context comes from the authenticated Supabase user's server-managed profile.
CREATE OR REPLACE FUNCTION public.current_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT profile."organizationId"
  FROM public."User" AS profile
  WHERE profile."authUserId" = auth.uid()
    AND profile."isActive" = true
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.current_organization_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_organization_id() TO authenticated;

ALTER TABLE public."Organization" ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public."Organization" TO authenticated;
CREATE POLICY "tenant_access"
  ON public."Organization"
  FOR ALL
  TO authenticated
  USING ("id" = (SELECT public.current_organization_id()))
  WITH CHECK ("id" = (SELECT public.current_organization_id()));

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'User', 'Role', 'Permission', 'UserRole', 'RolePermission', 'Department',
    'Employee', 'Location', 'AssetCategory', 'Vendor', 'Asset', 'AssetSpecs',
    'AssetAssignment', 'AssetStatusHistory', 'AssetMaintenance', 'Warranty',
    'AssetPurchase', 'Invoice', 'NetworkDevice', 'Firewall', 'FirewallUser',
    'VpnUser', 'MacBinding', 'FirewallGroup', 'FirewallUserGroup',
    'BandwidthPolicy', 'FirewallUserPolicy', 'Vlan', 'IpAllocation',
    'FirewallImportBatch', 'Inventory', 'StockTransaction', 'PurchaseOrder',
    'PurchaseItem', 'SoftwareProduct', 'SoftwareLicense', 'LicenseAssignment',
    'LicenseRenewal', 'ItExpense', 'Budget', 'AssetDepreciation',
    'SupportTicket', 'SavedReport', 'AuditLog', 'Attachment', 'ImportJob',
    'ImportError', 'Notification', 'SystemSetting'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

    IF table_name = 'AuditLog' THEN
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated', table_name);
      EXECUTE format(
        'CREATE POLICY "tenant_read" ON public.%I FOR SELECT TO authenticated USING ("organizationId" = (SELECT public.current_organization_id()))',
        table_name
      );
    ELSE
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated', table_name);
      EXECUTE format(
        'CREATE POLICY "tenant_access" ON public.%I FOR ALL TO authenticated USING ("organizationId" = (SELECT public.current_organization_id())) WITH CHECK ("organizationId" = (SELECT public.current_organization_id()))',
        table_name
      );
    END IF;
  END LOOP;
END
$$;

ALTER TABLE "Asset"
  ADD CONSTRAINT "Asset_purchasePrice_nonnegative" CHECK ("purchasePrice" IS NULL OR "purchasePrice" >= 0);
ALTER TABLE "Inventory"
  ADD CONSTRAINT "Inventory_nonnegative_quantities" CHECK ("quantity" >= 0 AND "minimumQuantity" >= 0);
ALTER TABLE "StockTransaction"
  ADD CONSTRAINT "StockTransaction_positive_quantity" CHECK ("quantity" > 0);
ALTER TABLE "SoftwareLicense"
  ADD CONSTRAINT "SoftwareLicense_seat_counts_valid" CHECK (
    "totalSeats" >= 0 AND "availableSeats" >= 0 AND "availableSeats" <= "totalSeats"
  );
ALTER TABLE "PurchaseItem"
  ADD CONSTRAINT "PurchaseItem_amounts_valid" CHECK (
    "quantity" > 0 AND "unitPrice" >= 0 AND "taxAmount" >= 0
  );
ALTER TABLE "PurchaseOrder"
  ADD CONSTRAINT "PurchaseOrder_amounts_nonnegative" CHECK ("taxAmount" >= 0 AND "totalAmount" >= 0);
ALTER TABLE "BandwidthPolicy"
  ADD CONSTRAINT "BandwidthPolicy_speeds_nonnegative" CHECK (
    ("downloadMbps" IS NULL OR "downloadMbps" >= 0) AND
    ("uploadMbps" IS NULL OR "uploadMbps" >= 0)
  );
ALTER TABLE "ItExpense"
  ADD CONSTRAINT "ItExpense_amount_nonnegative" CHECK ("amount" >= 0);
ALTER TABLE "Budget"
  ADD CONSTRAINT "Budget_amount_nonnegative" CHECK ("amount" >= 0);
