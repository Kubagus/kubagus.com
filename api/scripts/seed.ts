import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const SITE_KEY = 'portfolio';
const SITE_NAME = 'kubagus.com';
const SITE_DOMAIN = 'kubagus.com';

const ADMIN_EMAIL = 'admin@kubagus.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'Kubagus';

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'kubagus_com',
    charset: 'utf8mb4',
  });

  try {
    const [siteRows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT id FROM sites WHERE key_name = ?',
      [SITE_KEY],
    );

    let siteId: number;
    if (siteRows.length === 0) {
      const [result] = await conn.query<mysql.ResultSetHeader>(
        'INSERT INTO sites (key_name, name, domain) VALUES (?, ?, ?)',
        [SITE_KEY, SITE_NAME, SITE_DOMAIN],
      );
      siteId = result.insertId;
      console.log(`Situs "${SITE_NAME}" dibuat (id=${siteId}).`);
    } else {
      siteId = siteRows[0].id as number;
      console.log(`Situs "${SITE_NAME}" sudah ada (id=${siteId}).`);
    }

    const [adminRows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT id FROM admins WHERE email = ?',
      [ADMIN_EMAIL],
    );
    if (adminRows.length === 0) {
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await conn.query(
        'INSERT INTO admins (site_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [siteId, ADMIN_NAME, ADMIN_EMAIL, hash, 'superadmin'],
      );
      console.log(`Admin "${ADMIN_EMAIL}" dibuat (password: ${ADMIN_PASSWORD}).`);
    } else {
      console.log(`Admin "${ADMIN_EMAIL}" sudah ada.`);
    }

    const [profileRows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT id FROM profile WHERE site_id = ?',
      [siteId],
    );
    if (profileRows.length === 0) {
      await conn.query(
        `INSERT INTO profile
          (site_id, name, title_id, title_en, headline_id, headline_en,
           summary_id, summary_en, location_id, location_en, cv_url_id, cv_url_en,
           email, phone, badge_show, badge_text_id, badge_text_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          siteId,
          'Ahmad Kubagus Subkhi',
          'Software Engineer',
          'Software Engineer',
          'Membangun aplikasi web yang bersih, cepat, dan mudah dipelihara.',
          'Building clean, fast, and maintainable web applications.',
          'Halo! Saya seorang pengembang web dengan pengalaman membangun aplikasi full-stack menggunakan React, Express, dan MySQL.',
          'Hello! I am a web developer experienced in building full-stack applications with React, Express, and MySQL.',
          'Indonesia',
          'Indonesia',
          'https://drive.google.com/cv-id.pdf',
          'https://drive.google.com/cv-en.pdf',
          'halo@kubagus.com',
          '+62 812 3456 7890',
          1,
          null,
          null,
        ],
      );
      console.log('Profil default dibuat.');
    } else {
      console.log('Profil sudah ada.');
    }

    const socials = [
      ['GitHub', 'https://github.com/kubagus', 'github'],
      ['LinkedIn', 'https://linkedin.com/in/kubagus', 'linkedin'],
      ['X / Twitter', 'https://x.com/kubagus', 'twitter'],
    ];
    const [socialRows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM social_links WHERE site_id = ?',
      [siteId],
    );
    if ((socialRows[0].total as number) === 0) {
      for (let i = 0; i < socials.length; i++) {
        const [platform, url, icon] = socials[i];
        await conn.query(
          'INSERT INTO social_links (site_id, platform, url, icon, sort_order) VALUES (?, ?, ?, ?, ?)',
          [siteId, platform, url, icon, i],
        );
      }
      console.log('Social links dibuat.');
    }

    const [expRows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM experiences WHERE site_id = ?',
      [siteId],
    );
    if ((expRows[0].total as number) === 0) {
      await conn.query(
        `INSERT INTO experiences
          (site_id, company, company_en, position_id, position_en, description_id, description_en,
           start_date, end_date, is_current, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          siteId,
          'PT Contoh Teknologi',
          'Example Technology Ltd.',
          'Software Engineer',
          'Software Engineer',
          'Mengembangkan fitur backend dan frontend untuk produk internal.',
          'Developed backend and frontend features for internal products.',
          '2022-01-01',
          '2023-12-31',
          0,
          1,
        ],
      );
      await conn.query(
        `INSERT INTO experiences
          (site_id, company, company_en, position_id, position_en, description_id, description_en,
           start_date, end_date, is_current, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          siteId,
          'Freelance',
          'Freelance',
          'Full-Stack Developer',
          'Full-Stack Developer',
          'Membangun website portofolio, toko online, dan sistem manajemen untuk klien.',
          'Built portfolio websites, online stores, and management systems for clients.',
          '2024-01-01',
          null,
          1,
          0,
        ],
      );
      console.log('Experience default dibuat.');
    }

    const [eduRows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM educations WHERE site_id = ?',
      [siteId],
    );
    if ((eduRows[0].total as number) === 0) {
      await conn.query(
        `INSERT INTO educations
          (site_id, institution, degree_id, degree_en, description_id, description_en,
           start_date, end_date, is_current, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          siteId,
          'Universitas Contoh',
          'Sarjana Teknik Informatika',
          "Bachelor's Degree in Informatics Engineering",
          'Fokus pada pengembangan web dan basis data.',
          'Focused on web development and databases.',
          '2018-09-01',
          '2022-08-31',
          0,
          0,
        ],
      );
      console.log('Education default dibuat.');
    }

    const [skillRows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM skills WHERE site_id = ?',
      [siteId],
    );
    if ((skillRows[0].total as number) === 0) {
      const skills = [
        ['React', 'React', 'Frontend', 'Frontend', 'react', 'expert'],
        ['TypeScript', 'TypeScript', 'Frontend', 'Frontend', 'typescript', 'advanced'],
        ['Node.js / Express', 'Node.js / Express', 'Backend', 'Backend', 'nodejs', 'advanced'],
        ['MySQL', 'MySQL', 'Backend', 'Backend', 'database', 'advanced'],
        ['Tailwind CSS', 'Tailwind CSS', 'Frontend', 'Frontend', 'tailwind', 'expert'],
        ['Git & GitHub', 'Git & GitHub', 'Tools', 'Tools', 'git', 'advanced'],
        ['Docker', 'Docker', 'Tools', 'Tools', 'docker', 'intermediate'],
        ['PHP / Laravel', 'PHP / Laravel', 'Backend', 'Backend', 'php', 'basic'],
      ];
      for (let i = 0; i < skills.length; i++) {
        const s = skills[i];
        await conn.query(
          `INSERT INTO skills
            (site_id, name_id, name_en, category_id, category_en, icon, level, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [siteId, s[0], s[1], s[2], s[3], s[4], s[5], i],
        );
      }
      console.log('Skills default dibuat.');
    }

    const [projRows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM projects WHERE site_id = ?',
      [siteId],
    );
    if ((projRows[0].total as number) === 0) {
      const now = new Date();
      await conn.query(
        `INSERT INTO projects
          (site_id, slug, title_id, title_en, summary_id, summary_en,
           content_id, content_en, github_url, demo_url,
           is_featured, is_published, published_at, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          siteId,
          'project-management',
          'Sistem Manajemen Proyek',
          'Project Management System',
          'Aplikasi untuk mengelola proyek, tugas, dan tim.',
          'An application to manage projects, tasks, and teams.',
          '<h2>Ringkasan</h2><p>Aplikasi ini dibangun dengan React dan Express untuk mengelola proyek secara tim.</p>',
          '<h2>Overview</h2><p>This app was built with React and Express to manage projects as a team.</p>',
          'https://github.com/kubagus/project-management',
          'https://pm.kubagus.com',
          1,
          1,
          now,
          0,
        ],
      );
      await conn.query(
        `INSERT INTO projects
          (site_id, slug, title_id, title_en, summary_id, summary_en,
           content_id, content_en, github_url, demo_url,
           is_featured, is_published, published_at, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          siteId,
          'url-shortener',
          'Pemendek URL',
          'URL Shortener',
          'Layanan pemendek tautan sederhana dengan statistik klik.',
          'A simple link shortener service with click statistics.',
          '<h2>Ringkasan</h2><p>Pemendek URL dengan pelacakan jumlah klik per tautan.</p>',
          '<h2>Overview</h2><p>A URL shortener with click tracking per link.</p>',
          'https://github.com/kubagus/url-shortener',
          'https://short.kubagus.com',
          0,
          1,
          now,
          1,
        ],
      );
      console.log('Projects default dibuat.');
    }

    const [blogRows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM blogs WHERE site_id = ?',
      [siteId],
    );
    if ((blogRows[0].total as number) === 0) {
      const now = new Date();
      await conn.query(
        `INSERT INTO blogs
          (site_id, slug, title_id, title_en, excerpt_id, excerpt_en,
           content_id, content_en, tags, is_published, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          siteId,
          'belajar-express-ts',
          'Memulai Backend dengan Express dan TypeScript',
          'Getting Started with Express and TypeScript Backend',
          'Panduan singkat menyiapkan proyek Express dengan TypeScript dari nol.',
          'A quick guide to setting up an Express + TypeScript project from scratch.',
          '<h2>Persiapan</h2><p>Instal dependensi dan buat konfigurasi TypeScript.</p><pre><code>npm init -y\nnpm i express\nnpm i -D typescript tsx</code></pre>',
          '<h2>Setup</h2><p>Install dependencies and create TypeScript configuration.</p><pre><code>npm init -y\nnpm i express\nnpm i -D typescript tsx</code></pre>',
          JSON.stringify(['express', 'typescript', 'backend']),
          1,
          now,
        ],
      );
      await conn.query(
        `INSERT INTO blogs
          (site_id, slug, title_id, title_en, excerpt_id, excerpt_en,
           content_id, content_en, tags, is_published, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          siteId,
          'desain-timeline-cv',
          'Mendesain Timeline CV dengan Tailwind CSS',
          'Designing a CV Timeline with Tailwind CSS',
          'Cara membuat timeline pengalaman dan pendidikan yang rapi.',
          'How to build a clean experience and education timeline.',
          '<h2>Struktur</h2><p>Gunakan flexbox dan border untuk membuat garis waktu vertikal.</p>',
          '<h2>Structure</h2><p>Use flexbox and borders to create a vertical timeline.</p>',
          JSON.stringify(['tailwind', 'css', 'ui']),
          1,
          now,
        ],
      );
      console.log('Blogs default dibuat.');
    }

    /* ---------- Tech stacks & categories + pivot ---------- */

    const [stackRows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM tech_stacks WHERE site_id = ?',
      [siteId],
    );
    if ((stackRows[0].total as number) === 0) {
      const stacks = ['React', 'Express', 'MySQL', 'Tailwind', 'Next.js', 'Prisma', 'TypeScript', 'Docker'];
      for (let i = 0; i < stacks.length; i++) {
        await conn.query(
          'INSERT INTO tech_stacks (site_id, name, slug, sort_order) VALUES (?, ?, ?, ?)',
          [siteId, stacks[i], stacks[i].toLowerCase().replace(/\s+/g, '-'), i],
        );
      }
      console.log('Tech stacks default dibuat.');
    }

    const [catRows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM categories WHERE site_id = ?',
      [siteId],
    );
    if ((catRows[0].total as number) === 0) {
      const categories: Array<[string, string, string, string, string]> = [
        ['project', 'Aplikasi Web', 'Web App', 'web-app', '0'],
        ['project', 'API / Backend', 'API / Backend', 'api-backend', '1'],
        ['blog', 'Tutorial', 'Tutorial', 'tutorial', '0'],
        ['blog', 'Catatan', 'Notes', 'notes', '1'],
        ['blog', 'Opini', 'Opinion', 'opinion', '2'],
      ];
      for (const [type, nameId, nameEn, slug, order] of categories) {
        await conn.query(
          'INSERT INTO categories (site_id, type, name_id, name_en, slug, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
          [siteId, type, nameId, nameEn, slug, Number(order)],
        );
      }
      console.log('Categories default dibuat.');
    }

    async function getStackId(slug: string): Promise<number | null> {
      const [rows] = await conn.query<mysql.RowDataPacket[]>(
        'SELECT id FROM tech_stacks WHERE site_id = ? AND slug = ?',
        [siteId, slug],
      );
      return rows[0] ? (rows[0].id as number) : null;
    }

    async function getCategoryId(type: string, slug: string): Promise<number | null> {
      const [rows] = await conn.query<mysql.RowDataPacket[]>(
        'SELECT id FROM categories WHERE site_id = ? AND type = ? AND slug = ?',
        [siteId, type, slug],
      );
      return rows[0] ? (rows[0].id as number) : null;
    }

    async function getProjectId(slug: string): Promise<number | null> {
      const [rows] = await conn.query<mysql.RowDataPacket[]>(
        'SELECT id FROM projects WHERE site_id = ? AND slug = ?',
        [siteId, slug],
      );
      return rows[0] ? (rows[0].id as number) : null;
    }

    async function getBlogId(slug: string): Promise<number | null> {
      const [rows] = await conn.query<mysql.RowDataPacket[]>(
        'SELECT id FROM blogs WHERE site_id = ? AND slug = ?',
        [siteId, slug],
      );
      return rows[0] ? (rows[0].id as number) : null;
    }

    const pmId = await getProjectId('project-management');
    if (pmId) {
      for (const slug of ['react', 'express', 'mysql', 'tailwind']) {
        const stackId = await getStackId(slug);
        if (stackId) {
          await conn.query('INSERT IGNORE INTO project_tech_stacks (project_id, tech_stack_id) VALUES (?, ?)', [pmId, stackId]);
        }
      }
      const catWeb = await getCategoryId('project', 'web-app');
      if (catWeb) {
        await conn.query('INSERT IGNORE INTO project_categories (project_id, category_id) VALUES (?, ?)', [pmId, catWeb]);
      }
    }

    const usId = await getProjectId('url-shortener');
    if (usId) {
      for (const slug of ['next.js', 'prisma', 'mysql']) {
        const stackId = await getStackId(slug);
        if (stackId) {
          await conn.query('INSERT IGNORE INTO project_tech_stacks (project_id, tech_stack_id) VALUES (?, ?)', [usId, stackId]);
        }
      }
      const catApi = await getCategoryId('project', 'api-backend');
      if (catApi) {
        await conn.query('INSERT IGNORE INTO project_categories (project_id, category_id) VALUES (?, ?)', [usId, catApi]);
      }
    }

    const blog1Id = await getBlogId('belajar-express-ts');
    if (blog1Id) {
      const catTut = await getCategoryId('blog', 'tutorial');
      if (catTut) {
        await conn.query('INSERT IGNORE INTO blog_categories (blog_id, category_id) VALUES (?, ?)', [blog1Id, catTut]);
      }
    }

    const blog2Id = await getBlogId('desain-timeline-cv');
    if (blog2Id) {
      const catTut = await getCategoryId('blog', 'tutorial');
      if (catTut) {
        await conn.query('INSERT IGNORE INTO blog_categories (blog_id, category_id) VALUES (?, ?)', [blog2Id, catTut]);
      }
    }

    const [settingRows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM settings WHERE site_id = ?',
      [siteId],
    );
    if ((settingRows[0].total as number) === 0) {
      await conn.query('INSERT INTO settings (site_id, skey, svalue) VALUES (?, ?, ?)', [
        siteId,
        'seo',
        JSON.stringify({
          title: 'Kubagus — Software Engineer',
          description: 'Portofolio dan blog pribadi Kubagus.',
        }),
      ]);
      await conn.query('INSERT INTO settings (site_id, skey, svalue) VALUES (?, ?, ?)', [
        siteId,
        'theme',
        JSON.stringify({ defaultTheme: 'dark' }),
      ]);
      console.log('Settings default dibuat.');
    }

    console.log('Seed selesai.');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
