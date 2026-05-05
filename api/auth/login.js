import { authenticateUser } from '../_lib/users.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const result = authenticateUser(username, password);

  if (result.success) {
    return res.json({ success: true, user: result.user });
  }

  return res.status(401).json({ success: false, error: result.error });
}
