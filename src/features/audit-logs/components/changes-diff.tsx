interface ChangesDiffProps {
  changes: Record<string, [unknown, unknown]>;
}

export function ChangesDiff({ changes }: ChangesDiffProps) {
  const entries = Object.entries(changes);
  if (entries.length === 0) {
    return <span className="text-text-muted text-xs">No changes recorded</span>;
  }

  return (
    <div className="space-y-1">
      {entries.map(([field, [oldVal, newVal]]) => (
        <div key={field} className="text-xs">
          <span className="font-medium text-text-primary">{field}:</span>{" "}
          <span className="text-red-600 line-through">{String(oldVal)}</span>
          {" → "}
          <span className="text-green-600">{String(newVal)}</span>
        </div>
      ))}
    </div>
  );
}
