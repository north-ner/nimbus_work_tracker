// src/components/Login.jsx

import React, { useState, useContext } from 'react';
import { login } from '../services/authService'; // Your existing login service API call
import { AuthContext } from '../context/AuthContext'; // Your existing auth context
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [identifier, setIdentifier] = useState(''); // this can be username or email
  const [password, setPassword] = useState('');
  const { loginUser } = useContext(AuthContext);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Pass identifier (username or email) and password to backend login API
      const response = await login(identifier, password);
      loginUser(response.data);
      setError(null);
      navigate('/dashboard'); // Redirect after login success
    } catch (err) {
      setError('Invalid username/email or password');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <input
        type="text"
        placeholder="Username or Email"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        required
        className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Login
      </button>

      <p className="mt-4 text-center">
        <Link to="/forgot-password" className="underline text-blue-600 hover:text-blue-800">
          Forgot Password?
        </Link>
      </p>

      <p className="mt-4 text-center">
        New here? <Link to="/signup" className="underline text-blue-600 hover:text-blue-800">Register</Link>
      </p>
    </form>
  );
};

export default Login;
