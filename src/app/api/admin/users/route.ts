import { NextRequest } from 'next/server';
import { withAuth, apiSuccess, apiServerError } from '@/lib/auth/middleware';
import { query } from '@/lib/db';

// GET /api/admin/users — liste des utilisateurs de la clinique
export const GET = withAuth(async (_req, { user }) => {
  try {
    const users = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone,
              u.is_active, u.is_verified, u.last_login_at, u.created_at,
              r.name AS role, r.display_name AS role_label,
              c.name AS clinic_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN clinics c ON u.clinic_id = c.id
       WHERE u.clinic_id = $1
       ORDER BY u.last_name, u.first_name`,
      [user.clinicId]
    );
    return apiSuccess({ users, total: users.length });
  } catch (err) {
    return apiServerError(err);
  }
}, { roles: ['admin', 'supervisor'] });
