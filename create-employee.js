const admin = require('firebase-admin');
const { getAdminApp, toEmailLocalPart, AUTH_EMAIL_DOMAIN, setCors, getBody, requireAdmin } = require('./_shared');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Yalnızca POST kabul edilir.' });

  try {
    const app = getAdminApp();
    const authCheck = await requireAdmin(req, app);
    if (authCheck.error) return res.status(authCheck.error.statusCode).json({ error: authCheck.error.body });

    const body = getBody(req);
    const {
      registry_number,
      password,
      first_name,
      last_name,
      department,
      role,
      annual_leave_total,
      flexible_hours_start,
      flexible_hours_end,
      flexible_work_note,
      flex_time_balance,
      deducted_hours_balance
    } = body;

    if (!registry_number || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Zorunlu alanlar eksik (sicil no, şifre, ad, soyad).' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı.' });
    }

    const registryNumber = String(registry_number).trim();
    const localPart = toEmailLocalPart(registryNumber);
    if (!localPart) return res.status(400).json({ error: 'Geçersiz sicil numarası.' });
    const technicalEmail = `${localPart}@${AUTH_EMAIL_DOMAIN}`;

    const db = admin.firestore(app);
    const lookupRef = db.collection('registryLookup').doc(registryNumber);
    const existing = await lookupRef.get();
    if (existing.exists) return res.status(400).json({ error: 'Bu sicil numarası zaten kullanımda.' });

    const userRecord = await admin.auth(app).createUser({
      email: technicalEmail,
      password,
      emailVerified: true
    });

    const profile = {
      registryNumber,
      email: technicalEmail,
      firstName: first_name,
      lastName: last_name,
      department: department || 'Genel',
      role: role === 'admin' ? 'admin' : 'employee',
      annualLeaveTotal: annual_leave_total ?? 14,
      annualLeaveUsed: 0,
      flexibleHoursStart: flexible_hours_start || '09:00',
      flexibleHoursEnd: flexible_hours_end || '18:00',
      flexibleWorkNote: flexible_work_note || 'Standart mesai',
      flexTimeBalance: flex_time_balance ?? 0,
      deductedHoursBalance: deducted_hours_balance ?? 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('profiles').doc(userRecord.uid).set(profile);
    await lookupRef.set({ email: technicalEmail, uid: userRecord.uid });

    return res.status(200).json({ success: true, uid: userRecord.uid });
  } catch (err) {
    const msg = err.code === 'auth/email-already-exists'
      ? 'Bu sicil numarası zaten kullanımda.'
      : (err.message || 'Beklenmeyen hata');
    return res.status(500).json({ error: msg });
  }
};
