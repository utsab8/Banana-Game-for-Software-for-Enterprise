/**
 * ==============================================================================
 * CIS046-3 Software For Enterprise — Assignment 1: Banana Challenge Enterprise System
 * ==============================================================================
 * THEME 3: INTEROPERABILITY SERVICE & FAULT-TOLERANT GATEWAY
 *
 * ACADEMIC ATTRIBUTION & THIRD-PARTY DISCLOSURE:
 * - Upstream Service: Dr. Marc Conrad's Banana API Service (University of Bedfordshire)
 * - Documentation: https://marcconrad.com/uob/banana/doc.php
 * - Endpoint: https://marcconrad.com/uob/banana/api.php?out=json
 *
 * Demonstrates:
 * 1. Server-side REST API consumption with JSON marshaling
 * 2. 5-second AbortController timeout boundary (Graceful degradation)
 * 3. Procedural SVG offline fallback generator (Zero-crash resilience)
 * ==============================================================================
 */

const BANANA_API_URL = 'https://marcconrad.com/uob/banana/api.php?out=json';
const API_TIMEOUT_MS = 5000; // 5-second timeout boundary

// Procedural SVG Fallback Puzzles (Used if third-party API is slow or unreachable)
const FALLBACK_PUZZLES = [
  {
    solution: 6,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="240" viewBox="0 0 600 240">
      <rect width="100%" height="100%" fill="#1e293b" rx="12"/>
      <text x="300" y="55" fill="#facc15" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">OFFLINE RESILIENCE PUZZLE</text>
      <text x="300" y="115" fill="#f8fafc" font-size="28" font-family="monospace" text-anchor="middle">🍌 + 🍌 + 🍌 = 18</text>
      <text x="300" y="170" fill="#f8fafc" font-size="28" font-family="monospace" text-anchor="middle">🍌 × 1 = ?</text>
    </svg>`
  },
  {
    solution: 4,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="240" viewBox="0 0 600 240">
      <rect width="100%" height="100%" fill="#1e293b" rx="12"/>
      <text x="300" y="55" fill="#facc15" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">OFFLINE RESILIENCE PUZZLE</text>
      <text x="300" y="115" fill="#f8fafc" font-size="28" font-family="monospace" text-anchor="middle">🍌 + 🍌 = 8</text>
      <text x="300" y="170" fill="#f8fafc" font-size="28" font-family="monospace" text-anchor="middle">🍌 = ?</text>
    </svg>`
  },
  {
    solution: 7,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="240" viewBox="0 0 600 240">
      <rect width="100%" height="100%" fill="#1e293b" rx="12"/>
      <text x="300" y="55" fill="#facc15" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">OFFLINE RESILIENCE PUZZLE</text>
      <text x="300" y="115" fill="#f8fafc" font-size="28" font-family="monospace" text-anchor="middle">🍌 + 3 = 10</text>
      <text x="300" y="170" fill="#f8fafc" font-size="28" font-family="monospace" text-anchor="middle">🍌 = ?</text>
    </svg>`
  }
];

/**
 * Fetches algebraic puzzle from Dr. Marc Conrad's external Banana API service
 * Implements AbortController timeout & automatic fallback degradation
 * @returns {Promise<{ question: string, solution: number, isFallback: boolean }>}
 */
async function fetchBananaPuzzle() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(BANANA_API_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Banana API HTTP Status Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.question || data.solution === undefined) {
      throw new Error('Malformed Banana API response structure');
    }

    return {
      question: data.question,
      solution: parseInt(data.solution, 10),
      isFallback: false
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('[Interoperability Warning] Upstream Banana API error. Engaging fallback:', error.message);

    // Pick random procedural SVG puzzle
    const fallback = FALLBACK_PUZZLES[Math.floor(Math.random() * FALLBACK_PUZZLES.length)];
    const base64Svg = Buffer.from(fallback.svg).toString('base64');

    return {
      question: `data:image/svg+xml;base64,${base64Svg}`,
      solution: fallback.solution,
      isFallback: true
    };
  }
}

module.exports = {
  fetchBananaPuzzle,
  FALLBACK_PUZZLES,
  BANANA_API_URL,
  API_TIMEOUT_MS
};

