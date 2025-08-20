import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const OTP_EXPIRE_TIME = 10 * 60; // 10 minutes in seconds

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const usernameFromState = location.state?.username || '';

  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRE_TIME);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secondsLeft = seconds % 60;
    return `${minutes}:${secondsLeft < 10 ? '0' : ''}${secondsLeft}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await axios.post('http://localhost:8000/api/users/verify-otp/', {
        username: usernameFromState,
        otp_code: otpCode,
      });
      setSuccess(response.data.detail);
      setRedirecting(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'OTP verification failed');
    }
  };

  const resendOtp = async () => {
    setError('');
    setSuccess('');
    try {
      await axios.post('http://localhost:8000/api/users/request-reset-otp/', {
        identifier: usernameFromState,
      });
      setSuccess(`OTP resent to user: ${usernameFromState}`);
      setTimeLeft(OTP_EXPIRE_TIME);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend OTP');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Verify OTP</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">{success}</p>}

      {!success && (
        <form onSubmit={handleSubmit}>
          <div className="mb-4 text-center">
            <p className="font-semibold text-lg">Username: {usernameFromState}</p>
          </div>

          <div className="mb-6">
            <label className="block mb-1 font-semibold">OTP Code</label>
            <input
              type="text"
              maxLength={6}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              required
              autoComplete="off"
              spellCheck="false"
              inputMode="numeric"
              autoCapitalize="none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
          >
            Verify OTP
          </button>
        </form>
      )}

      <div className="my-4 text-center">
        <p>OTP expires in: {formatTime(timeLeft)}</p>
        <button
          onClick={resendOtp}
          disabled={!canResend}
          className={`w-full py-2 rounded font-semibold ${canResend ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
        >
          Resend OTP
        </button>
        {!canResend && <p className="text-sm text-gray-600 mt-2">Please wait before requesting a new OTP.</p>}
      </div>

      {redirecting && (
        <p className="text-center mt-4">
          Redirecting to login... or{' '}
          <Link to="/login" className="underline text-blue-600 hover:text-blue-800">
            Login Now
          </Link>
        </p>
      )}
    </div>
  );
};

export default VerifyOtp;
