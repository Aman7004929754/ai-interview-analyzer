import { addUser } from '../_lib/users.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  const result = addUser(username, password, email || '');

  if (result.success) {
    return res.json({ success: true, message: 'User created successfully' });
  }

  return res.status(409).json({ success: false, error: result.error });
}
