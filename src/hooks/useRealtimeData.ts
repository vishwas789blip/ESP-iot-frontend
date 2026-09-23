import { useEffect, useState, useCallback, useRef } from 'react';

interface RealtimeDataOptions<T> {
  fetcher: (signal: AbortSignal) => Promise<T>;
  onLoaded?: (data: T) => void;
  enabled?: boolean;
}

interface RealtimeDataResult<T> {
  data: T | null;
  loading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useRealtimeData<T>(options: RealtimeDataOptions<T>): RealtimeDataResult<T> {
  const { fetcher, onLoaded, enabled = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  const onLoadedRef = useRef(onLoaded);
  const requestControllerRef = useRef<AbortController | null>(null);

  fetcherRef.current = fetcher;
  onLoadedRef.current = onLoaded;

  const execute = useCallback(async (signal: AbortSignal) => {
    try {
      const result = await fetcherRef.current(signal);
      if (mountedRef.current && !signal.aborted) {
        setData(result);
        setError(null);
        onLoadedRef.current?.(result);
      }
    } catch (err) {
      if (mountedRef.current && !signal.aborted) {
        setError(err);
      }
    } finally {
      if (mountedRef.current && !signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      setLoading(false);
      return;
    }

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setLoading(true);
    void execute(controller.signal);

    return () => {
      mountedRef.current = false;
      controller.abort();
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
    };
  }, [execute, enabled]);

  const refetch = useCallback(() => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setLoading(true);
    void execute(controller.signal).finally(() => {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
    });
  }, [execute]);

  return { data, loading, error, refetch };
}
