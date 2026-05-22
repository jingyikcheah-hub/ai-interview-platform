/**
 * Resume parsing utilities for CyberVett
 * Supports PDF text extraction and GitHub profile fetching
 */

/**
 * Extract text content from a PDF file using pdf.js
 */
export async function parsePDF(file) {
  const pdfjsLib = await import('pdfjs-dist')
  
  // Set worker source locally to avoid CORS errors with CDN
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map(item => item.str).join(' ')
    fullText += pageText + '\n'
  }

  return fullText.trim()
}

/**
 * Fetch public GitHub profile and top repositories
 */
export async function fetchGitHubProfile(username) {
  try {
    // Fetch user profile
    const userRes = await fetch(`https://api.github.com/users/${username}`)
    if (!userRes.ok) throw new Error(`GitHub user not found: ${username}`)
    const user = await userRes.json()

    // Fetch top repos sorted by stars
    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?sort=stars&per_page=10&type=owner`
    )
    const repos = await reposRes.json()

    // Build a concise profile summary
    const repoSummaries = repos.map(r => ({
      name: r.name,
      description: r.description || 'No description',
      language: r.language || 'Unknown',
      stars: r.stargazers_count,
      forks: r.forks_count,
    }))

    // Extract language statistics
    const languages = {}
    repos.forEach(r => {
      if (r.language) {
        languages[r.language] = (languages[r.language] || 0) + 1
      }
    })

    const topLanguages = Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang)

    return {
      name: user.name || username,
      bio: user.bio || '',
      company: user.company || '',
      location: user.location || '',
      publicRepos: user.public_repos,
      followers: user.followers,
      topLanguages,
      repos: repoSummaries,
      profileUrl: user.html_url,
      avatarUrl: user.avatar_url,
    }
  } catch (error) {
    console.error('GitHub fetch failed:', error)
    throw error
  }
}

/**
 * Convert GitHub profile data into a context string for AI injection
 */
export function githubProfileToContext(profile) {
  const repoList = profile.repos
    .slice(0, 5)
    .map(r => `  - ${r.name} (${r.language}, ★${r.stars}): ${r.description}`)
    .join('\n')

  return `GitHub Profile: ${profile.name}
Bio: ${profile.bio}
Company: ${profile.company}
Top Languages: ${profile.topLanguages.join(', ')}
Public Repos: ${profile.publicRepos} | Followers: ${profile.followers}
Top Repositories:
${repoList}`
}

/**
 * Extract key skills/keywords from resume text
 */
export function extractSkillTags(text) {
  const skillPatterns = [
    // Languages
    'JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Java', 'C\\+\\+', 'C#', 'Solidity',
    'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'Haskell', 'Elixir',
    // Frontend
    'React', 'Vue', 'Angular', 'Next\\.js', 'Svelte', 'Tailwind', 'CSS', 'HTML',
    // Backend
    'Node\\.js', 'Express', 'FastAPI', 'Django', 'Spring', 'NestJS', 'GraphQL', 'REST',
    // Databases
    'PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'Supabase', 'Firebase', 'DynamoDB',
    // Cloud/DevOps
    'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux',
    // Security
    'Penetration Testing', 'OWASP', 'Burp Suite', 'Metasploit', 'Nmap', 'Wireshark',
    'Cryptography', 'OAuth', 'JWT', 'RBAC', 'Zero Trust',
    // Web3
    'Blockchain', 'Smart Contract', 'Ethereum', 'Sui', 'Solana', 'DeFi', 'NFT',
    'Web3', 'IPFS', 'Hardhat', 'Foundry',
    // AI/ML
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'NLP', 'LLM', 'RAG',
  ]

  const found = new Set()
  skillPatterns.forEach(skill => {
    const regex = new RegExp(`\\b${skill}\\b`, 'gi')
    if (regex.test(text)) {
      found.add(skill.replace(/\\\+/g, '+').replace(/\\./g, '.'))
    }
  })

  return Array.from(found)
}
