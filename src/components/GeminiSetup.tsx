import React, { useState } from 'react';
import { Key, Brain, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface GeminiSetupProps {
  onApiKeySubmit: (apiKey: string) => void;
  isInitializing: boolean;
  error: string | null;
  isInitialized: boolean;
}

export const GeminiSetup: React.FC<GeminiSetupProps> = ({
  onApiKeySubmit,
  isInitializing,
  error,
  isInitialized
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
    }
  };

  if (isInitialized) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700 font-medium">Gemini AI Connected</p>
        </div>
        <p className="text-green-600 text-sm mt-1">Ready for intelligent log analysis</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-4">
        <Brain className="w-6 h-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-800">Setup Gemini AI Analysis</h3>
      </div>

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="font-medium text-blue-800 mb-2">Get Your Gemini API Key</h4>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">Google AI Studio <ExternalLink className="w-3 h-3" /></a></li>
          <li>2. Sign in with your Google account</li>
          <li>3. Click "Create API Key" and copy it</li>
          <li>4. Paste the key below to enable AI-powered log analysis</li>
        </ol>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 font-medium">Setup Error</p>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
            Gemini API Key
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="apiKey"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
              placeholder="Enter your Gemini API key"
              required
              disabled={isInitializing}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isInitializing}
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isInitializing || !apiKey.trim()}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isInitializing ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Connecting to Gemini AI...
            </div>
          ) : (
            'Connect Gemini AI'
          )}
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p>Your API key is stored locally and never sent to our servers.</p>
        <p>Gemini AI will analyze your logs to provide intelligent insights.</p>
      </div>
    </div>
  );
};