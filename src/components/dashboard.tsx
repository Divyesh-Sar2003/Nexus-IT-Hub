import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  HardDrive,
  Laptop,
  Monitor,
  Network,
  Package,
  Shield,
  Users,
  Wrench,
} from "lucide-react";
import { EmptyDistributionChart, EmptyTrendChart } from "@/components/empty-chart";

const metrics = [
  { label: "Total assets", icon: HardDrive, tone: "blue", change: "Asset register" },
  { label: "Assigned devices", icon: Laptop, tone: "violet", change: "Employee allocation" },
  { label: "Available stock", icon: Package, tone: "mint", change: "Ready to assign" },
  { label: "Under maintenance", icon: Wrench, tone: "amber", change: "Open repairs" },
  { label: "Network devices", icon: Network, tone: "cyan", change: "Infrastructure" },
  { label: "Active firewall users", icon: Shield, tone: "rose", change: "Manual records" },
  { label: "Software licenses", icon: Monitor, tone: "indigo", change: "Seat utilization" },
  { label: "Monthly IT spend", icon: Banknote, tone: "slate", change: "Recorded expenses" },
];

export function Dashboard() {
  return (
    <div className="dashboard-page">
      <div className="page-heading dashboard-heading">
        <div>
          <div className="page-eyebrow"><span className="eyebrow-line" /> EXECUTIVE OVERVIEW</div>
          <h1>Good work starts with a clear view.</h1>
          <p>One place to understand your IT estate, people, and operations.</p>
        </div>
        <Link className="button button-secondary setup-button" href="/settings">
          <CircleHelp size={16} />
          Workspace setup
        </Link>
      </div>

      <section className="dashboard-summary" aria-label="Workspace data status">
        <div className="summary-icon"><Network size={20} /></div>
        <div className="summary-copy">
          <strong>Your workspace is ready for its first connection.</strong>
          <span>
            Connect an organization and its records to populate metrics, charts,
            and reports. Nothing here is sample data.
          </span>
        </div>
        <Link href="/settings" className="summary-link">
          Review setup <ArrowUpRight size={15} />
        </Link>
      </section>

      <div className="dashboard-controls">
        <div className="control-label">
          <span className="control-label-dot" />
          <span>DATA STATUS</span>
          <span className="control-divider" />
          <span className="control-disabled-note">Filters available after connection</span>
        </div>
        <div className="filter-controls" aria-label="Dashboard filters">
          <button className="filter-button" disabled type="button">
            <CalendarDays size={15} /> Date range <ChevronDown size={14} />
          </button>
          <button className="filter-button" disabled type="button">
            <Users size={15} /> Department <ChevronDown size={14} />
          </button>
          <button className="filter-button" disabled type="button">
            <Network size={15} /> Location <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <section className="metric-grid" aria-label="IT operations metrics">
        {metrics.map(({ label, icon: Icon, tone, change }) => (
          <article className="metric-card" key={label}>
            <div className="metric-card-top">
              <span className={`metric-icon metric-icon-${tone}`}><Icon size={17} strokeWidth={1.8} /></span>
              <span className="metric-unavailable">NO DATA</span>
            </div>
            <p className="metric-label">{label}</p>
            <div className="metric-value-row">
              <strong className="metric-value">—</strong>
              <span className="metric-period">Not connected</span>
            </div>
            <div className="metric-card-bottom">
              <span className="metric-hint">{change}</span>
              <span className="metric-trend-placeholder" aria-hidden="true">—</span>
            </div>
          </article>
        ))}
      </section>

      <section className="chart-grid" aria-label="Analytics overview">
        <article className="panel chart-panel spend-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-eyebrow">COST OVERVIEW</span>
              <h2>IT expenditure</h2>
            </div>
            <button className="panel-menu-button" type="button" disabled aria-label="Chart options unavailable">
              <span>Monthly</span><ChevronDown size={14} />
            </button>
          </div>
          <div className="chart-summary">
            <div><span className="chart-summary-value">—</span><span className="chart-summary-period">No financial records</span></div>
            <span className="chart-summary-unavailable">No records</span>
          </div>
          <EmptyTrendChart label="IT expenditure" />
          <div className="chart-x-labels" aria-hidden="true">
            <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
          </div>
        </article>

        <article className="panel distribution-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-eyebrow">HARDWARE MIX</span>
              <h2>Asset distribution</h2>
            </div>
            <button className="panel-menu-button" type="button" disabled aria-label="Asset filters unavailable">
              <span>All assets</span><ChevronDown size={14} />
            </button>
          </div>
          <div className="distribution-content">
            <EmptyDistributionChart />
            <div className="distribution-legend">
              {[
                ["Desktops", "legend-blue"],
                ["Laptops", "legend-violet"],
                ["Servers", "legend-mint"],
                ["Network", "legend-amber"],
              ].map(([label, color]) => (
                <div className="legend-row" key={label}>
                  <span className={`legend-dot ${color}`} />
                  <span>{label}</span>
                  <span className="legend-value">—</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="lower-grid">
        <article className="panel attention-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-eyebrow">NEEDS ATTENTION</span>
              <h2>Upcoming renewals</h2>
            </div>
            <Link href="/software" className="panel-link">View licenses <ChevronRight size={14} /></Link>
          </div>
          <div className="empty-table-state">
            <span className="empty-state-icon"><CalendarDays size={18} /></span>
            <strong>No renewal dates to show</strong>
            <span>License and warranty dates will appear here once records are connected.</span>
          </div>
        </article>

        <article className="panel allocation-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-eyebrow">PEOPLE & DEVICES</span>
              <h2>Asset allocation</h2>
            </div>
            <Link href="/employees" className="panel-link">People <ChevronRight size={14} /></Link>
          </div>
          <div className="allocation-empty">
            <span className="allocation-illustration"><Users size={20} /></span>
            <div>
              <strong>Allocation insights are waiting</strong>
              <span>Department and employee breakdowns use your actual asset assignments.</span>
            </div>
          </div>
          <div className="allocation-progress">
            <span>Assigned</span><span className="allocation-track" /><span>—</span>
          </div>
          <div className="allocation-progress">
            <span>Available</span><span className="allocation-track" /><span>—</span>
          </div>
        </article>
      </section>

      <section className="setup-callout">
        <div className="setup-callout-mark"><Network size={18} /></div>
        <div>
          <strong>Start with your organization</strong>
          <span>Configure your workspace before importing or creating company records.</span>
        </div>
        <Link href="/settings" className="button button-primary">Go to setup <ChevronRight size={15} /></Link>
      </section>
    </div>
  );
}
