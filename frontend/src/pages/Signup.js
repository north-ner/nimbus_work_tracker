import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { register as registerUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import zxcvbn from 'zxcvbn';
import { AuthContext } from '../context/AuthContext';

const Signup = () => {
  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();

  const { loginUser } = useContext(AuthContext);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(null);

  // Google Sign-In credential callback
  const handleCredentialResponse = useCallback(
    async (response) => {
      const id_token = response.credential;

      try {
        const res = await fetch('http://localhost:8000/api/users/google-login/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_token }),
        });
        const data = await res.json();

        if (res.ok) {
          // ✅ Use AuthContext so ProtectedRoute sees user
          loginUser({ access: data.access, refresh: data.refresh });

          // Go to dashboard
          navigate('/dashboard');
        } else {
          setError(data.detail || 'Google login failed');
        }
      } catch (err) {
        setError('Network or server error during Google login');
      }
    },
    [navigate, loginUser]
  );

  // Load Google Sign-In button
  useEffect(() => {
    /* global google */
    if (window.google) {
      google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { theme: 'outline', size: 'large' }
      );
      // Optional: prompt One Tap
      // google.accounts.id.prompt();
    }
  }, [handleCredentialResponse]);

  const onSubmit = async (data) => {
    setError('');
    setSuccess('');
    try {
      await registerUser(data.username, data.email, data.password);
      setSuccess('Registration successful! Redirecting to OTP verification...');
      navigate('/verify-otp', { state: { username: data.username } });
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData) {
        if (errorData.email && String(errorData.email[0]).toLowerCase().includes('already')) {
          setError('Email already registered. Redirecting to login...');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        if (errorData.username && String(errorData.username).toLowerCase().includes('already')) {
          setError('Username already taken.');
          return;
        }
      }
      setError(errorData ? JSON.stringify(errorData) : 'Registration failed');
    }
  };

  const onPasswordChange = (e) => {
    const password = e.target.value;
    setPasswordStrength(zxcvbn(password).score);
    formRegister('password').onChange(e);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow"
        autoComplete="off"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {success && <p className="text-green-600 mb-4">{success}</p>}

        <div className="mb-4">
          <label className="block mb-1 font-semibold">Username</label>
          <input
            autoComplete="off"
            spellCheck="false"
            className={`w-full p-2 border rounded ${
              errors.username ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            {...formRegister('username', { required: true, minLength: 3 })}
            placeholder="Username"
          />
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">
              Username is required (min 3 chars)
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-semibold">Email</label>
          <input
            type="email"
            autoComplete="off"
            spellCheck="false"
            className={`w-full p-2 border rounded ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            {...formRegister('email', { required: true, pattern: /^\S+@\S+$/i })}
            placeholder="Email"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">Valid email is required</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block mb-1 font-semibold">Password</label>
          <input
            type="password"
            autoComplete="new-password"
            spellCheck="false"
            className={`w-full p-2 border rounded ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            {...formRegister('password', { required: true, minLength: 8 })}
            placeholder="Password"
            onChange={onPasswordChange}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              Password must be at least 8 characters
            </p>
          )}
          {passwordStrength !== null && (
            <p
              className={`mt-1 text-sm ${
                [
                  'text-red-600',
                  'text-orange-500',
                  'text-yellow-500',
                  'text-blue-600',
                  'text-green-600',
                ][passwordStrength]
              }`}
            >
              Password strength:{' '}
              {['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength]}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
        >
          Register
        </button>
      </form>

      <div className="max-w-md mx-auto mt-6 text-center">
        <div id="google-signin-button"></div>
      </div>
    </>
  );
};

export default Signup;
