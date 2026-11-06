const INITIAL_STATS = {
  total: 1240,
  games: {
    "salada-da": 186,
    "cat-vs-alien-mice": 243,
    "takoyaki-gunkann": 215,
    "sara-flappy-angel": 178,
    "pantsman": 312,
  },
};

const CACHE_KEY_URL = "https://noel-arcade-internal.local/api/stats-store-v1";

async function loadStats(env) {
  if (env && env.STATS_KV) {
    try {
      const stored = await env.STATS_KV.get("stats_v1", "json");
      if (stored && typeof stored === "object") {
        return {
          total: Math.max(INITIAL_STATS.total, Number(stored.total) || 0),
          games: { ...INITIAL_STATS.games, ...(stored.games || {}) },
        };
      }
    } catch {
      // Fallback to Cache API
    }
  }

  if (typeof caches !== "undefined" && caches.default) {
    try {
      const cachedRes = await caches.default.match(CACHE_KEY_URL);
      if (cachedRes) {
        const stored = await cachedRes.json();
        return {
          total: Math.max(INITIAL_STATS.total, Number(stored.total) || 0),
          games: { ...INITIAL_STATS.games, ...(stored.games || {}) },
        };
      }
    } catch {
      // Fallback to initial stats
    }
  }

  return structuredClone(INITIAL_STATS);
}

async function saveStats(env, stats) {
  if (env && env.STATS_KV) {
    try {
      await env.STATS_KV.put("stats_v1", JSON.stringify(stats));
    } catch {
      // Ignore KV write error
    }
  }

  if (typeof caches !== "undefined" && caches.default) {
    try {
      const responseToCache = new Response(JSON.stringify(stats), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=31536000",
        },
      });
      await caches.default.put(CACHE_KEY_URL, responseToCache);
    } catch {
      // Ignore Cache write error
    }
  }
}

export async function onRequestGet(context) {
  const stats = await loadStats(context.env);
  return new Response(JSON.stringify(stats), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequestPost(context) {
  const stats = await loadStats(context.env);
  try {
    const body = await context.request.json();
    if (body?.type === "visit") {
      stats.total = (Number(stats.total) || INITIAL_STATS.total) + 1;
    } else if (body?.type === "play" && typeof body.gameId === "string" && body.gameId.length < 64) {
      const current = Number(stats.games[body.gameId]) || INITIAL_STATS.games[body.gameId] || 100;
      stats.games[body.gameId] = current + 1;
    }
    await saveStats(context.env, stats);
  } catch {
    // Ignore malformed JSON
  }

  return new Response(JSON.stringify(stats), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
