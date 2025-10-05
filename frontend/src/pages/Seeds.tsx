import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Seed {
  id: number;
  name: string;
  variety: string;
  ideal_temperature: string;
  moisture_needed: string;
  days_to_germination: number;
}

const Seeds: React.FC = () => {
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeeds = async () => {
      try {
        const response = await api.get('/seeds/');
        setSeeds(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch seeds');
        setLoading(false);
      }
    };

    fetchSeeds();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Seeds</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variety</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temperature</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moisture</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Germination Days</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {seeds.map((seed) => (
              <tr key={seed.id}>
                <td className="px-6 py-4 whitespace-nowrap">{seed.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{seed.variety}</td>
                <td className="px-6 py-4 whitespace-nowrap">{seed.ideal_temperature}</td>
                <td className="px-6 py-4 whitespace-nowrap">{seed.moisture_needed}</td>
                <td className="px-6 py-4 whitespace-nowrap">{seed.days_to_germination}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Seeds; 