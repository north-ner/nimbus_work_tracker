import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logoutUser } = useContext(AuthContext);

  return (
    <div>
      <h1>Welcome, {user.username}</h1>
      <button onClick={logoutUser}>Logout</button>
      {/* Add your dashboard layout and content here */}
    </div>
  );
};

export default Dashboard;
