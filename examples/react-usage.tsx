import React, { useEffect, useState } from 'react';
import { KloddyProvider, usePrompt } from '../src';

const PromptComponent = () => {
  const { getPrompt, getAwnser, getEvaluation } = usePrompt();
  const [prompt, setPrompt] = useState<any>(null);
  const [answer, setAnswer] = useState<string>('');

  const loadData = async () => {
    // Get a prompt
    const p = await getPrompt('welcome-message', { fallback: 'Welcome!' });
    setPrompt(p);

    // Get an answer (execution)
    const a = await getAwnser('welcome-message', { variables: { name: 'User' } });
    setAnswer(a.result);
    
    // Get an evaluation
    const evalResult = await getEvaluation('model-comparison');
    console.log('Winner:', evalResult.winner);
  };

  return (
    <div>
      <h1>Kloddy React Example</h1>
      <button onClick={loadData}>Load Data</button>
      {prompt && <p>Template: {prompt.content}</p>}
      {answer && <p>Response: {answer}</p>}
    </div>
  );
};

export const App = () => {
  // In a real app, you would fetch this token from your server
  const [sessionToken, setSessionToken] = useState('...'); 

  return (
    <KloddyProvider apiKey="YOUR_PROJECT_ID" token={sessionToken}>
      <PromptComponent />
    </KloddyProvider>
  );
};
