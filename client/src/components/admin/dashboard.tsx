import { useEffect, useState } from 'react';
import axios from 'axios';

interface TrafficData {
  path: string;
  method: string;
  ip: string;
  city: string;
  region: string;
  country: string;
  device: string;
  timestamp: string;
}

function TrafficDashboard() {
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);

  useEffect(() => {
    const fetchTrafficData = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get('/api-proxy/api/traffic', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        setTrafficData(response.data);
      } catch (error: any) {
        console.error('Error fetching traffic data:', error);
      }
    };

    fetchTrafficData();
  }, []);

  return (
    <div className="relative z-[100] mx-auto p-4 sm:p-16">
      <h2 className="text-3xl font-bold text-center mb-4 text-text">Traffic Dashboard</h2>
      <div className="overflow-x-auto">
        <table className="table-auto w-full bg-white shadow-md rounded">
          <thead className="bg-root">
            <tr>
              <th className="px-4 py-2 text-root-contrast">IP Address</th>
              <th className="px-4 py-2 text-root-contrast">City</th>
              <th className="px-4 py-2 text-root-contrast">Region</th>
              <th className="px-4 py-2 text-root-contrast">Country</th>
              <th className="px-4 py-2 text-root-contrast">Path</th>
              <th className="px-4 py-2 text-root-contrast">Method</th>
              <th className="px-4 py-2 text-root-contrast">Device</th>
              <th className="px-4 py-2 text-root-contrast">Timestamp (Bangkok)</th>
            </tr>
          </thead>
          <tbody className="bg-root-contrast">
            {trafficData.map((data, index) => (
              <tr key={index} className="text-center border-b">
                <td className="px-4 py-2 text-root">{data.ip}</td>
                <td className="px-4 py-2 text-root">{data.city}</td>
                <td className="px-4 py-2 text-root">{data.region}</td>
                <td className="px-4 py-2 text-root">{data.country}</td>
                <td className="px-4 py-2 text-root">{data.path}</td>
                <td className="px-4 py-2 text-root">{data.method}</td>
                <td className="px-4 py-2 text-root">{data.device}</td>
                <td className="px-4 py-2 text-root">{data.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TrafficDashboard;
