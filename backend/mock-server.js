const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

// In-memory storage
const users = [];
const properties = [];
const prospects = [];

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = 'dev-secret-change-in-production-12345678901234567890';
const JWT_REFRESH_SECRET = 'dev-refresh-secret-change-in-production-09876543210987654321';

// Helper function to generate tokens
const generateTokens = (userId, email, role) => {
  const accessToken = jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId, email }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Register
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'agent' } = req.body;

    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(user);

    // Generate tokens
    const tokens = generateTokens(user.id, user.email, user.role);

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      user: userWithoutPassword,
      ...tokens
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const tokens = generateTokens(user.id, user.email, user.role);

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      ...tokens
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Get current user
app.get('/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Refresh token
app.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user.userId, user.email, user.role);
    res.json(tokens);
  });
});

// Logout
app.post('/auth/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// ============================================
// USERS ROUTES
// ============================================

app.get('/users', authenticateToken, (req, res) => {
  const usersWithoutPasswords = users.map(({ password, ...user }) => user);
  res.json(usersWithoutPasswords);
});

app.get('/users/:id', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.put('/users/:id', authenticateToken, (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  users[userIndex] = {
    ...users[userIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  const { password: _, ...userWithoutPassword } = users[userIndex];
  res.json(userWithoutPassword);
});

app.delete('/users/:id', authenticateToken, (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  users.splice(userIndex, 1);
  res.json({ message: 'User deleted successfully' });
});

// ============================================
// PROPERTIES ROUTES
// ============================================

app.post('/properties', authenticateToken, (req, res) => {
  const property = {
    id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: req.user.userId,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  properties.push(property);
  res.status(201).json(property);
});

app.get('/properties', authenticateToken, (req, res) => {
  const userProperties = properties.filter(p => p.userId === req.user.userId);
  res.json(userProperties);
});

app.get('/properties/:id', authenticateToken, (req, res) => {
  const property = properties.find(p => p.id === req.params.id);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }

  res.json(property);
});

app.put('/properties/:id', authenticateToken, (req, res) => {
  const propertyIndex = properties.findIndex(p => p.id === req.params.id);
  if (propertyIndex === -1) {
    return res.status(404).json({ message: 'Property not found' });
  }

  properties[propertyIndex] = {
    ...properties[propertyIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  res.json(properties[propertyIndex]);
});

app.delete('/properties/:id', authenticateToken, (req, res) => {
  const propertyIndex = properties.findIndex(p => p.id === req.params.id);
  if (propertyIndex === -1) {
    return res.status(404).json({ message: 'Property not found' });
  }

  properties.splice(propertyIndex, 1);
  res.json({ message: 'Property deleted successfully' });
});

// ============================================
// PROSPECTS ROUTES
// ============================================

app.post('/prospects', authenticateToken, (req, res) => {
  const prospect = {
    id: `pros_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: req.user.userId,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  prospects.push(prospect);
  res.status(201).json(prospect);
});

app.get('/prospects', authenticateToken, (req, res) => {
  const userProspects = prospects.filter(p => p.userId === req.user.userId);
  res.json(userProspects);
});

app.get('/prospects/:id', authenticateToken, (req, res) => {
  const prospect = prospects.find(p => p.id === req.params.id);
  if (!prospect) {
    return res.status(404).json({ message: 'Prospect not found' });
  }

  res.json(prospect);
});

app.put('/prospects/:id', authenticateToken, (req, res) => {
  const prospectIndex = prospects.findIndex(p => p.id === req.params.id);
  if (prospectIndex === -1) {
    return res.status(404).json({ message: 'Prospect not found' });
  }

  prospects[prospectIndex] = {
    ...prospects[prospectIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  res.json(prospects[prospectIndex]);
});

app.delete('/prospects/:id', authenticateToken, (req, res) => {
  const prospectIndex = prospects.findIndex(p => p.id === req.params.id);
  if (prospectIndex === -1) {
    return res.status(404).json({ message: 'Prospect not found' });
  }

  prospects.splice(prospectIndex, 1);
  res.json({ message: 'Prospect deleted successfully' });
});

// ============================================
// DASHBOARD ROUTES
// ============================================

app.get('/dashboard/stats', authenticateToken, (req, res) => {
  res.json({
    totalProperties: properties.filter(p => p.userId === req.user.userId).length,
    totalProspects: prospects.filter(p => p.userId === req.user.userId).length,
    totalUsers: users.length,
    activeProperties: properties.filter(p => p.userId === req.user.userId && p.status === 'available').length
  });
});

app.get('/dashboard/charts', authenticateToken, (req, res) => {
  res.json({
    propertyTrends: [
      { month: 'Jan', count: 10 },
      { month: 'Feb', count: 15 },
      { month: 'Mar', count: 20 }
    ],
    prospectTrends: [
      { month: 'Jan', count: 5 },
      { month: 'Feb', count: 12 },
      { month: 'Mar', count: 18 }
    ]
  });
});

app.get('/dashboard/activities', authenticateToken, (req, res) => {
  res.json([
    { id: 1, type: 'property_created', message: 'New property added', timestamp: new Date().toISOString() },
    { id: 2, type: 'prospect_added', message: 'New prospect registered', timestamp: new Date().toISOString() }
  ]);
});

app.get('/dashboard/top-performers', authenticateToken, (req, res) => {
  res.json({
    topProperties: properties.slice(0, 5),
    topProspects: prospects.slice(0, 5)
  });
});

app.get('/dashboard/alerts', authenticateToken, (req, res) => {
  res.json([
    { id: 1, type: 'info', message: 'You have 3 pending appointments', priority: 'medium' },
    { id: 2, type: 'warning', message: 'Property listing expires soon', priority: 'high' }
  ]);
});

// ============================================
// ROOT ROUTE
// ============================================

app.get('/', (req, res) => {
  res.json({
    message: 'CRM Immobilier Mock API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/auth/*',
      users: '/users/*',
      properties: '/properties/*',
      prospects: '/prospects/*',
      dashboard: '/dashboard/*'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Mock API Server running on http://localhost:${PORT}`);
  console.log(`\n📚 Available endpoints:`);
  console.log(`   - POST   /auth/register`);
  console.log(`   - POST   /auth/login`);
  console.log(`   - GET    /auth/me`);
  console.log(`   - GET    /users`);
  console.log(`   - GET    /properties`);
  console.log(`   - GET    /prospects`);
  console.log(`   - GET    /dashboard/stats`);
  console.log(`\n✅ Server ready for testing!\n`);
});
