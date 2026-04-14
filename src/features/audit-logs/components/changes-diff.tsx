interface ChangesDiffProps {
  changes: Record<string, unknown>;
}

export function ChangesDiff({ changes }: ChangesDiffProps) {
  const entries = Object.entries(changes);
  if (entries.length === 0) {
    return <span className="text-text-muted text-xs">No changes recorded</span>;
  }

  return (
    <div className="space-y-1">
      {entries.map(([field, value]) => {
        const isChange = Array.isArray(value) && value.length === 2;
        return (
          <div key={field} className="text-xs">
            <span className="font-medium text-text-primary">{field}:</span>{" "}
            {isChange ? (
              <>
                <span className="text-red-600 line-through">{String(value[0])}</span>
                {" → "}
                <span className="text-green-600">{String(value[1])}</span>
              </>
            ) : (
              <span className="text-green-600">{String(value)}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
