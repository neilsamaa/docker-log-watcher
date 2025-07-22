import React from 'react';
import { Container } from '../types/Container';
import { RefreshCw, Server, Play, Square } from 'lucide-react';

interface ContainerSelectorProps {
  containers: Container[];
  filterInfo: { filter: string; states: string; total: number; filtered: number } | null;
  selectedContainer: string;
  onContainerSelect: (containerName: string) => void;
  onRefresh: () => void;
  loading: boolean;
  error: string | null;
}

export const ContainerSelector: React.FC<ContainerSelectorProps> = ({
  containers,
  filterInfo,
  selectedContainer,
  onContainerSelect,
  onRefresh,
  loading,
  error
}) => {
  const getStatusIcon = (state: string) => {
    return state === 'running' ? (
      <Play className="w-4 h-4 text-green-500" />
    ) : (
      <Square className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusColor = (state: string) => {
    return state === 'running' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Docker Containers</h2>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {filterInfo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-blue-700">
                <strong>Names:</strong> {filterInfo.filter}
              </span>
              <span className="text-blue-600">
                {filterInfo.filtered} of {filterInfo.total}
              </span>
            </div>
            <div className="text-blue-700">
              <strong>States:</strong> {filterInfo.states}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {containers.length === 0 && !loading ? (
          <div className="text-center py-8 text-gray-500">
            <Server className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No containers found</p>
          </div>
        ) : (
          containers.map((container) => (
            <div
              key={container.id}
              className={`
                p-3 border rounded-md cursor-pointer transition-all
                ${selectedContainer === container.name 
                  ? 'border-blue-500 bg-blue-50' 
                  : `${getStatusColor(container.state)} hover:bg-gray-50`
                }
              `}
              onClick={() => onContainerSelect(container.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(container.state)}
                  <div>
                    <p className="font-medium text-gray-800">{container.name}</p>
                    <p className="text-sm text-gray-500">{container.image}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${container.state === 'running' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                    }
                  `}>
                    {container.state}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};