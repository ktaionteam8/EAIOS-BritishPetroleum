"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAutoRefresh<T>(fetcher: () => Promise<T>, intervalMs = 5000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const tick = useCallback(async () => {
    try {
      const next = await fetcher();
      if (mounted.current) setData(next);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    mounted.current = true;
    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [tick, intervalMs]);

  return { data, loading, refresh: tick };
}
