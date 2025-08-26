function isAdmin(user) {
  return user?.role === 'admin';
}

module.exports = isAdmin;
