const bcrypt = require('bcryptjs');
const createResourceController = require('./resourceController');

module.exports = createResourceController({
  table: 'users',
  fields: {
    full_name: 'full_name',
    email: 'email',
    password: 'password_hash',
    phone: 'phone',
    address: 'address',
    role: 'role'
  },
  requiredFields: ['full_name', 'email', 'password'],
  returning: ['id', 'full_name', 'email', 'phone', 'address', 'role', 'created_at'],
  prepare: async (input) => {
    const prepared = { ...input };
    if (prepared.password !== undefined) {
      prepared.password = await bcrypt.hash(prepared.password, 12);
    }
    return prepared;
  }
});
