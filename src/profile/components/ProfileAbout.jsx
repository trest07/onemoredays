export default function ProfileAbout({ profile, isOwner }) {
  const rows = [
    ["Display name", profile.display_name],
    ["Username", profile.username],
    ["Location", profile.location],
    ["Website", profile.website],
  ];

  return (
    <div className="space-y-2">
      {rows.map(([label, value]) => (
        <div key={label} className="text-sm">
          <span className="text-gray-500 w-32 inline-block">{label}</span>
          {value ? (
            label === "Website" ? (
              <a
                href={value.startsWith("http") ? value : `https://${value}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {value}
              </a>
            ) : (
              <span>{value}</span>
            )
          ) : (
            <span>—</span>
          )}
        </div>
      ))}
      {isOwner && (
        <div className="mt-4 text-xs text-gray-400">
          Only you can see and edit your private details.
        </div>
      )}
    </div>
  );
}
