import { useEffect, useState } from 'react';
import { ExamDate, PricingConfig } from '@/lib/types/exam-config';

interface ExamConfigData {
  examDates: ExamDate[];
  pricing: PricingConfig;
}

interface UseExamConfigReturn {
  config: ExamConfigData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useExamConfig(): UseExamConfigReturn {
  const [config, setConfig] = useState<ExamConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/config');

      if (!response.ok) {
        throw new Error('Failed to fetch configuration');
      }

      const result = await response.json();

      if (result?.examDates) {
        setConfig(result);
      } else {
        throw new Error('Invalid configuration data');
      }
    } catch (err) {
      console.error('Error fetching exam config:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return {
    config,
    loading,
    error,
    refetch: fetchConfig,
  };
}

export function getRegistrationFee(currentClass: string, pricing: PricingConfig): number {
  const foundationClasses = ['7', '8', '9'];
  return foundationClasses.includes(currentClass) ? pricing.foundation : pricing.regular;
}

export function getExamType(currentClass: string): 'foundation' | 'regular' {
  const foundationClasses = ['7', '8', '9'];
  return foundationClasses.includes(currentClass) ? 'foundation' : 'regular';
}
