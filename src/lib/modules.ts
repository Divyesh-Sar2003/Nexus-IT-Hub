export const moduleDetails = {
  assets: {
    title: "Hardware assets",
    eyebrow: "ASSET MANAGEMENT",
    description:
      "Register, assign, and track company equipment throughout its lifecycle.",
    features: [
      "Asset registry and specifications",
      "Assignments, returns, and transfer history",
      "Warranty tracking and maintenance",
      "Asset tags, serials, and network details",
    ],
  },
  employees: {
    title: "People & assignments",
    eyebrow: "EMPLOYEE LIFECYCLE",
    description:
      "Keep employee records connected to the equipment and access they use.",
    features: [
      "Employee directory and departments",
      "Current and historical asset assignments",
      "Joiner, mover, and leaver workflows",
      "Return reminders and accountability",
    ],
  },
  network: {
    title: "Network & firewall",
    eyebrow: "NETWORK MANAGEMENT",
    description:
      "Maintain a clear inventory of firewalls, network access, and IP allocations.",
    features: [
      "Firewall users, groups, and bandwidth policies",
      "VPN accounts and expiry dates",
      "MAC bindings, IP addresses, and VLANs",
      "Manual records and spreadsheet imports",
    ],
  },
  inventory: {
    title: "Inventory",
    eyebrow: "STOCK MANAGEMENT",
    description:
      "Track IT stock from receiving through reservation, assignment, and return.",
    features: [
      "Available, reserved, assigned, and repair stock",
      "Inward, outward, return, and adjustment transactions",
      "Minimum quantity alerts",
      "A complete stock movement history",
    ],
  },
  purchases: {
    title: "Purchases",
    eyebrow: "PURCHASE MANAGEMENT",
    description:
      "Organize purchase orders, vendors, invoices, and purchased equipment.",
    features: [
      "Purchase orders with multiple line items",
      "Vendor and invoice records",
      "Payment and delivery tracking",
      "Links between purchases and individual assets",
    ],
  },
  software: {
    title: "Software & licenses",
    eyebrow: "LICENSE MANAGEMENT",
    description:
      "Track software entitlements, assigned seats, and renewal dates.",
    features: [
      "Products, publishers, and license types",
      "Seat assignment and returns",
      "Renewal costs and expiry tracking",
      "Restricted access to sensitive license details",
    ],
  },
  finance: {
    title: "IT finance",
    eyebrow: "COST & INVESTMENT",
    description:
      "Understand IT spending using recorded purchases, subscriptions, and repairs.",
    features: [
      "IT expenses and annual budgets",
      "Hardware, software, and maintenance costs",
      "Department and vendor spending",
      "Replacement and renewal planning",
    ],
  },
  maintenance: {
    title: "Support & maintenance",
    eyebrow: "SERVICE OPERATIONS",
    description:
      "Record repair requests and follow each asset through resolution.",
    features: [
      "Repair tickets and issue history",
      "Technician assignment and priority",
      "Repair status, cost, and resolution",
      "Links to asset maintenance history",
    ],
  },
  reports: {
    title: "Reports & analytics",
    eyebrow: "INSIGHTS",
    description:
      "Create operational reports from authorized organization records.",
    features: [
      "Asset, lifecycle, warranty, and purchase reports",
      "Firewall, VPN, and MAC binding summaries",
      "License, expense, and maintenance reporting",
      "CSV, Excel, and PDF exports",
    ],
  },
  audit: {
    title: "Audit log",
    eyebrow: "ACCOUNTABILITY",
    description:
      "Review a traceable history of important changes across the workspace.",
    features: [
      "Record changes and lifecycle events",
      "User, time, and module context",
      "Import and export activity",
      "Read-only access for ordinary users",
    ],
  },
  settings: {
    title: "Workspace settings",
    eyebrow: "ADMINISTRATION",
    description:
      "Connect your organization and configure access for the Nexus workspace.",
    features: [
      "Organization and location setup",
      "Supabase connection and authentication",
      "Roles, permissions, and user invitations",
      "Notifications and security preferences",
    ],
  },
} as const;

export type ModuleSlug = keyof typeof moduleDetails;
