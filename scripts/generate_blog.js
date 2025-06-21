const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, '..', 'blog');

function getTitle(filename, content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
  if (frontmatterMatch) {
    const titleMatch = frontmatterMatch[1].match(/^title:\s*(.*)$/m);
    if (titleMatch) return titleMatch[1].trim();
  }
  // take first markdown heading
  const headingMatch = content.match(/^\s*#{1,6}\s+(.*)$/m);
  if (headingMatch) return headingMatch[1].trim();
  // fallback to file name
  return filename.replace(/\.md$/i, '').replace(/[-_]/g, ' ');
}

const files = fs.readdirSync(blogDir).filter(f => f.toLowerCase().endsWith('.md'));
const posts = files.map(f => {
  const filePath = path.join(blogDir, f);
  const content = fs.readFileSync(filePath, 'utf8');
  const title = getTitle(f, content);
  return { title, file: f };
});

fs.writeFileSync(path.join(blogDir, 'posts.json'), JSON.stringify(posts, null, 2));

const rssItems = posts.map(p => `    <item>
      <title>${p.title}</title>
      <link>${p.file}</link>
      <description>${p.title}</description>
      <guid>${p.file.replace(/\.md$/, '')}</guid>
    </item>`).join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>Arun Johnson Blog</title>\n    <link>https://arunjohnson.com/blog/</link>\n    <description>Updates from Arun Johnson</description>\n${rssItems}\n  </channel>\n</rss>\n`;

fs.writeFileSync(path.join(blogDir, 'rss.xml'), rss);
