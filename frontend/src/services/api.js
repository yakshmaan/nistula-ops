import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8000' });

export const getInbox = () => API.get('/messages/inbox');
export const sendInbound = (data) => API.post('/messages/inbound', data);
export const sendMessage = (data) => API.post('/messages/send', data);
export const getConversation = (guestId) => API.get(`/messages/guest/${guestId}/conversation`);
export const getGuests = () => API.get('/guests');
export const getGuest = (id) => API.get(`/guests/${id}`);
export const getDashboard = () => API.get('/analytics/dashboard');
