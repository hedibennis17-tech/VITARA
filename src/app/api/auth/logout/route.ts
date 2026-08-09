import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Déconnexion réussie' });
  // Supprimer les cookies d'authentification
  response.cookies.set({ name: 'vitara_access_token',  value: '', maxAge: 0, path: '/' });
  response.cookies.set({ name: 'vitara_refresh_token', value: '', maxAge: 0, path: '/' });
  return response;
}
