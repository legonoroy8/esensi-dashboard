// Authentication middleware to protect routes
export const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    // User is authenticated
    next();
  } else {
    // User is not authenticated
    res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication required' 
    });
  }
};

// Optional: middleware to check if user is already authenticated
export const isAuthenticated = (req, res, next) => {
  req.isAuthenticated = !!(req.session && req.session.user);
  next();
};
