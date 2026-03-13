import { generateToken } from '../middleware/auth.js';

export const login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Phase 1: Simple hardcoded authentication
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = generateToken({ username, role: 'admin' });
    return res.json({
      token,
      user: {
        name: username,
        role: 'admin'
      }
    });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
};
