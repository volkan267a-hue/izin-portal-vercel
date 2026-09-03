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

    const { new_password } = getBody(req);
    if (!new_password || String(new_password).length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı.' });
    }

    const db = admin.firestore(app);
    const snap = await db.collection('profiles').where('role', '==', 'employee').get();

    const results = [];
    for (const doc of snap.docs) {
      const data = doc.data();
      try {
        await admin.auth(app).updateUser(doc.id, { password: new_password });
        results.push({ registry_number: data.registryNumber, success: true });
      } catch (err) {
        results.push({ registry_number: data.registryNumber, success: false, error: err.message || 'Bilinmeyen hata' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return res.status(200).json({ success: true, total: results.length, successCount, results });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Beklenmeyen hata' });
  }
};
