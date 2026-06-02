// Set required env vars before any module is loaded
process.env.AUTH_SECRET = 'test_secret_that_is_at_least_32_characters_long!!';
process.env.ENCRYPTION_KEY = 'test_encryption_key_exactly_32ch';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DATABASE_URL = 'mongodb://localhost:27017/test';
