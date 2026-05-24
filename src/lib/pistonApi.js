const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute'

// Known stable versions for Piston API v2
const LANGUAGE_VERSIONS = {
  javascript: '18.15.0',
  python: '3.10.0',
  rust: '1.68.2',
  go: '1.16.2',
  cpp: '10.2.0',
  java: '15.0.2',
  typescript: '5.0.3'
}

/**
 * Execute code using the Piston API
 * @param {string} language - e.g. 'javascript', 'python'
 * @param {string} code - The source code to execute
 * @returns {Promise<{run: {output: string, stdout: string, stderr: string}}>}
 */
export async function executeCode(language, code) {
  if (!LANGUAGE_VERSIONS[language]) {
    return {
      run: {
        output: `Language '${language}' is currently not supported by the live execution sandbox.`,
        stderr: `Language '${language}' is not supported.`
      }
    }
  }

  try {
    const response = await fetch(PISTON_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        language: language,
        version: LANGUAGE_VERSIONS[language],
        files: [
          {
            content: code
          }
        ],
        // Optional: you can set stdin or compile arguments here
      })
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Code execution failed:', error)
    return {
      run: {
        output: '',
        stderr: 'Execution Sandbox Error: Failed to connect to code execution server. Please try again or check your network.'
      }
    }
  }
}
