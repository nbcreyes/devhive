import User from "../models/User.js";
import redis from "../config/redis.js";
import {
  exchangeCodeForToken,
  getGithubUser,
  getRepoCommits,
  getRepoPullRequests,
  getRepoIssues,
} from "../services/github.js";

/**
 * GET /api/github/authorize
 * Redirects the user to GitHub OAuth authorization page.
 */
export async function authorize(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    scope: "read:user repo",
    redirect_uri: `${req.protocol}://${req.get("host")}/api/github/callback`,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
}

/**
 * GET /api/github/callback
 * Handles the GitHub OAuth callback and connects the account to the user.
 */
export async function callback(req, res, next) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(
        `${process.env.CLIENT_URL}/settings?error=github_failed`,
      );
    }

    if (!req.session.userId) {
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=session_expired`,
      );
    }

    const accessToken = await exchangeCodeForToken(code);
    const githubUser = await getGithubUser(accessToken);

    await User.findByIdAndUpdate(req.session.userId, {
      githubId: githubUser.id.toString(),
      githubUsername: githubUser.login,
    });

    await redis.set(`github:token:${req.session.userId}`, accessToken, {
      ex: 30 * 24 * 60 * 60,
    });

    res.redirect(`${process.env.CLIENT_URL}/settings?github=connected`);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/github/repos/:owner/:repo/feed
 * Returns a combined feed of commits, PRs, and issues for a repository.
 */
export async function getRepoFeed(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const userId = req.session.userId;

    const accessToken = await redis.get(`github:token:${userId}`);
    if (!accessToken) {
      return res.status(401).json({ error: "GitHub account not connected" });
    }

    const [commits, pullRequests, issues] = await Promise.all([
      getRepoCommits(accessToken, owner, repo),
      getRepoPullRequests(accessToken, owner, repo),
      getRepoIssues(accessToken, owner, repo),
    ]);

    const feed = [
      ...commits.map((c) => ({
        type: "commit",
        id: c.sha,
        title: c.commit.message.split("\n")[0],
        author: c.commit.author.name,
        url: c.html_url,
        createdAt: c.commit.author.date,
      })),
      ...pullRequests.map((pr) => ({
        type: "pull_request",
        id: pr.id,
        title: pr.title,
        author: pr.user.login,
        url: pr.html_url,
        state: pr.state,
        createdAt: pr.created_at,
      })),
      ...issues
        .filter((i) => !i.pull_request)
        .map((i) => ({
          type: "issue",
          id: i.id,
          title: i.title,
          author: i.user.login,
          url: i.html_url,
          state: i.state,
          createdAt: i.created_at,
        })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ feed });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/github/status
 * Returns whether the current user has connected their GitHub account.
 */
export async function getGithubStatus(req, res, next) {
  try {
    const user = await User.findById(req.session.userId).select(
      "githubUsername githubId",
    );

    res.json({
      connected: !!user.githubId,
      username: user.githubUsername,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/github/disconnect
 * Disconnects the GitHub account from the current user.
 */
export async function disconnectGithub(req, res, next) {
  try {
    await User.findByIdAndUpdate(req.session.userId, {
      githubId: null,
      githubUsername: null,
    });

    await redis.del(`github:token:${req.session.userId}`);

    res.json({ message: "GitHub account disconnected successfully" });
  } catch (err) {
    next(err);
  }
}
