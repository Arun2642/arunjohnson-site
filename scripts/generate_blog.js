const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, '..', 'blog');

function getTitle(filename) {
  return filename.replace(/\.md$/i, '').replace(/[-_]/g, ' ');
}

const files = fs.readdirSync(blogDir).filter(f => f.toLowerCase().endsWith('.md'));
const posts = files.map(f => {
  const filePath = path.join(blogDir, f);
  const title = getTitle(f);
  const mtime = fs.statSync(filePath).mtime;
  return { title, file: f, date: mtime.toISOString() };
}).sort((a, b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync(path.join(blogDir, 'posts.json'), JSON.stringify(posts, null, 2) + '\n');

const rssItems = posts.map(p => `    <item>
      <title>${p.title}</title>
      <link>https://arunjohnson.com/blog/${encodeURIComponent(p.file)}</link>
      <description>${p.title}</description>
      <guid>${p.file.replace(/\.md$/, '')}</guid>
    </item>`).join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>Arun Johnson Blog</title>\n    <link>https://arunjohnson.com/blog/</link>\n    <description>Updates from Arun Johnson</description>\n${rssItems}\n  </channel>\n</rss>\n`;

fs.writeFileSync(path.join(blogDir, 'rss.xml'), rss);
