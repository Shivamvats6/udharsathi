import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { loginSchema } from "../validators/schemas";

export function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const { email, password } = parsed.data;
  if (email !== env.DEMO_LOGIN_EMAIL || password !== env.DEMO_LOGIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const token = jwt.sign({ email }, env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { email } });
}

// Placeholder for real "Login with Google" (OAuth) - see docs/GOOGLE_SETUP.md.
// Returns the URL the frontend should redirect to.
export function googleOAuthUrl(_req: Request, res: Response) {
  if (!env.GOOGLE_OAUTH_CLIENT_ID) {
    return res.status(400).json({ error: "Google OAuth is not configured on the server yet." });
  }
  const params = new URLSearchParams({
    client_id: env.GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: env.GOOGLE_OAUTH_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });
  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
}
