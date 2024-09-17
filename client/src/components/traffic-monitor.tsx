import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

function TrafficMonitor() {
  const location = useLocation();

  useEffect(() => {
    const sendTrafficData = async () => {
      try {
        await axios.get('/api-proxy/');
      } catch (error) {
        console.error('Traffic monitoring error:', error);
      }
    };

    sendTrafficData();
  }, [location]);

  return null;
}

export default TrafficMonitor;
