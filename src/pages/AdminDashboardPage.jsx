import { useEffect, useState } from "react";
import { AdminUploadPanel } from "../components/pam/AdminUploadPanel";
import { CreateProjectModal } from "../components/pam/CreateProjectModal";
import { ProjectUploader } from "../components/pam/ProjectUploader";
import { StatusBadge } from "../components/pam/StatusBadge";
import { ProofManagerPage } from "./ProofManagerPage";
import { deleteProject, listProjects, togglePaid, updateProjectStatus } from "../services/pamService";
import { AdminLeadsPanel } from "../components/pam/AdminLeadsPanel";

const STATUS_OPTIONS = [
  "draft",
  "published",
  "selection_completed",
  "retouching",
  "pending_payment",
  "delivered",
];

const TABS = [
  { key: "projects",   label: "Projects" },
  { key: "uploader",   label: "Uploader" },
  { key: "deliver",    label: "Deliver" },
  { key: "inquiries",  label: "Inquiries" },
  { key: "settings",   label: "Settings" },
];

export function AdminDashboardPage({ isAdmin, onGoHome }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [managingProject, setManagingProject] = useState(null);

  async function refreshProjects() {
    setLoading(true);

    try {
      const data = await listProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshProjects();
  }, []);

  if (managingProject) {
    return (
      <ProofManagerPage
        project={managingProject}
        onBack={() => {
          setManagingProject(null);
          refreshProjects();
        }}
      />
    );
  }

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-[200] flex min-h-screen flex-col items-center justify-center gap-4 bg-[#131313] px-6 text-center">
        <p className="text-white/30">Access restricted.</p>
        <button
          type="button"
          onClick={onGoHome}
          className="text-sm text-white/50 transition hover:text-white"
        >
          ← Back to Site
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] min-h-screen overflow-y-auto bg-[#131313] font-body text-white">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#131313]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 md:px-12">
          <div className="text-sm tracking-widest text-white/40 font-serif">ELDON / PAM</div>

          <div className="flex items-center gap-6 text-sm">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                disabled={tab.disabled}
                onClick={() => {
                  if (!tab.disabled) {
                    setActiveTab(tab.key);
                  }
                }}
                className={[
                  "border-b pb-1 transition",
                  activeTab === tab.key
                    ? "border-white text-white"
                    : "border-transparent text-white/40 hover:text-white/70",
                  tab.disabled ? "cursor-default hover:text-white/40" : "",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onGoHome}
            className="text-sm text-white/50 transition hover:text-white"
          >
            ← Back to Site
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 pt-16 md:px-12">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-serif text-3xl">Projects</h1>
          {activeTab === "projects" ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="border border-white/30 px-4 py-2 text-sm text-white transition hover:bg-white hover:text-black"
            >
              ＋ New Project
            </button>
          ) : null}
        </div>

        {activeTab === "uploader" ? (
          <div className="mt-8">
            <ProjectUploader projects={projects} />
          </div>
        ) : activeTab === "deliver" ? (
          <AdminUploadPanel projects={projects} />
        ) : activeTab === "inquiries" ? (
          <AdminLeadsPanel />
        ) : activeTab === "settings" ? (
          <div className="py-24 text-center text-white/30">Settings coming soon.</div>
        ) : loading ? (
          <div className="py-24 text-center text-white/30">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="mt-8 py-16 text-center text-white/30">No projects yet.</div>
        ) : (
          <div className="mt-8">
            {projects.map((row) => (
              <div key={row.id} className="flex items-center gap-4 border-b border-white/10 py-4">
                <div className="flex-1">
                  <p className="font-body text-white">{row.name}</p>
                </div>
                <span className="text-sm font-mono text-white/40">{row.slug}</span>
                <StatusBadge status={row.status} />
                <select
                  value={row.status || "draft"}
                  onChange={async (event) => {
                    await updateProjectStatus(row.id, event.target.value);
                    await refreshProjects();
                  }}
                  className="rounded border border-white/20 bg-transparent px-2 py-1 text-sm text-white/70"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status} className="bg-[#131313] text-white">
                      {status}
                    </option>
                  ))}
                </select>
                {row.paid ? (
                  <span className="cursor-default text-xs text-green-400">Paid ✓</span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      await togglePaid(row.id, !row.paid);
                      await refreshProjects();
                    }}
                    className="border border-white/20 px-2 py-1 text-xs text-white/50 transition hover:text-white"
                  >
                    Mark Paid
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setManagingProject(row)}
                  className="text-xs text-white/40 transition hover:text-white"
                >
                  Manage →
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm(`Delete "${row.slug}"? This cannot be undone.`)) return;
                    await deleteProject(row.id);
                    await refreshProjects();
                  }}
                  className="text-xs text-red-400/50 transition hover:text-red-400"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refreshProjects}
      />
    </div>
  );
}
