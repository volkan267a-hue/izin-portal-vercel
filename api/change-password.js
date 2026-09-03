const admin = require('firebase-admin');
const { getAdminApp, setCors, getBody, requireAdmin } = require('./_shared');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Yalnızca POST kabul edilir.' });

  try {
    const app = getAdminApp();
    const authCheck = await requireAdmin(req, app);
    if (authCheck.error) return res.status(authCheck.error.statusCode).json({ error: authCheck.error.body });

    const { uid, new_password } = getBody(req);
    if (!uid || !new_password) return res.status(400).json({ error: 'uid ve yeni şifre gerekli.' });
    if (String(new_password).length < 6) return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı.' });

    await admin.auth(app).updateUser(uid, { password: new_password });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Beklenmeyen hata' });
  }
};
