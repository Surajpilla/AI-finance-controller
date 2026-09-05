"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Bot,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Cloud,
  FileCheck2,
  Filter,
  LayoutDashboard,
  ListChecks,
  Menu,
  MoreHorizontal,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";
import {
  createSyntheticBatch,
  getBatchMetrics,
  type MatchType,
  type ReconciliationRecord,
} from "@/lib/reconciliation";

type QueueTab = "exceptions" | "all" | "matched";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const exactCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function formatCurrency(value: number, exact = false) {
  return (exact ? exactCurrency : currency).format(value).replace("₹", "₹");
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="confidence-wrap" aria-label={`${Math.round(value * 100)} percent confidence`}>
      <div className="confidence-track">
        <div className="confidence-fill" style={{ width: `${value * 100}%` }} />
      </div>
      <span>{Math.round(value * 100)}%</span>
    </div>
  );
}



function StatusPill({ record }: { record: ReconciliationRecord }) {
  const matched = record.status === "matched";
  return (
    <span className={`status-pill ${matched ? "status-matched" : "status-exception"}`}>
      {matched ? <Check size={12} /> : <TriangleAlert size={12} />}
      {matched ? record.matchType : record.exceptionType}
    </span>
  );
}

function normalizeApiRecord(record: {
  id: string;
  date: string;
  channel: string;
  expected: number;
  bank_reference: string;
  status: string;
  match_type: string;
  confidence: number;
  note: string;
  exception_type?: string | null;
  bank_lines: ReconciliationRecord["bankLines"];
}): ReconciliationRecord {
  const validMatchTypes: MatchType[] = ["Exact", "Rule match", "Split match", "Controller action", "Unresolved"];
  return {
    id: record.id,
    date: record.date,
    channel: record.channel,
    expected: record.expected,
    bankReference: record.bank_reference,
    status: record.status === "matched" ? "matched" : "exception",
    matchType: validMatchTypes.includes(record.match_type as MatchType) ? record.match_type as MatchType : "Unresolved",
    confidence: record.confidence,
    note: record.note,
    exceptionType: record.exception_type as ReconciliationRecord["exceptionType"],
    bankLines: record.bank_lines,
  };
}

export default function Home() {
  const [records, setRecords] = useState<ReconciliationRecord[]>(() => createSyntheticBatch());
  const [queueTab, setQueueTab] = useState<QueueTab>("exceptions");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeNav, setActiveNav] = useState("Reconciliation");
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState("Last run completed 2 min ago");
  const [sourceMode, setSourceMode] = useState<"demo" | "api">("demo");

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;
    const controller = new AbortController();
    fetch(`${apiUrl}/reconciliation/demo`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Controller API unavailable");
        return response.json();
      })
      .then((payload: { records?: Parameters<typeof normalizeApiRecord>[0][] }) => {
        if (payload.records?.length !== 64) return;
        setRecords(payload.records.map(normalizeApiRecord));
        setSourceMode("api");
        setNotice("Connected to controller API · synthetic batch loaded");
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const metrics = useMemo(() => getBatchMetrics(records), [records]);
  const selected = records.find((record) => record.id === selectedId) ?? null;

  const visibleRecords = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return records
      .filter((record) => {
        if (queueTab === "exceptions" && record.status !== "exception") return false;
        if (queueTab === "matched" && record.status !== "matched") return false;
        if (!normalizedQuery) return true;
        return [record.id, record.channel, record.bankReference, record.exceptionType]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [records, queueTab, query]);

  function runReconciliation() {
    if (running) return;
    setRunning(true);
    setSelectedId(null);
    setNotice("Controller is normalizing sources and testing match rules…");
    window.setTimeout(() => {
      setRecords(createSyntheticBatch());
      setRunning(false);
      setNotice("Run complete just now · 59 records auto-cleared");
    }, 1050);
  }

  function resolveException(action: string) {
    if (!selected) return;
    const selectedRecordId = selected.id;
    setRecords((current) =>
      current.map((record) =>
        record.id === selectedRecordId
          ? {
              ...record,
              status: "matched",
              matchType: "Controller action",
              confidence: 1,
              exceptionType: undefined,
              note: `${action}. Closed by controller review and added to the audit trail.`,
            }
          : record,
      ),
    );
    setSelectedId(null);
    setNotice(`${selectedRecordId} closed · action recorded in audit log`);
  }

  function handleNav(label: string) {
    setActiveNav(label);
    if (label !== "Reconciliation") setNotice(`${label} is available from the same control tower`);
  }

  return (
    <main className="controller-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><Sparkles size={17} /></div>
          <div>
            <p className="brand-name">reconcore</p>
            <p className="brand-subtitle">finance controller</p>
          </div>
        </div>

        <nav className="top-nav" aria-label="Primary navigation">
          {[
            { label: "Overview", icon: LayoutDashboard },
            { label: "Reconciliation", icon: ListChecks },
            { label: "Audit log", icon: FileCheck2 },
          ].map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activeNav === label ? "nav-active" : ""}`}
              onClick={() => handleNav(label)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        <div className="topbar-actions">
          <span className="sync-status"><span className="sync-dot" /> {sourceMode === "api" ? "API synced" : "Demo synced"}</span>
          <button className="icon-button" aria-label="Help"><CircleHelp size={17} /></button>
          <button className="avatar" aria-label="Account menu">MB</button>
        </div>
      </header>

      <div className="workspace-layout">
        <aside className="sidebar">
          <div className="workspace-switcher">
            <div className="workspace-icon">N</div>
            <div className="workspace-copy">
              <span className="eyebrow">Workspace</span>
              <strong>Northstar Marketplace</strong>
            </div>
            <ChevronRight size={15} className="muted-icon" />
          </div>

          <div className="sidebar-section">
            <span className="eyebrow">Control tower</span>
            <button className={`sidebar-link ${activeNav === "Overview" ? "sidebar-link-active" : ""}`} onClick={() => handleNav("Overview")}>
              <LayoutDashboard size={16} />
              Overview
            </button>
            <button className={`sidebar-link ${activeNav === "Reconciliation" ? "sidebar-link-active" : ""}`} onClick={() => handleNav("Reconciliation")}>
              <ListChecks size={16} />
              Reconciliation
              <span className="sidebar-count">5</span>
            </button>
            <button className={`sidebar-link ${activeNav === "Audit log" ? "sidebar-link-active" : ""}`} onClick={() => handleNav("Audit log")}>
              <FileCheck2 size={16} />
              Audit log
            </button>
          </div>

          <div className="sidebar-section sidebar-lower">
            <span className="eyebrow">Connections</span>
            <div className="connection-row"><span className="connection-logo razorpay">R</span><span>Razorpay</span><Check size={14} /></div>
            <div className="connection-row"><span className="connection-logo bank">H</span><span>HDFC Bank</span><Check size={14} /></div>
            <div className="connection-row"><span className="connection-logo ledger">L</span><span>Ledger export</span><Check size={14} /></div>
          </div>

          <div className="sidebar-footer">
            <div className="agent-mini"><span className="agent-pulse"><Bot size={15} /></span><div><strong>Controller online</strong><span>Rule set v2.4</span></div></div>
            <button className="sidebar-link muted-link"><SlidersHorizontal size={16} /> Settings</button>
          </div>
        </aside>

        <section className="main-content">
          <div className="page-heading">
            <div>
              <div className="heading-kicker"><span className="track-tag">TRACK 04</span><span>AI Finance Controller</span></div>
              <h1>Run the books <em>and</em> the cash position.</h1>
              <p className="heading-copy">Close one finance-ops loop with evidence attached to every match — and a clear owner for every exception.</p>
            </div>
            <div className="heading-actions">
              <button className="secondary-button" onClick={() => setNotice("Report prepared · 64 rows and 5 exceptions") }><ArrowDownToLine size={16} /> Export report</button>
              <button className="primary-button" onClick={runReconciliation} disabled={running}>
                {running ? <RefreshCw size={16} className="spin" /> : <Play size={16} fill="currentColor" />}
                {running ? "Running controller…" : "Run reconciliation"}
              </button>
            </div>
          </div>

          <div className="notice-bar">
            <div className="notice-main"><span className="notice-icon"><Bot size={15} /></span><span>{notice}</span></div>
            <span className="notice-time"><Clock3 size={14} /> 00:01:48 run time</span>
          </div>

          <div className="source-strip">
            <div className="source-label"><Cloud size={15} /> Source set</div>
            <div className="source-item"><span className="source-bullet razorpay" /> Razorpay Settlements <span className="source-count">64</span></div>
            <div className="source-divider" />
            <div className="source-item"><span className="source-bullet bank" /> HDFC Bank Statement <span className="source-count">74</span></div>
            <div className="source-divider" />
            <div className="source-item"><span className="source-bullet ledger" /> Ledger export <span className="source-count">64</span></div>
            <span className="source-date">Sep 01 — Sep 04, 2026</span>
          </div>

          <section className="metric-grid" aria-label="Batch metrics">
            <div className="metric-card metric-accent">
              <div className="metric-top"><span>Records reviewed</span><span className="metric-icon"><ListChecks size={16} /></span></div>
              <strong>{metrics.total}</strong>
              <div className="metric-foot"><span className="positive"><ArrowUpRight size={13} /> 12%</span> vs last run</div>
            </div>
            <div className="metric-card">
              <div className="metric-top"><span>Match rate</span><span className="metric-icon success"><ShieldCheck size={16} /></span></div>
              <strong>{metrics.matchRate}%</strong>
              <div className="metric-foot"><span className="positive">{metrics.matched} auto-cleared</span> · target 90%</div>
            </div>
            <div className="metric-card">
              <div className="metric-top"><span>Throughput</span><span className="metric-icon"><Zap size={16} /></span></div>
              <strong>{metrics.throughput}</strong>
              <div className="metric-foot"><span className="positive">17× faster</span> than manual review</div>
            </div>
            <div className="metric-card metric-warning">
              <div className="metric-top"><span>Unresolved</span><span className="metric-icon warning"><TriangleAlert size={16} /></span></div>
              <strong>{metrics.exceptions}</strong>
              <div className="metric-foot"><span className="warning-text">Needs an owner</span> before close</div>
            </div>
          </section>

          <div className="content-grid">
            <div className="queue-column">
              <section className="loop-card">
                <div className="loop-copy">
                  <span className="eyebrow">Why this run matters</span>
                  <h2>Close the loop, not the tab.</h2>
                  <p>Processor exports, bank lines and the ledger speak different dialects. The controller normalizes them, tests three match tiers, and only asks for help when cash is genuinely ambiguous.</p>
                </div>
                <div className="rule-stack" aria-label="Matching rules">
                  <div className="rule-row"><span className="rule-number">01</span><span>Exact amount + UTR</span><span className="rule-result">35</span></div>
                  <div className="rule-row"><span className="rule-number">02</span><span>Partial reference + date</span><span className="rule-result">14</span></div>
                  <div className="rule-row"><span className="rule-number">03</span><span>Constrained split sum</span><span className="rule-result">10</span></div>
                </div>
              </section>

              <section className="queue-card">
                <div className="queue-header">
                  <div>
                    <div className="eyebrow">Batch review</div>
                    <h2>Reconciliation queue</h2>
                  </div>
                  <button className="icon-button subtle" aria-label="More queue options"><MoreHorizontal size={18} /></button>
                </div>
                <div className="queue-toolbar">
                  <div className="tabs" role="tablist" aria-label="Queue filters">
                    {([
                      ["exceptions", `Exceptions ${metrics.exceptions}`],
                      ["all", `All ${metrics.total}`],
                      ["matched", `Matched ${metrics.matched}`],
                    ] as [QueueTab, string][]).map(([tab, label]) => (
                      <button key={tab} className={`tab ${queueTab === tab ? "tab-active" : ""}`} onClick={() => setQueueTab(tab)} role="tab" aria-selected={queueTab === tab}>{label}</button>
                    ))}
                  </div>
                  <div className="queue-actions">
                    <label className="search-field"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search batch" aria-label="Search batch" /></label>
                    <button className="filter-button" onClick={() => setNotice("Showing high-signal exceptions first")}><Filter size={15} /> Filter</button>
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="recon-table">
                    <thead><tr><th>Settlement</th><th>Channel</th><th>Expected</th><th>Match signal</th><th>Confidence</th><th aria-label="Open record" /></tr></thead>
                    <tbody>
                      {visibleRecords.map((record) => (
                        <tr key={record.id} className={selectedId === record.id ? "row-selected" : ""} onClick={() => setSelectedId(record.id)}>
                          <td><div className="settlement-cell"><span className={`row-status ${record.status}`} /> <div><strong>{record.id}</strong><span>{record.date}</span></div></div></td>
                          <td><span className="channel-name">{record.channel}</span></td>
                          <td><strong className="amount-cell">{formatCurrency(record.expected, true)}</strong></td>
                          <td><StatusPill record={record} /></td>
                          <td><ConfidenceBar value={record.confidence} /></td>
                          <td><ChevronRight size={16} className="row-chevron" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {visibleRecords.length === 0 && <div className="empty-state">No records match this view.</div>}
                </div>
                <div className="table-footer"><span>Showing {visibleRecords.length} of {queueTab === "exceptions" ? metrics.exceptions : queueTab === "matched" ? metrics.matched : metrics.total} records</span><button onClick={() => setQueueTab("all")}>View full batch <ArrowUpRight size={14} /></button></div>
              </section>
            </div>

            <aside className="right-column">
              {selected ? (
                <section className="inspector-card">
                  <div className="inspector-head"><div><span className="eyebrow">Exception inspector</span><h2>{selected.id}</h2></div><button className="icon-button subtle" onClick={() => setSelectedId(null)} aria-label="Close inspector"><X size={17} /></button></div>
                  <div className="inspector-alert"><TriangleAlert size={16} /><div><strong>{selected.exceptionType}</strong><span>Auto-close blocked at 48% confidence</span></div></div>
                  <div className="detail-grid"><div><span>Expected net</span><strong>{formatCurrency(selected.expected, true)}</strong></div><div><span>Processor</span><strong>{selected.channel}</strong></div><div><span>Settlement date</span><strong>{selected.date}</strong></div><div><span>Bank lines</span><strong>{selected.bankLines.length || "None"}</strong></div></div>
                  <div className="inspector-section"><span className="eyebrow">Controller note</span><p>{selected.note}</p></div>
                  <div className="inspector-section"><div className="section-line"><span className="eyebrow">Candidate bank lines</span><span className="candidate-count">{selected.bankLines.length}</span></div>
                    {selected.bankLines.length > 0 ? selected.bankLines.map((line) => <div className="bank-line" key={line.id}><div><strong>{line.id}</strong><span>{line.description}</span></div><strong>{formatCurrency(line.amount, true)}</strong></div>) : <div className="missing-line"><Cloud size={16} /><span>No credit found in the connected bank feed.</span></div>}
                  </div>
                  <div className="inspector-actions"><button className="primary-button full" onClick={() => resolveException("Manually approved after evidence review")}>Approve match <Check size={15} /></button><div className="action-row"><button className="secondary-button full" onClick={() => resolveException("Marked as missing and routed to treasury")}>Mark missing</button><button className="secondary-button icon-only" aria-label="More exception actions"><MoreHorizontal size={17} /></button></div></div>
                </section>
              ) : (
                <>
                  <section className="cash-card">
                    <div className="cash-head"><div><span className="eyebrow">Cash position</span><h2>Available cash</h2></div><span className="cash-live"><span /> live</span></div>
                    <strong className="cash-amount">{formatCurrency(1284620)}</strong>
                    <div className="cash-change"><span className="positive"><ArrowUpRight size={13} /> 8.4%</span> since last close</div>
                    <div className="cash-chart" aria-label="Seven day cash movement">
                      {[42, 57, 49, 68, 64, 82, 91].map((height, index) => <div className="chart-column" key={index}><div className={`chart-bar ${index === 6 ? "chart-bar-current" : ""}`} style={{ height: `${height}%` }} /><span>{["29", "30", "01", "02", "03", "04", "05"][index]}</span></div>)}
                    </div>
                    <div className="cash-summary"><span><i className="legend-dot inflow" /> Inflows <strong>{formatCurrency(metrics.cashCleared)}</strong></span><span><i className="legend-dot outflow" /> 7d outflow <strong>{formatCurrency(484300)}</strong></span></div>
                  </section>
                  <section className="agent-card"><div className="agent-card-head"><div className="agent-badge"><Bot size={16} /></div><div><span className="eyebrow">Controller reasoning</span><h2>What changed this run</h2></div></div><p>59 records are safe to post. The 5 exceptions stay open because each needs a human decision or another source of evidence.</p><div className="agent-breakdown"><div><strong>{metrics.byType.Exact}</strong><span>Exact</span></div><div><strong>{metrics.byType["Rule match"]}</strong><span>Rule match</span></div><div><strong>{metrics.byType["Split match"]}</strong><span>Split sum</span></div><div><strong>{metrics.exceptions}</strong><span>Open</span></div></div><button className="text-button" onClick={() => setQueueTab("exceptions")}>Review open exceptions <ArrowUpRight size={14} /></button></section>
                  <section className="audit-teaser"><div><FileCheck2 size={16} /><span>Audit trail is append-only</span></div><span>64 decisions logged</span></section>
                </>
              )}
            </aside>
          </div>

          <footer className="page-footer"><span><ShieldCheck size={14} /> All amounts are synthetic for Track 04</span><span>Last data refresh: Sep 04, 2026 · 09:42 IST</span></footer>
        </section>
      </div>

      <button className="mobile-menu" aria-label="Open menu"><Menu size={18} /></button>
    </main>
  );
}
