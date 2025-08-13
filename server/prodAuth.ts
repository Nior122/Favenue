// Production authentication bypass for Vercel
// Since Replit Auth only works on Replit domains, we bypass it for production

export function setupProdAuth(app: any) {
  // Bypass authentication in production
  app.get("/api/login", (req: any, res: any) => {
    res.json({ message: "Authentication disabled in production" });
  });

  app.get("/api/logout", (req: any, res: any) => {
    res.json({ message: "Authentication disabled in production" });
  });

  app.get("/api/callback", (req: any, res: any) => {
    res.redirect("/");
  });
}

// Mock authentication middleware for production
export const isAuthenticated = (req: any, res: any, next: any) => {
  // In production, we bypass auth and create a mock user
  req.user = {
    claims: {
      sub: "prod-user",
      email: "user@example.com",
      first_name: "Demo",
      last_name: "User",
      isAdmin: false
    }
  };
  req.isAuthenticated = () => true;
  next();
};

export const isAdmin = (req: any, res: any, next: any) => {
  // For demo purposes, allow admin access in production
  req.user = {
    claims: {
      sub: "admin-user", 
      email: "admin@example.com",
      first_name: "Admin",
      last_name: "User",
      isAdmin: true
    }
  };
  req.isAuthenticated = () => true;
  next();
};