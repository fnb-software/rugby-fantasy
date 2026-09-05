const NoPlayers = ({ variant = "block" }: { variant?: "block" | "banner" }) =>
  variant === "banner" ? (
    <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <strong>No player data yet.</strong> Install the{" "}
      <em>Top14 fantasy refresher</em> extension and visit{" "}
      <a
        href="https://lagrandemelee.midi-olympique.fr"
        className="underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        lagrandemelee.midi-olympique.fr
      </a>{" "}
      while signed into this app — the extension will sync your players. Then
      reload.
    </div>
  ) : (
    <div className="max-w-xl mx-auto mt-12 rounded border border-amber-300 bg-amber-50 p-6 text-amber-900">
      <h2 className="text-lg font-bold mb-2">No player data yet</h2>
      <p className="mb-2">
        This page needs your fantasy roster. To load it:
      </p>
      <ol className="list-decimal pl-5 space-y-1 text-sm">
        <li>
          Install the <em>Top14 fantasy refresher</em> browser extension.
        </li>
        <li>
          Visit{" "}
          <a
            href="https://lagrandemelee.midi-olympique.fr"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            lagrandemelee.midi-olympique.fr
          </a>{" "}
          while signed into this app.
        </li>
        <li>Click the extension's refresh action.</li>
        <li>Reload this page.</li>
      </ol>
    </div>
  );

export default NoPlayers;
