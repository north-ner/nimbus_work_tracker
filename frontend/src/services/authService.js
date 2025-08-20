import axios from 'axios';
const API_URL = 'http://localhost:8000/api/users/';

export const register = (username, email, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('email', email);
  formData.append('password', password);

  return axios.post(API_URL + 'register/', formData);
};

export const login = (identifier, password) => {
  // Send JSON with identifier and password, not FormData
  return axios.post(API_URL + 'login/', { identifier, password });
};

export const googleSignIn = (idToken) => {
  return axios.post(API_URL + 'google-login/', { id_token: idToken });
};