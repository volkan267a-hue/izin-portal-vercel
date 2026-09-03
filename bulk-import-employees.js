const admin = require('firebase-admin');
const { getAdminApp, toEmailLocalPart, AUTH_EMAIL_DOMAIN, setCors, getBody, requireAdmin } = require('./_shared');

function randomPassword() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Yalnızca POST kabul edilir.' });

  try {
    const app = getAdminApp();
    const authCheck = await requireAdmin(req, app);
    if (authCheck.error) return res.status(authCheck.error.statusCode).json({ error: authCheck.error.body });

    const { employees } = getBody(req);
    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ error: 'Çalışan listesi boş.' });
    }

    const db = admin.firestore(app);
    const results = [];

    for (const row of employees) {
      const { registry_number, first_name, last_name, department, annual_leave_total } = row;
      if (!registry_number || !first_name || !last_name) {
        results.push({ registry_number: registry_number || '(bilinmiyor)', success: false, error: 'Eksik alan' });
        continue;
      }

      const registryNumber = String(registry_number).trim();
      const localPart = toEmailLocalPart(registryNumber);
      if (!localPart) {
        results.push({ registry_number: registryNumber, success: false, error: 'Geçersiz sicil numarası' });
        continue;
      }

      const lookupRef = db.collection('registryLookup').doc(registryNumber);
      const existing = await lookupRef.get();
      if (existing.exists) {
        results.push({ registry_number: registryNumber, success: false, error: 'Bu sicil numarası zaten kullanımda.' });
        continue;
      }

      const technicalEmail = `${localPart}@${AUTH_EMAIL_DOMAIN}`;
      const generatedPassword = row.password || randomPassword();

      try {
        const userRecord = await admin.auth(app).createUser({
          email: technicalEmail,
          password: generatedPassword,
          emailVerified: true
        });

        await db.collection('profiles').doc(userRecord.uid).set({
          registryNumber,
          email: technicalEmail,
          firstName: first_name,
          lastName: last_name,
          department: department || 'Genel',
          role: 'employee',
          annualLeaveTotal: annual_leave_total ?? 14,
          annualLeaveUsed: 0,
          flexibleHoursStart: row.flexible_hours_start || '09:00',
          flexibleHoursEnd: row.flexible_hours_end || '18:00',
          flexibleWorkNote: row.flexible_work_note || 'Standart mesai',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await lookupRef.set({ email: technicalEmail, uid: userRecord.uid });

        results.push({
          registry_number: registryNumber,
          success: true,
          password: row.password ? undefined : generatedPassword
        });
      } catch (err) {
        const msg = err.code === 'auth/email-already-exists'
          ? 'Bu sicil numarası zaten kullanımda.'
          : (err.message || 'Bilinmeyen hata');
        results.push({ registry_number: registryNumber, success: false, error: msg });
      }
    }

    return res.status(200).json({ results });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Beklenmeyen hata' });
  }
};
