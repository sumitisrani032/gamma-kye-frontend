"use client";

import { Alert } from "@/components/ui";
import { OrgNodeCard } from "./org-node-card";
import { useMyTeam } from "../hooks/use-my-team";

interface MyTeamViewProps {
  employeeId: string | null;
  onNodeClick?: (id: string) => void;
}

export function MyTeamView({ employeeId, onNodeClick }: MyTeamViewProps) {
  const { team, loading, error } = useMyTeam(employeeId);

  if (!employeeId) {
    return (
      <div className="text-center py-12 text-sm text-text-muted">
        You need an employee profile to view your team.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!team) return null;

  return (
    <div className="space-y-8">
      {/* Manager */}
      <div className="flex flex-col items-center">
        {team.manager ? (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
              Reporting Manager
            </p>
            <OrgNodeCard node={team.manager} onClick={onNodeClick} />
            {/* Connector line */}
            <div className="w-px h-6 bg-border" />
          </>
        ) : (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
              Top Level
            </p>
            <div className="rounded-lg border border-dashed border-border px-4 py-2 text-xs text-text-muted">
              No reporting manager
            </div>
            <div className="w-px h-6 bg-border" />
          </>
        )}
      </div>

      {/* Me + Peers row */}
      <div>
        <div className="flex items-start justify-center gap-4 flex-wrap">
          {/* Peers before me */}
          {team.peers.map((peer) => (
            <OrgNodeCard key={peer.id} node={peer} onClick={onNodeClick} />
          ))}

          {/* Me (highlighted) */}
          <div className="flex flex-col items-center">
            <OrgNodeCard node={team.me} highlighted onClick={onNodeClick} />

            {/* Direct Reports */}
            {team.directReports.length > 0 && (
              <>
                <div className="w-px h-6 bg-border" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
                  Direct Reports ({team.directReports.length})
                </p>
                <div className="flex items-start gap-3 flex-wrap justify-center">
                  {team.directReports.map((report) => (
                    <OrgNodeCard key={report.id} node={report} size="sm" onClick={onNodeClick} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
