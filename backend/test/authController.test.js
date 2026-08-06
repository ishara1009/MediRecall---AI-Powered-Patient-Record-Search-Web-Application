const test = require('node:test');
const assert = require('node:assert/strict');

const authController = require('../src/controllers/authController');
const User = require('../src/models/User');

function createRes() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

test('setupAdmin handles missing next without crashing', async () => {
  const originalFindOne = User.findOne;
  User.findOne = async () => {
    throw new Error('Database failure');
  };

  try {
    const req = {
      body: {
        fullName: 'Test Admin',
        email: 'admin@example.com',
        phoneNumber: '1234567890',
        employeeId: 'EMP-001',
        password: 'Password1!',
        confirmPassword: 'Password1!'
      },
      file: null
    };

    const res = createRes();

    const result = await authController.setupAdmin(req, res);

    assert.equal(result, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.payload.success, false);
    assert.match(res.payload.message, /Failed to register administrator/i);
  } finally {
    User.findOne = originalFindOne;
  }
});
