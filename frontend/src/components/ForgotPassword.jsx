import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState(''); // username or email
  const [submittedIdentifier, setSubmittedIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP and reset password
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

const requestOtp = async () => {
  setError('');
  setSuccess('');
  try {
    // Send OTP request (same as before)
    await axios.post('http://localhost:8000/api/users/request-reset-otp/', {
      identifier
    });

    if (identifier.includes('@')) {
      // Identifier is already email, show directly
      setSuccess(`OTP sent to email: ${identifier}`);
      setSubmittedIdentifier(identifier);
    } else {
      // Identifier is username, fetch email from backend separately
      try {
        const res = await axios.post('http://localhost:8000/api/users/get-email/', {
          username: identifier
        });
        const userEmail = res.data.email;
        setSuccess(`OTP sent to email: ${userEmail}`);
        setSubmittedIdentifier(identifier);  // Still use username for verification
      } catch (emailErr) {
        // If email fetch fails, fallback to username display to not break UX
        setSuccess(`OTP sent for username: ${identifier}`);
        setSubmittedIdentifier(identifier);
      }
    }
    setStep(2);
  } catch (err) {
    setError(err.response?.data?.detail || 'Failed to send OTP');
  }
};


  const verifyOtpAndReset = async () => {
    setError('');
    setSuccess('');
    try {
      await axios.post('http://localhost:8000/api/users/reset-password/', {
        identifier: submittedIdentifier,
        otp_code: otp,
        new_password: newPassword
      });
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'OTP verification or password reset failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">{success}</p>}

      {step === 1 && (
        <>
          <input
            type="text"
            placeholder="Enter your username or email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
            spellCheck="false"
            inputMode="text"
          />
          <button
            onClick={requestOtp}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Request OTP
          </button>
        </>
      )}

      {step === 2 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifyOtpAndReset();
          }}
        >
          <input
            type="text"
            placeholder="Enter OTP"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
            spellCheck="false"
            inputMode="numeric"
            autoCapitalize="none"
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="new-password"
            spellCheck="false"
            autoCapitalize="none"
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
          >
            Reset Password
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
