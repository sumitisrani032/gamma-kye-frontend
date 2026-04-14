import type { OrgNode } from "@/types";

interface OrgNodeCardProps {
  node: OrgNode;
  highlighted?: boolean;
  size?: "sm" | "md";
  onClick?: (id: string) => void;
}

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function OrgNodeCard({ node, highlighted = false, size = "md", onClick }: OrgNodeCardProps) {
  const isSmall = size === "sm";

  return (
    <button
      type="button"
      onClick={() => onClick?.(node.id)}
      className={`
        flex items-center gap-3 rounded-xl border text-left transition-all
        ${highlighted
          ? "border-primary-400 bg-primary-50 ring-2 ring-primary-200"
          : "border-border bg-surface hover:border-primary-300 hover:shadow-sm"
        }
        ${isSmall ? "px-3 py-2" : "px-4 py-3"}
        ${onClick ? "cursor-pointer" : "cursor-default"}
      `}
    >
      {/* Avatar */}
      {node.profile_photo_url ? (
        <img
          src={node.profile_photo_url}
          alt={node.full_name}
          className={`rounded-full object-cover shrink-0 ${isSmall ? "h-8 w-8" : "h-10 w-10"}`}
        />
      ) : (
        <div className={`flex items-center justify-center rounded-full shrink-0 font-medium ${
          highlighted ? "bg-primary-200 text-primary-800" : "bg-primary-100 text-primary-700"
        } ${isSmall ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm"}`}>
          {getInitials(node.full_name)}
        </div>
      )}

      {/* Info */}
      <div className="min-w-0">
        <p className={`font-medium text-text-primary truncate ${isSmall ? "text-xs" : "text-sm"}`}>
          {node.full_name}
        </p>
        {node.designation && (
          <p className={`text-text-secondary truncate ${isSmall ? "text-[10px]" : "text-xs"}`}>
            {node.designation.name}
          </p>
        )}
        {node.department && (
          <p className={`text-text-muted truncate ${isSmall ? "text-[10px]" : "text-xs"}`}>
            {node.department.name}
          </p>
        )}
      </div>
    </button>
  );
}
