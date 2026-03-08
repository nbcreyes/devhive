import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import { sendVerificationEmail } from '../services/email.js';

/**
 * POST /api/auth/register
 * Creates a new user and sends a verification email.
 */
export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = uuidv4();

    await User.create({
      username,
      email,
      password: hashedPassword,
      displayName: username,
      verificationToken,
    });

    await sendVerificationEmail({
      to: email,
      toName: username,
      token: verificationToken,
    });

    res.status(201).json({
      message: 'Account created. Please check your email to verify your account.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Logs in a user and creates a session.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Please verify your email before logging in' });
    }

    await User.findByIdAndUpdate(user._id, {
      status: 'online',
      lastSeen: new Date(),
    });

    req.session.userId = user._id.toString();

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Destroys the session and logs the user out.
 */
export async function logout(req, res, next) {
  try {
    if (req.session.userId) {
      await User.findByIdAndUpdate(req.session.userId, {
        status: 'offline',
        lastSeen: new Date(),
      });
    }

    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Returns the currently logged in user from the session.
 */
export async function getMe(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId).select('-password -verificationToken');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/verify-email
 * Verifies a user's email using the token sent in the verification email.
 */
export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    await User.findByIdAndUpdate(user._id, {
      isVerified: true,
      verificationToken: null,
    });

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
}