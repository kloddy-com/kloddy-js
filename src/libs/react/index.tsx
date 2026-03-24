'use client';

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { Prompts } from '../../prompts';
import { Evaluations } from '../../evaluations';
import { KloddyClient } from '../../client';
import { KloddyOptions, PromptOptions, ExecuteOptions, EvaluationOptions } from '../../types';

interface KloddyContextType {
  prompts: Prompts<any>;
  evaluations: Evaluations;
  isLoading: boolean;
  error: Error | null;
}

const KloddyContext = createContext<KloddyContextType | null>(null);

export interface KloddyProviderProps {
  children: React.ReactNode;
  client?: KloddyClient;
  options?: KloddyOptions;
  apiKey?: string; // Convenience prop for project ID
  token?: string; // Convenience prop for passing a pre-authenticated token
  authEndpoint?: string; // URL to fetch token from (e.g., /api/kloddy/token)
}

/**
 * KloddyProvider manages the Kloddy SDK state for React applications.
 * It handles client initialization and optional automatic token fetching.
 */
export const KloddyProvider: React.FC<KloddyProviderProps> = ({ 
  children, 
  client, 
  options, 
  apiKey, 
  token: initialToken,
  authEndpoint 
}) => {
  const [token, setToken] = useState<string | undefined>(initialToken);
  const [isLoading, setIsLoading] = useState(!!authEndpoint && !initialToken);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (authEndpoint && !token) {
      setIsLoading(true);
      fetch(authEndpoint)
        .then(res => res.json())
        .then(data => {
          if (data.token) {
            setToken(data.token);
          } else {
            throw new Error('No token returned from authEndpoint');
          }
        })
        .catch(err => {
          console.error('KloddyProvider: Failed to fetch token:', err);
          setError(err instanceof Error ? err : new Error(String(err)));
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [authEndpoint, token]);

  const value = useMemo(() => {
    const activeClient = client || new KloddyClient({ ...options, apiKey, token });
    return {
      prompts: new Prompts({ client: activeClient }),
      evaluations: new Evaluations({ client: activeClient }),
      isLoading,
      error
    };
  }, [client, options, apiKey, token, isLoading, error]);

  return <KloddyContext.Provider value={value}>{children}</KloddyContext.Provider>;
};

/**
 * Hook to access Kloddy prompts and general SDK features.
 * 
 * @template TPromptNames Union of strings for type-safe prompt names.
 */
export const usePrompt = <TPromptNames extends string = string>() => {
  const context = useContext(KloddyContext);
  if (!context) {
    throw new Error('usePrompt must be used within a KloddyProvider');
  }

  const { prompts, evaluations, isLoading, error } = context;
  const typedPrompts = prompts as unknown as Prompts<TPromptNames>;

  return {
    prompts: typedPrompts,
    isLoading,
    error,
    getPrompt: (id: TPromptNames, options: PromptOptions = {}) => typedPrompts.get(id, options),
    getAwnser: (id: TPromptNames, options: ExecuteOptions = {}) => typedPrompts.execute(id, options),
    /** @deprecated Use useEvaluations instead */
    getEvaluation: (id: string, variables = {}) => evaluations.get(id, variables),
    compile: (template: any, variables: any) => typedPrompts.compile(template, variables),
  };
};

/**
 * Hook to access Kloddy evaluations.
 */
export const useEvaluations = () => {
  const context = useContext(KloddyContext);
  if (!context) {
    throw new Error('useEvaluations must be used within a KloddyProvider');
  }

  const { evaluations, isLoading, error } = context;

  return {
    evaluations,
    isLoading,
    error,
    run: (options: EvaluationOptions) => evaluations.run(options),
    evaluate: (options: EvaluationOptions) => evaluations.evaluate(options),
    get: (name: string, variables = {}) => evaluations.get(name, variables),
  };
};

/**
 * Hook for streaming prompt responses.
 * (Placeholder implementation - requires backend streaming support)
 */
export const usePromptStream = <TPromptNames extends string = string>() => {
  const { prompts } = usePrompt<TPromptNames>();
  const [stream, setStream] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  const executeStream = async (name: TPromptNames, options: ExecuteOptions = {}) => {
    setIsStreaming(true);
    setStream('');
    // Implementation would go here using fetch API with ReadableStream
    console.warn('usePromptStream: Streaming is currently a placeholder.');
    const result = await prompts.execute(name, options);
    setStream(result.result);
    setIsStreaming(false);
    return result;
  };

  return {
    stream,
    isStreaming,
    executeStream,
  };
};
