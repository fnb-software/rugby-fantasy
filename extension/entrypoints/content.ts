// Captures the lagrandemelee.midi-olympique.fr session token and writes it
// to extension storage so the popup can reuse it for API calls.
//
// Strategy: probe localStorage and sessionStorage for any key matching
// /token|auth|jwt/i with a value > 20 chars. Re-probe periodically so a
// login that happens after page load still gets picked up.
//
// TODO confirm the exact storage key by inspecting the live site once
//   logged in (DevTools → Application → Storage). Tighten the heuristic
//   below to that key for reliability.

export default defineContentScript({
  matches: ["https://lagrandemelee.midi-olympique.fr/*"],
  runAt: "document_idle",
  main() {
    const probe = (s: Storage): string | null => {
      for (let i = 0; i < s.length; i++) {
        const key = s.key(i);
        if (!key) continue;
        if (!/token|auth|jwt/i.test(key)) continue;
        const v = s.getItem(key);
        if (v && v.length >= 20) return v;
      }
      return null;
    };

    let lastSent: string | null = null;
    const tick = async () => {
      const token = probe(localStorage) ?? probe(sessionStorage);
      if (!token || token === lastSent) return;
      lastSent = token;
      await browser.storage.local.set({
        auth_token: token,
        auth_seen_at: Date.now(),
      });
    };

    tick();
    setInterval(tick, 3000);
  },
});
