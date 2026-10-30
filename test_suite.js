const http = require('http');
const app = require('./server');
const db = require('./database');

async function runTestSuite() {
  console.log('🧪 Starting Enterprise Banana Challenge Comprehensive Test Suite...\n');

  await db.initDatabase();

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(4005, resolve));
  const baseUrl = 'http://localhost:4005';

  let sessionCookie = '';

  async function req(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {})
    };
    if (sessionCookie) {
      headers['Cookie'] = sessionCookie;
    }

    const res = await fetch(baseUrl + url, {
      ...options,
      headers
    });

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      sessionCookie = setCookie.split(';')[0];
    }

    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  try {
    // 1. Test unauthenticated /me
    console.log('1. Testing unauthenticated /api/auth/me...');
    let res = await req('/api/auth/me');
    if (res.data.authenticated !== false) throw new Error('Expected authenticated: false');
    console.log('   ✅ Unauthenticated /me returned false as expected.');

    // 2. Test registration
    const testUser = `TestPlayer_${Date.now()}`;
    const testEmail = `${testUser.toLowerCase()}@test.com`;
    console.log(`2. Testing registration with username ${testUser}...`);
    res = await req('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: testUser,
        email: testEmail,
        password: 'password123'
      })
    });
    if (!res.ok || !res.data.success) throw new Error('Registration failed: ' + JSON.stringify(res.data));
    console.log('   ✅ Registration successful! Virtual identity created in SQLite.');

    // 3. Test /me when authenticated
    console.log('3. Testing authenticated /api/auth/me...');
    res = await req('/api/auth/me');
    if (!res.data.authenticated || res.data.user.username !== testUser) {
      throw new Error('Expected authenticated: true with correct username');
    }
    console.log(`   ✅ Session verified: Logged in as ${res.data.user.username}.`);

    // 4. Test duplicate registration rejection
    console.log('4. Testing duplicate username conflict rejection...');
    res = await req('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: testUser,
        email: 'other@test.com',
        password: 'password123'
      })
    });
    if (res.status !== 409) throw new Error('Expected 409 Conflict on duplicate username');
    console.log('   ✅ Duplicate username rejected with 409 Conflict.');

    // 5. Test difficulty mode switch
    console.log('5. Testing mode change to "hard"...');
    res = await req('/api/game/mode', {
      method: 'POST',
      body: JSON.stringify({ mode: 'hard' })
    });
    if (!res.ok || res.data.mode !== 'hard') throw new Error('Failed to set hard mode');
    console.log('   ✅ Difficulty mode updated to Hard in session.');

    // 6. Test puzzle retrieval & anti-cheat isolation
    console.log('6. Testing /api/game/new-puzzle & Anti-Cheat Vaulting...');
    res = await req('/api/game/new-puzzle?mode=hard');
    if (!res.ok || !res.data.question) throw new Error('Failed to fetch new puzzle');
    if (res.data.solution !== undefined) {
      throw new Error('SECURITY BREACH: Solution leaked to client in new-puzzle!');
    }
    console.log('   ✅ Puzzle retrieved. Question image URL present, solution strictly VAULTED.');

    // 7. Test answer submission
    console.log('7. Testing answer submission...');
    // We guess 0-9; one of them will trigger response
    res = await req('/api/game/submit-answer', {
      method: 'POST',
      body: JSON.stringify({ answer: 5, mode: 'hard' })
    });
    if (!res.ok || res.data.solution === undefined) {
      throw new Error('Failed to evaluate answer submission: ' + JSON.stringify(res.data));
    }
    console.log(`   ✅ Answer evaluated: Guessed 5, Solution was ${res.data.solution}, Correct: ${res.data.correct}, Points: ${res.data.pointsAwarded}`);

    // 8. Test anti-replay defense
    console.log('8. Testing anti-replay defense (submitting again without new puzzle)...');
    res = await req('/api/game/submit-answer', {
      method: 'POST',
      body: JSON.stringify({ answer: 5, mode: 'hard' })
    });
    if (res.status !== 400 || !res.data.error.includes('No active puzzle')) {
      throw new Error('Anti-replay defense failed: allowed double submission!');
    }
    console.log('   ✅ Anti-replay defense verified: second submission rejected with 400 Bad Request.');

    // 9. Test profile customization
    console.log('9. Testing profile avatar & title update...');
    res = await req('/api/user/profile', {
      method: 'POST',
      body: JSON.stringify({ avatar: '👑', title: 'Monkey Sensei' })
    });
    if (!res.ok || res.data.user.avatar !== '👑' || res.data.user.title !== 'Monkey Sensei') {
      throw new Error('Profile update failed: ' + JSON.stringify(res.data));
    }
    console.log('   ✅ Player profile updated: Avatar set to 👑 and Title set to Monkey Sensei.');

    // 10. Test achievements retrieval
    console.log('10. Testing /api/user/achievements...');
    res = await req('/api/user/achievements');
    if (!res.ok || !Array.isArray(res.data.achievements)) {
      throw new Error('Achievements fetch failed: ' + JSON.stringify(res.data));
    }
    console.log(`   ✅ Achievements retrieved: ${res.data.achievements.length} milestone badges tracked.`);

    // 11. Test leaderboard
    console.log('11. Testing /api/game/leaderboard...');
    res = await req('/api/game/leaderboard');
    if (!res.ok || !Array.isArray(res.data.leaderboard)) {
      throw new Error('Leaderboard fetch failed: ' + JSON.stringify(res.data));
    }
    console.log(`   ✅ Leaderboard retrieved: ${res.data.leaderboard.length} ranked entries found.`);

    // 12. Test history audit trail
    console.log('12. Testing /api/game/history...');
    res = await req('/api/game/history');
    if (!res.ok || !Array.isArray(res.data.history) || res.data.history.length === 0) {
      throw new Error('History audit trail fetch failed: ' + JSON.stringify(res.data));
    }
    console.log(`   ✅ History audit trail verified: Round attempt recorded in SQLite.`);

    // 13. Test reset score
    console.log('13. Testing /api/game/reset...');
    res = await req('/api/game/reset', { method: 'POST' });
    if (!res.ok || res.data.user.score !== 0) {
      throw new Error('Score reset failed: ' + JSON.stringify(res.data));
    }
    console.log('   ✅ Score reset successfully to 0.');

    // 14. Test logout
    console.log('14. Testing /api/auth/logout...');
    res = await req('/api/auth/logout', { method: 'POST' });
    if (!res.ok || !res.data.success) {
      throw new Error('Logout failed: ' + JSON.stringify(res.data));
    }
    console.log('   ✅ Logout successful: Session destroyed.');

    console.log('\n🎉 ALL 14 ENTERPRISE INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
  } finally {
    server.close();
  }
}

runTestSuite().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
