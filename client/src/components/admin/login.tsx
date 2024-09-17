import React, { useState } from 'react';
import axios from 'axios';

interface LoginProps {
  setToken: (token: string) => void;
}

const Login: React.FC<LoginProps> = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      const response = await axios.post('/api-proxy/api/login', { username, password });
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
    } catch (err) {
      console.log(err)
      setError('Invalid credentials');
    }
  };

  return (
    <div className="relative mx-auto p-4 z-[100]">
      <h2 className="text-3xl font-bold text-center mb-4 text-text">Login</h2>
      {error && <p className="text-red-500 text-center">{error}</p>}
      <form onSubmit={handleLogin} className="max-w-sm mx-auto">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="block w-full p-2 mb-4 border rounded text-bg"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full p-2 mb-4 border rounded text-bg"
        />
        <button
          type="submit"
          className="block w-full bg-blue-500 text-white p-2 rounded"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
