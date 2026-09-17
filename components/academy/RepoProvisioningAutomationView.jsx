'use client';

import React, { useState } from 'react';
import {
  provisionRepository,
  PERMISSIONS_MATRIX,
  DEFAULT_BRANCH_PROTECTION_RULESET,
  getStandardBaselineFiles
} from '../../lib/academy/governance/repo_provisioning';

export default function RepoProvisioningAutomationView() {
  const [activeTab, setActiveTab] = useState('permissions'); // 'permissions' | 'rules' | 'files' | 'audit'
  const [repoName, setRepoName] = useState('duck-verse-student-workspace');
  const [learnerName, setLearnerName] = useState('Yarik0505');
  const [isDryRun, setIsDryRun] = useState(true);
  const [copiedRollback, setCopiedRollback] = useState(false);

  // Current simulation state
  const [simulatedRepoState, setSimulatedRepoState] = useState({
    existingFiles: {},
    branchRules: {},
    permissions: {}
  });

  const [provisionResult, setProvisionResult] = useState(() =>
    provisionRepository({}, { repoName, learnerName, isDryRun: true })
  );

  const baselineFiles = getStandardBaselineFiles(repoName, learnerName);

  const handleRunProvisioning = () => {
    const result = provisionRepository(simulatedRepoState, {
      repoName,
      learnerName,
      isDryRun
    });
    setProvisionResult(result);

    // If not dry run, update simulated repo state with provisioned files
    if (!isDryRun) {
      const updatedFiles = { ...simulatedRepoState.existingFiles };
      for (const file of baselineFiles) {
        updatedFiles[file.path] = file.content;
      }
      setSimulatedRepoState({
        existingFiles: updatedFiles,
        branchRules: { ...DEFAULT_BRANCH_PROTECTION_RULESET },
        permissions: {
          LEARNER: PERMISSIONS_MATRIX.LEARNER.permission,
          MENTOR: PERMISSIONS_MATRIX.MENTOR.permission,
          ADMIN: PERMISSIONS_MATRIX.ADMIN.permission,
          CI_BOT: PERMISSIONS_MATRIX.CI_BOT.permission
        }
      });
    }
  };

  const handleTestIdempotency = () => {
    // Run provisioning against fully up-to-date simulated state
    const upToDateFiles = {};
    for (const file of baselineFiles) {
      upToDateFiles[file.path] = file.content;
    }
    const upToDateState = {
      existingFiles: upToDateFiles,
      branchRules: { ...DEFAULT_BRANCH_PROTECTION_RULESET },
      permissions: {
        LEARNER: PERMISSIONS_MATRIX.LEARNER.permission,
        MENTOR: PERMISSIONS_MATRIX.MENTOR.permission,
        ADMIN: PERMISSIONS_MATRIX.ADMIN.permission,
        CI_BOT: PERMISSIONS_MATRIX.CI_BOT.permission
      }
    };
    const result = provisionRepository(upToDateState, {
      repoName,
      learnerName,
      isDryRun: false
    });
    setProvisionResult(result);
  };

  const handleCopyRollback = () => {
    if (provisionResult?.auditRecord?.rollbackScript) {
      navigator.clipboard?.writeText(provisionResult.auditRecord.rollbackScript);
      setCopiedRollback(true);
      setTimeout(() => setCopiedRollback(false), 3000);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-6 shadow-2xl backdrop-blur-md text-white my-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-indigo-500/20 pb-4 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <h2 className="text-xl font-black tracking-wider uppercase bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              GitHub Repository Provisioning & Permissions Automation
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated learner repo scaffolding, least-privilege RBAC, branch protection rulesets & idempotency (SCRUM-142)
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'permissions', label: '🛡️ Least Privilege RBAC' },
            { id: 'rules', label: '🌿 Branch Rules (main)' },
            { id: 'files', label: '📄 Baseline Scaffolding' },
            { id: 'audit', label: '📋 Audit & Rollback' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Provisioning Bar */}
      <div className="bg-slate-800/80 border border-indigo-500/40 rounded-xl p-4 mb-6 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Target Repository</label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-cyan-300 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Learner Name</label>
            <input
              type="text"
              value={learnerName}
              onChange={(e) => setLearnerName(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-purple-300 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="dryRunCheck"
              checked={isDryRun}
              onChange={(e) => setIsDryRun(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-0"
            />
            <label htmlFor="dryRunCheck" className="text-xs text-slate-300 select-none cursor-pointer">
              Dry-Run Mode (Simulation)
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <button
            onClick={handleRunProvisioning}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <span>🚀 Run Provisioning</span>
          </button>
          <button
            onClick={handleTestIdempotency}
            className="px-4 py-2 rounded-lg bg-teal-600/90 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/30 transition-all flex items-center gap-1.5"
            title="Demonstrate zero-drift repeat run"
          >
            <span>🔄 Test Idempotency</span>
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {provisionResult && (
        <div
          className={`mb-6 rounded-xl p-3.5 border flex items-center justify-between gap-4 ${
            provisionResult.isUpToDate
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{provisionResult.isUpToDate ? '✅' : '⚙️'}</span>
            <div>
              <div className="text-xs font-black uppercase">
                {provisionResult.isUpToDate
                  ? 'IDEMPOTENCY CONFIRMED: Repository is fully up-to-date (0 changes applied, zero drift)'
                  : `Provisioning Plan: ${provisionResult.filesToCreate.length} to create, ${provisionResult.filesDrifted.length} drifted, ${provisionResult.filesUnchanged.length} unchanged`}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                Action ID: <span className="font-mono text-cyan-300">{provisionResult.actionId}</span> • Repo: <span className="font-mono text-purple-300">{provisionResult.repoName}</span>
              </div>
            </div>
          </div>
          <span className="text-xs font-bold font-mono px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700">
            {provisionResult.auditRecord?.status}
          </span>
        </div>
      )}

      {/* Tab 1: Permissions Matrix */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-indigo-300 flex items-center gap-2">
              <span>🛡️</span>
              <span>Least-Privilege Role & Permissions Matrix</span>
            </h3>
            <span className="text-xs text-slate-400">Zero Direct Push to Main Across All Roles</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(PERMISSIONS_MATRIX).map(([key, role]) => (
              <div
                key={key}
                className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200">{role.role}</span>
                    <span className="text-[10px] font-mono font-bold bg-indigo-950/80 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                      {role.permission}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-3">{role.scopeDescription}</p>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Direct main push:</span>
                      <span className="text-rose-400 font-bold">⛔ BLOCKED</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Force push:</span>
                      <span className="text-rose-400 font-bold">⛔ BLOCKED</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Release PR Sign-off:</span>
                      <span className={role.canApproveReleasePR ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {role.canApproveReleasePR ? '✓ ALLOWED' : '✗ NO'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Manage Repo Settings:</span>
                      <span className={role.canChangeRepoSettings ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                        {role.canChangeRepoSettings ? '✓ ADMIN ONLY' : '✗ NO'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Branch Protection Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-indigo-300 flex items-center gap-2">
              <span>🌿</span>
              <span>Default Branch Protection Ruleset (main)</span>
            </h3>
            <span className="text-xs text-emerald-400 font-bold">Enforce Admins: ON</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2.5">
              <div className="text-xs font-bold text-slate-200 border-b border-slate-700 pb-2">
                Pull Request & Review Controls
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Required Approvals:</span>
                <span className="font-mono text-cyan-400 font-bold">2 Approving Reviews</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Dismiss Stale Reviews on Push:</span>
                <span className="text-emerald-400 font-bold">✓ ENABLED</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Require CODEOWNERS Review:</span>
                <span className="text-emerald-400 font-bold">✓ ENABLED</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Require Last Push Approval:</span>
                <span className="text-emerald-400 font-bold">✓ ENABLED</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Enforce Linear History:</span>
                <span className="text-emerald-400 font-bold">✓ ENABLED</span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2.5">
              <div className="text-xs font-bold text-slate-200 border-b border-slate-700 pb-2">
                Required Status Checks & Guardrails
              </div>
              <div className="space-y-1">
                {DEFAULT_BRANCH_PROTECTION_RULESET.requiredStatusChecks.map((check) => (
                  <div key={check} className="flex items-center justify-between text-xs bg-slate-900/60 p-1.5 rounded">
                    <span className="font-mono text-cyan-300">{check}</span>
                    <span className="text-emerald-400 font-bold text-[10px]">REQUIRED</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-300">Strict Status Checks (Up to date):</span>
                <span className="text-emerald-400 font-bold">✓ ENABLED</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Block Bypassing Rules:</span>
                <span className="text-rose-400 font-bold">✓ STRICT (NO BYPASS)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Baseline Scaffolding Files */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-indigo-300 flex items-center gap-2">
              <span>📄</span>
              <span>Standard Baseline Files Scaffolded</span>
            </h3>
            <span className="text-xs text-slate-400">{baselineFiles.length} files standard specification</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {baselineFiles.map((file) => (
              <div key={file.path} className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-teal-300">{file.path}</span>
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded uppercase font-bold">
                      {file.type}
                    </span>
                  </div>
                  <pre className="bg-slate-950 p-2.5 rounded text-[10px] text-slate-400 font-mono overflow-x-auto max-h-32">
                    {file.content}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Audit & Rollback */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-indigo-300 flex items-center gap-2">
              <span>📋</span>
              <span>Provisioning Audit Record & Automated Rollback Script</span>
            </h3>
            <button
              onClick={handleCopyRollback}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded text-xs font-bold transition-all"
            >
              {copiedRollback ? '✓ Copied to Clipboard!' : '📋 Copy Rollback Script'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <div className="text-xs font-bold text-slate-200 mb-2">Immutable Audit Record</div>
              <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-cyan-400 overflow-x-auto">
                {JSON.stringify(provisionResult?.auditRecord || {}, null, 2)}
              </pre>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <div className="text-xs font-bold text-slate-200 mb-2">Automated Rollback Script (.sh)</div>
              <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-rose-300 overflow-x-auto">
                {provisionResult?.auditRecord?.rollbackScript || '# No rollback script generated'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
