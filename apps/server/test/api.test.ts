import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { LearningEvent, Preferences } from '../../../packages/core/src';
import { createApp } from '../src/app';
import { hashPassword, verifyPassword } from '../src/security';
import type { Repository, User } from '../src/repository';
/** Test adapter only. Production always uses PostgreSQL through prismaRepository. */
class MemoryRepo implements Repository {
  users = new Map<string, User>();
  sessions = new Map<string, { id: string; expires: Date }>();
  resets = new Map<string, { id: string; expires: Date }>();
  events = new Map<string, LearningEvent[]>();
  async findUser(email: string) {
    return [...this.users.values()].find((u) => u.email === email) ?? null;
  }
  async getUser(id: string) {
    return this.users.get(id) ?? null;
  }
  async createUser(u: Omit<User, 'id'>) {
    assert.equal('password' in u, false, 'repository must never receive a raw password field');
    const user = { ...u, id: randomUUID() };
    this.users.set(user.id, user);
    return user;
  }
  async preferences(id: string, p: Preferences) {
    this.users.get(id)!.preferences = p;
  }
  async createSession(hash: string, id: string, expires: Date) {
    this.sessions.set(hash, { id, expires });
  }
  async session(hash: string) {
    const s = this.sessions.get(hash);
    return s && s.expires > new Date() ? (this.users.get(s.id) ?? null) : null;
  }
  async revoke(hash: string) {
    this.sessions.delete(hash);
  }
  async createReset(hash: string, id: string, expires: Date) {
    // Match prismaRepository: a new request replaces all prior tokens.
    for (const [k, r] of this.resets) if (r.id === id) this.resets.delete(k);
    this.resets.set(hash, { id, expires });
  }
  async deleteResets(id: string) {
    for (const [k, r] of this.resets) if (r.id === id) this.resets.delete(k);
  }
  async resetPassword(hash: string, passwordHash: string) {
    const r = this.resets.get(hash);
    if (!r || r.expires < new Date()) return false;
    this.resets.delete(hash);
    this.users.get(r.id)!.passwordHash = passwordHash;
    for (const [k, s] of this.sessions) if (s.id === r.id) this.sessions.delete(k);
    return true;
  }
  async deleteUser(id: string) {
    this.users.delete(id);
    this.events.delete(id);
    for (const [k, s] of this.sessions) if (s.id === id) this.sessions.delete(k);
  }
  async sync(id: string, events: LearningEvent[]) {
    const map = new Map((this.events.get(id) ?? []).map((e) => [e.id, e]));
    for (const e of events) {
      if (map.has(e.id) && JSON.stringify(map.get(e.id)) !== JSON.stringify(e))
        throw Object.assign(new Error('conflict'), { status: 409, code: 'EVENT_CONFLICT' });
      map.set(e.id, e);
    }
    const list = [...map.values()];
    this.events.set(id, list);
    return list;
  }
}
const register = (app: ReturnType<typeof createApp>, email = 'learner@example.com') =>
  request(app)
    .post('/auth/register')
    .send({ email, name: 'Learner', password: 'A-long-test-password-123' });
test('password hashing is salted and rejects incorrect passwords', async () => {
  const a = await hashPassword('secret123456'),
    b = await hashPassword('secret123456');
  assert.notEqual(a, b);
  assert.equal(await verifyPassword('secret123456', a), true);
  assert.equal(await verifyPassword('wrong', a), false);
  assert.equal(a.includes('secret'), false);
});
test('development CORS allows both local preview origins without allowing arbitrary origins', async () => {
  const app = createApp(new MemoryRepo());
  for (const origin of ['http://localhost:8081', 'http://127.0.0.1:8081']) {
    const response = await request(app).get('/health').set('Origin', origin).expect(200);
    assert.equal(response.headers['access-control-allow-origin'], origin);
  }
  const denied = await request(app)
    .get('/health')
    .set('Origin', 'https://untrusted.example')
    .expect(200);
  assert.equal(denied.headers['access-control-allow-origin'], undefined);
});
test('register, restore, protected access and logout revoke the session', async () => {
  const repo = new MemoryRepo(),
    app = createApp(repo);
  await request(app).get('/me').expect(401);
  const res = await register(app);
  assert.equal(res.status, 201);
  assert.equal(res.body.user.passwordHash, undefined);
  const token = res.body.token as string;
  assert.ok(token.length > 40);
  assert.ok(![...repo.sessions.keys()].includes(token));
  await request(app).get('/me').auth(token, { type: 'bearer' }).expect(200);
  await request(app).post('/auth/logout').auth(token, { type: 'bearer' }).send({}).expect(200);
  await request(app).get('/me').auth(token, { type: 'bearer' }).expect(401);
});
test('validation, duplicate registration and incorrect login produce specific errors', async () => {
  const app = createApp(new MemoryRepo());
  await request(app)
    .post('/auth/register')
    .send({ email: 'bad', password: 'a', name: '' })
    .expect(400);
  await register(app).expect(201);
  await register(app).expect(409);
  await request(app)
    .post('/auth/login')
    .send({ email: 'learner@example.com', password: 'incorrect-password' })
    .expect(401);
  await request(app)
    .post('/auth/login')
    .send({ email: 'learner@example.com', password: 'A-long-test-password-123' })
    .expect(200);
});
test('sync is idempotent, isolated by user, validates payloads and rejects changed event IDs', async () => {
  const app = createApp(new MemoryRepo());
  const a = (await register(app, 'a@example.com')).body.token as string,
    b = (await register(app, 'b@example.com')).body.token as string;
  const e: LearningEvent = {
    id: randomUUID(),
    at: new Date().toISOString(),
    type: 'answer',
    itemId: 'v1',
    correct: false,
    quality: 1,
  };
  for (let i = 0; i < 2; i++) {
    const res = await request(app)
      .post('/sync')
      .auth(a, { type: 'bearer' })
      .send({ events: [e] })
      .expect(200);
    assert.equal(res.body.events.length, 1);
  }
  const empty = await request(app)
    .post('/sync')
    .auth(b, { type: 'bearer' })
    .send({ events: [] })
    .expect(200);
  assert.deepEqual(empty.body.events, []);
  await request(app)
    .post('/sync')
    .auth(a, { type: 'bearer' })
    .send({ events: [{ ...e, correct: true }] })
    .expect(409);
  await request(app)
    .post('/sync')
    .auth(a, { type: 'bearer' })
    .send({ events: [{}] })
    .expect(400);
  await request(app)
    .post('/sync')
    .auth(a, { type: 'bearer' })
    .send({
      events: [{ ...e, id: randomUUID(), at: new Date(Date.now() + 3600000).toISOString() }],
    })
    .expect(400);
});
test('missing email and tutor integrations never return fake success', async () => {
  const app = createApp(new MemoryRepo());
  const token = (await register(app)).body.token as string;
  const reset = await request(app)
    .post('/auth/reset-request')
    .send({ email: 'learner@example.com' })
    .expect(503);
  assert.equal(reset.body.error, 'EMAIL_NOT_CONFIGURED');
  const tutor = await request(app)
    .post('/tutor')
    .auth(token, { type: 'bearer' })
    .send({ message: 'What is 是?', locale: 'en', level: 1 })
    .expect(503);
  assert.equal(tutor.body.error, 'TUTOR_NOT_CONFIGURED');
});
test('email reset tokens are single-use and revoke all existing sessions', async () => {
  let delivered = '';
  const repo = new MemoryRepo(),
    app = createApp(repo, {
      email: {
        async sendReset(_to, token) {
          delivered = token;
        },
      },
    });
  const token = (await register(app)).body.token as string;
  await request(app).post('/auth/reset-request').send({ email: 'learner@example.com' }).expect(200);
  assert.equal(delivered.length, 43);
  assert.equal(repo.resets.has(delivered), false);
  await request(app)
    .post('/auth/reset')
    .send({ token: delivered, password: 'new-password-1234' })
    .expect(200);
  await request(app).get('/me').auth(token, { type: 'bearer' }).expect(401);
  await request(app)
    .post('/auth/reset')
    .send({ token: delivered, password: 'other-password-1234' })
    .expect(400);
  await request(app)
    .post('/auth/login')
    .send({ email: 'learner@example.com', password: 'new-password-1234' })
    .expect(200);
});
test('account deletion reauthenticates and removes user records and sessions', async () => {
  const repo = new MemoryRepo(),
    app = createApp(repo);
  const token = (await register(app)).body.token as string;
  await request(app)
    .delete('/me')
    .auth(token, { type: 'bearer' })
    .send({ password: 'wrong' })
    .expect(401);
  await request(app)
    .delete('/me')
    .auth(token, { type: 'bearer' })
    .send({ password: 'A-long-test-password-123' })
    .expect(200);
  assert.equal(repo.users.size, 0);
  await request(app).get('/me').auth(token, { type: 'bearer' }).expect(401);
});
test('provider response is labeled generated and receives requested locale and level', async () => {
  const app = createApp(new MemoryRepo(), {
    tutor: {
      async reply(message, locale, level) {
        assert.equal(locale, 'ar');
        assert.equal(level, 9);
        assert.equal(message, 'Explain 地');
        return 'Example explanation';
      },
    },
  });
  const token = (await register(app)).body.token as string;
  const response = await request(app)
    .post('/tutor')
    .auth(token, { type: 'bearer' })
    .send({ message: 'Explain 地', locale: 'ar', level: 9 })
    .expect(200);
  assert.equal(response.body.generated, true);
});
test('failed reset email delivery leaves no usable reset token', async () => {
  let captured = '';
  const repo = new MemoryRepo(),
    app = createApp(repo, {
      email: {
        async sendReset(_to, token) {
          captured = token;
          throw new Error('webhook unreachable');
        },
      },
    });
  await register(app);
  await request(app).post('/auth/reset-request').send({ email: 'learner@example.com' }).expect(500);
  assert.equal(captured.length, 43);
  assert.equal(repo.resets.size, 0);
  await request(app)
    .post('/auth/reset')
    .send({ token: captured, password: 'new-password-1234' })
    .expect(400);
});
test('a second reset request replaces the first token', async () => {
  const delivered: string[] = [];
  const app = createApp(new MemoryRepo(), {
    email: {
      async sendReset(_to, token) {
        delivered.push(token);
      },
    },
  });
  await register(app);
  await request(app).post('/auth/reset-request').send({ email: 'learner@example.com' }).expect(200);
  await request(app).post('/auth/reset-request').send({ email: 'learner@example.com' }).expect(200);
  assert.equal(delivered.length, 2);
  await request(app)
    .post('/auth/reset')
    .send({ token: delivered[0], password: 'new-password-1234' })
    .expect(400);
  await request(app)
    .post('/auth/reset')
    .send({ token: delivered[1], password: 'new-password-1234' })
    .expect(200);
});
