#!/usr/bin/env node
/**
 * VITARA — Script de migration PostgreSQL
 * Usage: node scripts/migrate.js [--seed]
 *
 * Variables d'env requises:
 *   DATABASE_URL=postgresql://user:password@host:5432/vitara_db
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.join(__dirname, '../src/lib/db/schema.sql');
const SEED_PATH   = path.join(__dirname, '../src/lib/db/seed.sql');

async function migrate() {
  const args = process.argv.slice(2);
  const withSeed = args.includes('--seed');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL non défini. Créez un fichier .env.local ou exportez la variable.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();

  try {
    console.log('🔗 Connexion PostgreSQL établie');
    console.log('   URL:', process.env.DATABASE_URL.replace(/:[^@]+@/, ':***@'));

    // ── Schéma ────────────────────────────────────────────────
    console.log('\n📋 Application du schéma...');
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    await client.query(schema);
    console.log('✅ Schéma appliqué');

    // ── Vérification des tables ───────────────────────────────
    const tables = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    );
    console.log(`\n📊 Tables créées (${tables.rows.length}):`);
    tables.rows.forEach(r => process.stdout.write(`   ${r.tablename}\n`));

    // ── Seed optionnel ────────────────────────────────────────
    if (withSeed) {
      console.log('\n🌱 Insertion des données de test...');
      const seed = fs.readFileSync(SEED_PATH, 'utf-8');
      await client.query(seed);
      console.log('✅ Données de test insérées');
      console.log('\n🔑 Comptes de test (mot de passe: Admin1234!):');
      console.log('   admin@vitara.ca       → Administrateur');
      console.log('   superviseur@vitara.ca → Superviseur');
      console.log('   reception@vitara.ca   → Réceptionniste');
      console.log('   dr.martin@vitara.ca   → Médecin');
      console.log('   o.khalil@vitara.ca    → Physiothérapeute');
    }

    console.log('\n🎉 Migration terminée avec succès!\n');

  } catch (err) {
    console.error('\n❌ Erreur de migration:', err.message);
    console.error(err.detail || '');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
