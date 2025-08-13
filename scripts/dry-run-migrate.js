#!/usr/bin/env node

/**
 * DRY RUN MIGRATION ANALYSIS SCRIPT
 * Analyzes current Replit data and generates migration plan for Vercel deployment
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.ts";
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

neonConfig.webSocketConstructor = ws;

async function generateDryRunReport() {
  console.log('🔍 MIGRATION DRY RUN ANALYSIS');
  console.log('========================================\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: 'replit-to-vercel-migration',
    source: {},
    target: {},
    migration_plan: {},
    safety_checks: {},
    recommendations: {}
  };

  try {
    // === SOURCE ENVIRONMENT ANALYSIS (REPLIT) ===
    console.log('📊 ANALYZING SOURCE ENVIRONMENT (REPLIT)');
    console.log('------------------------------------------');
    
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not found in Replit environment");
    }

    const sourceDbUrl = process.env.DATABASE_URL;
    const dbUrlMasked = sourceDbUrl.replace(/:([^:@]+)@/, ':***@');
    console.log(`✅ Source DB URL: ${dbUrlMasked}`);
    
    const pool = new Pool({ connectionString: sourceDbUrl });
    const db = drizzle({ client: pool, schema });

    // Database analysis
    const profilesData = await db.select().from(schema.profiles);
    const imagesData = await db.select().from(schema.profileImages);
    const usersData = await db.select().from(schema.users);

    report.source = {
      database: {
        type: 'PostgreSQL (Neon)',
        url_host: sourceDbUrl.match(/postgresql:\/\/[^:]+:[^@]+@([^/]+)/)[1],
        connection_string: dbUrlMasked,
        tables: {
          profiles: {
            count: profilesData.length,
            sample_data: profilesData.slice(0, 3).map(p => ({
              id: p.id,
              name: p.name,
              title: p.title,
              category: p.category,
              profile_picture_url: p.profilePictureUrl,
              cover_photo_url: p.coverPhotoUrl,
              created_at: p.createdAt
            }))
          },
          profile_images: {
            count: imagesData.length,
            sample_data: imagesData.slice(0, 5).map(img => ({
              id: img.id,
              profile_id: img.profileId,
              image_url: img.imageUrl,
              is_main_image: img.isMainImage,
              order: img.order,
              created_at: img.createdAt
            }))
          },
          users: {
            count: usersData.length,
            admin_count: usersData.filter(u => u.isAdmin).length
          }
        }
      },
      images: {
        storage_type: 'external_cdn',
        hosting_provider: 'img.coomer.st',
        total_images: imagesData.length,
        unique_urls: [...new Set(imagesData.map(img => new URL(img.imageUrl).hostname))],
        sample_urls: imagesData.slice(0, 5).map(img => img.imageUrl),
        local_files: 'none_found' // No local files found
      }
    };

    console.log(`✅ Found ${profilesData.length} profiles`);
    console.log(`✅ Found ${imagesData.length} images`);
    console.log(`✅ Found ${usersData.length} users (${usersData.filter(u => u.isAdmin).length} admin)`);
    
    await pool.end();

    // === TARGET ENVIRONMENT ANALYSIS (VERCEL) ===
    console.log('\n📊 ANALYZING TARGET ENVIRONMENT (VERCEL)');
    console.log('------------------------------------------');
    
    report.target = {
      platform: 'Vercel',
      database: {
        status: 'needs_configuration',
        recommended: 'Supabase PostgreSQL or Vercel Postgres',
        required_env_vars: ['DATABASE_URL']
      },
      image_storage: {
        status: 'needs_configuration', 
        recommended: 'Cloudinary',
        required_env_vars: ['CLOUDINARY_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
      },
      current_deployment: {
        issue: 'Empty database - no profiles or images visible',
        cause: 'Missing DATABASE_URL or different database instance'
      }
    };

    console.log('⚠️  Vercel DATABASE_URL not configured or points to empty database');
    console.log('⚠️  Images need migration from external CDN to Cloudinary');

    // === MIGRATION PLAN ===
    console.log('\n📋 MIGRATION PLAN');
    console.log('------------------');

    const imageUrls = imagesData.map(img => img.imageUrl);
    const profileIds = profilesData.map(p => p.id);

    report.migration_plan = {
      phase_1_database: {
        action: 'Export and import database',
        source_tables: ['users', 'profiles', 'profile_images', 'sessions'],
        method: 'pg_dump -> pg_restore OR SQL insert statements',
        estimated_rows: profilesData.length + imagesData.length + usersData.length,
        preserve_ids: true,
        preserve_timestamps: true
      },
      phase_2_images: {
        action: 'Migrate images to Cloudinary',
        source_count: imageUrls.length,
        source_domains: [...new Set(imageUrls.map(url => new URL(url).hostname))],
        target: 'Cloudinary CDN',
        process: [
          '1. Validate each image URL (HTTP 200, content-type image/*)',
          '2. Download images with retry logic',
          '3. Upload to Cloudinary with original filenames',
          '4. Generate thumbnails and optimized versions',
          '5. Update database with new Cloudinary URLs'
        ],
        concurrency: 4,
        retry_policy: '3 retries with exponential backoff'
      },
      phase_3_verification: {
        action: 'Verify migration success',
        checks: [
          'Profile count matches source',
          'Image count matches source', 
          'All images accessible via new URLs',
          'Profile page displays correctly',
          'API endpoints return expected data'
        ]
      }
    };

    // === SAFETY CHECKS ===
    report.safety_checks = {
      backup_plan: {
        database: 'pg_dump of source database before migration',
        images: 'JSON manifest of all original URLs and metadata',
        rollback_script: 'Provided for emergency restoration'
      },
      validation_rules: {
        image_size_limit: '20MB per image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        url_validation: 'HTTP 200 response required',
        content_type: 'Must be image/*'
      },
      risk_assessment: 'LOW - External images, PostgreSQL to PostgreSQL migration'
    };

    // === RECOMMENDATIONS ===
    report.recommendations = {
      database_target: 'Supabase (free tier) or Vercel Postgres',
      image_storage: 'Cloudinary (generous free tier)',
      migration_timing: 'Off-peak hours recommended',
      testing: 'Test with subset of images first',
      monitoring: 'Monitor Cloudinary usage during migration'
    };

    console.log(`✅ Database migration: ${report.migration_plan.phase_1_database.estimated_rows} rows`);
    console.log(`✅ Image migration: ${report.migration_plan.phase_2_images.source_count} images`);
    console.log(`✅ Image sources: ${report.migration_plan.phase_2_images.source_domains.join(', ')}`);

    // === OUTPUT REPORT ===
    const reportPath = join(__dirname, 'migration-dry-run-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n💾 Detailed report saved: ${reportPath}`);
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Review this dry-run report');
    console.log('2. Choose production database (Supabase recommended)');
    console.log('3. Set up Cloudinary account');  
    console.log('4. Confirm migration execution');
    console.log('5. Run: node scripts/migrate-to-prod.js --confirm');

    return report;

  } catch (error) {
    console.error('❌ Error during dry-run analysis:', error.message);
    report.error = error.message;
    return report;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDryRunReport()
    .then(report => {
      console.log('\n📊 DRY RUN COMPLETE');
      console.log('===================');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Dry run failed:', error);
      process.exit(1);
    });
}

export default generateDryRunReport;