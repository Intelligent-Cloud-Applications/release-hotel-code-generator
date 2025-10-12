import { useLoadingContext } from '../context/LoadingContext.jsx';
import { useCallback } from 'react';

export const useLoading = () => {
  const { setLoading, clearLoading, isLoading, loadingStates } = useLoadingContext();

  const withLoading = useCallback(async (key, asyncFn, type = 'DATA_LOADING', variant = 'overlay') => {
    try {
      setLoading(key, true, type, variant);
      const result = await asyncFn();
      return result;
    } finally {
      clearLoading(key);
    }
  }, [setLoading, clearLoading]);

  const startLoading = useCallback((key, type = 'DATA_LOADING', variant = 'overlay') => {
    setLoading(key, true, type, variant);
  }, [setLoading]);

  const stopLoading = useCallback((key) => {
    clearLoading(key);
  }, [clearLoading]);

  const isKeyLoading = useCallback((key) => {
    return loadingStates[key]?.isLoading || false;
  }, [loadingStates]);

  return {
    withLoading,
    startLoading,
    stopLoading,
    isKeyLoading,
    isLoading,
    loadingStates,
  };
};

export default useLoading;
