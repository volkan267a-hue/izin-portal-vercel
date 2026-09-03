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

    const { uid } = getBody(req);
    if (!uid) return res.status(400).json({ error: 'uid eksik.' });

    const db = admin.firestore(app);
    const profileSnap = await db.collection('profiles').doc(uid).get();
    const registryNumber = profileSnap.exists ? profileSnap.data().registryNumber : null;

    await admin.auth(app).deleteUser(uid).catch(() => {});
    await db.collection('profiles').doc(uid).delete();
    if (registryNumber) {
      await db.collection('registryLookup').doc(registryNumber).delete();
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Beklenmeyen hata' });
  }
};
