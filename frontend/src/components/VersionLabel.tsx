const commit = import.meta.env.VITE_BUILD_COMMIT || "locale";
const build = import.meta.env.VITE_BUILD_NUMBER || "dev";
export default function VersionLabel() {
  return <div className="version-label" title={`Commit GitHub: ${commit}`}>
    Versione <strong>build {build}</strong> · <a href={`https://github.com/zantium1/prenotazioni/commit/${commit}`} target="_blank" rel="noreferrer">commit {commit.slice(0,7)}</a>
  </div>;
}
