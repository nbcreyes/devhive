/**
 * Exchanges a GitHub OAuth code for an access token.
 * @param {string} code - The OAuth code from the callback
 * @returns {Promise<string>} GitHub access token
 */
export async function exchangeCodeForToken(code) {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error_description || 'Failed to exchange GitHub code for token');
  }

  return data.access_token;
}

/**
 * Fetches the authenticated GitHub user's profile.
 * @param {string} accessToken - GitHub access token
 * @returns {Promise<object>} GitHub user profile
 */
export async function getGithubUser(accessToken) {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub user profile');
  }

  return response.json();
}

/**
 * Fetches recent commits from a GitHub repository.
 * @param {string} accessToken - GitHub access token
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<object[]>} List of commits
 */
export async function getRepoCommits(accessToken, owner, repo) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch commits');
  }

  return response.json();
}

/**
 * Fetches open pull requests from a GitHub repository.
 * @param {string} accessToken - GitHub access token
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<object[]>} List of pull requests
 */
export async function getRepoPullRequests(accessToken, owner, repo) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=10`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch pull requests');
  }

  return response.json();
}

/**
 * Fetches open issues from a GitHub repository.
 * @param {string} accessToken - GitHub access token
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<object[]>} List of issues
 */
export async function getRepoIssues(accessToken, owner, repo) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=10`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch issues');
  }

  return response.json();
}