import session from 'express-session';
import MongoStore from 'connect-mongo';

/**
 * Configures Express session middleware with MongoDB as the session store.
 * Sessions are stored in the same MongoDB Atlas cluster — no extra service needed.
 *
 * @returns {import('express-session').RequestHandler} Express session middleware
 */
export function createSession() {
  return session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      dbName: 'devhive',
      collectionName: 'sessions',
      ttl: 14 * 24 * 60 * 60, // 14 days in seconds
      autoRemove: 'native',
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
    },
  });
}