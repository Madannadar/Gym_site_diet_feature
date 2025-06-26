import passport from "passport";
import db from "./db.js";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import * as authModel from "../model/auth.model.js";
import * as tokenService from "../services/token.service.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `http://localhost:${process.env.PORT}/api/auth/google/callback`,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await authModel.getUserByEmail(profile.email);
        if (!user) {
          user = await authModel.createUser({
            email: profile.email,
            password: "",
            firstName:
              profile.given_name || profile.displayName.split(" ")[0] || "",
            lastName:
              profile.family_name || profile.displayName.split(" ")[1] || "",
            googleId: profile.id,
          });
          await authModel.markUserEmailVerified(user.id); // Google verifies emails
        } else if (!user.google_id) {
          // Link Google ID to existing user if not already linked
          await db.query("UPDATE users SET google_id = $1 WHERE id = $2", [
            profile.id,
            user.id,
          ]);
          user.google_id = profile.id;
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await authModel.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
