import { useState, useEffect } from 'react';
import axios from 'axios';
import TrafficDashboard from '@components/admin/dashboard';
import Login from '@components/admin/login';

function AdminPage() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get('/api-proxy/api/traffic', {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        setToken(null);
        localStorage.removeItem('token');
      }
    };

    if (token) {
      checkAuth();
    }
  }, [token]);

  if (!token) {
    return <Login setToken={setToken} />;
  }

  return <TrafficDashboard />;
}

export default AdminPage;
