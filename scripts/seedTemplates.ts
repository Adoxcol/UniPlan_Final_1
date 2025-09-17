#!/usr/bin/env tsx

/**
 * Template Seeding Script
 * 
 * This script seeds the database with official university templates.
 * Run with: npx tsx scripts/seedTemplates.ts
 */

import { TemplateSeeder } from '../lib/templateSeeder';

async function main() {
  console.log('🌱 Starting template seeding...');
  
  try {
    // Seed BSCSE template
    console.log('📚 Creating BSCSE template...');
    await TemplateSeeder.seedBSCSETemplate();
    console.log('✅ BSCSE template created successfully!');
    
    console.log('🎉 Template seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    process.exit(1);
  }
}

// Run the seeding script
if (require.main === module) {
  main();
}

export { main as seedTemplates };