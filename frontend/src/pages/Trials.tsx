import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Trial {
  id: number;
  seed: {
    id: number;
    name: string;
  };
  plot: {
    id: number;
    name: string;
  };
  start_date: string;
  end_date: string | null;
  status: string;
  growth_summary: {
    average_height: number;
    health_score: number;
  };
}

const Trials: React.FC = () => {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrials = async () => {
      try {
        const response = await api.get('/trials/');
        setTrials(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch trials');
        setLoading(false);
      }
    };

    fetchTrials();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Trials</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seed</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plot</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Height</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health Score</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trials.map((trial) => (
              <tr key={trial.id}>
                <td className="px-6 py-4 whitespace-nowrap">{trial.seed.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{trial.plot.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(trial.start_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {trial.end_date ? new Date(trial.end_date).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{trial.status}</td>
                <td className="px-6 py-4 whitespace-nowrap">{trial.growth_summary.average_height} cm</td>
                <td className="px-6 py-4 whitespace-nowrap">{trial.growth_summary.health_score}/10</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Trials; 