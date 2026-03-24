import React, { createContext, useContext, useMemo } from 'react';
import { Prompts } from '../prompts';
import { Evaluations } from '../evaluations';
import { KloddyClient } from '../client';
import { KloddyOptions } from '../types';

interface KloddyContextType {
  prompts: Prompts;
  evaluations: Evaluations;
}

const KloddyContext = createContext<KloddyContextType | null>(null);

export interface KloddyProviderProps {
  children: React.ReactNode;
  client?: KloddyClient;
  options?: KloddyOptions;
  apiKey?: string; // Convience prop for project ID
  token?: string; // Convience prop for passing a pre-authenticated token
}

export const KloddyProvider: React.FC<KloddyProviderProps> = ({ children, client, options, apiKey, token }) => {
  const value = useMemo(() => {
    const activeClient = client || new KloddyClient({ ...options, apiKey, token });
    return {
      prompts: new Prompts({ posthog: activeClient }),
      evaluations: new Evaluations({ posthog: activeClient }),
    };
  }, [client, options, token]);

  return <KloddyContext.Provider value={value}>{children}</KloddyContext.Provider>;
};

export const usePrompt = () => {
  const context = useContext(KloddyContext);
  if (!context) {
    throw new Error('usePrompt must be used within a KloddyProvider');
  }

  const { prompts, evaluations } = context;

  return {
    getPrompt: (id: string, options = {}) => prompts.get(id, options),
    getAwnser: (id: string, options = {}) => prompts.execute(id, options), // Use user's spelling "getAwnser"
    getEvaluation: (id: string, variables = {}) => evaluations.get(id, variables),
    compile: (template: any, variables: any) => prompts.compile(template, variables),
  };
};
