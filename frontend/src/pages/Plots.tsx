import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Plot {
  id: number;
  name: string;
  location: string;
  size: number;
  soil_type: string;
  weather_zone: string;
}

const Plots: React.FC = () => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlots = async () => {
      try {
        const response = await api.get('/plots/');
        setPlots(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch plots');
        setLoading(false);
      }
    };

    fetchPlots();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Plots</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size (m²)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Soil Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weather Zone</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plots.map((plot) => (
              <tr key={plot.id}>
                <td className="px-6 py-4 whitespace-nowrap">{plot.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{plot.location}</td>
                <td className="px-6 py-4 whitespace-nowrap">{plot.size}</td>
                <td className="px-6 py-4 whitespace-nowrap">{plot.soil_type}</td>
                <td className="px-6 py-4 whitespace-nowrap">{plot.weather_zone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Plots; 