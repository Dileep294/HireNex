import puppeteer from 'puppeteer';

/**
 * Escapes HTML characters to prevent XSS in generated PDFs
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Normalizes skills into an array of string items or key-value categories
 */
function normalizeSkills(skills) {
  if (Array.isArray(skills)) {
    return { 'Technical Skills': skills.map(escapeHtml) };
  }
  if (skills && typeof skills === 'object') {
    const res = {};
    for (const [k, v] of Object.entries(skills)) {
      if (Array.isArray(v)) {
        res[escapeHtml(k)] = v.map(escapeHtml);
      }
    }
    return res;
  }
  return {};
}

/**
 * Generates HTML string for the Classic ATS Resume template
 */
function renderClassicTemplate(data) {
  const { personalInfo, summary, experience, education, projects, certifications, skills } = data;
  const normalizedSkills = normalizeSkills(skills);

  const contactItems = [
    personalInfo.email && `<a href="mailto:${escapeHtml(personalInfo.email)}">${escapeHtml(personalInfo.email)}</a>`,
    personalInfo.phone && escapeHtml(personalInfo.phone),
    personalInfo.location && escapeHtml(personalInfo.location),
    personalInfo.linkedin && `<a href="${escapeHtml(personalInfo.linkedin)}">LinkedIn</a>`,
    personalInfo.github && `<a href="${escapeHtml(personalInfo.github)}">GitHub</a>`,
    personalInfo.portfolio && `<a href="${escapeHtml(personalInfo.portfolio)}">Portfolio</a>`,
  ].filter(Boolean);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(personalInfo.fullName)} - Resume</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #111827;
      line-height: 1.45;
      font-size: 10.5pt;
      background: #ffffff;
    }
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    header {
      text-align: center;
      margin-bottom: 14pt;
      padding-bottom: 6pt;
    }
    h1 {
      font-size: 20pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1pt;
      margin-bottom: 3pt;
      color: #000000;
    }
    .subtitle {
      font-size: 11pt;
      font-style: italic;
      margin-bottom: 4pt;
      color: #374151;
    }
    .contact-line {
      font-size: 9.5pt;
      color: #4b5563;
    }
    .contact-line a {
      color: #111827;
      text-decoration: none;
    }
    .contact-line span:not(:last-child)::after {
      content: " • ";
      margin: 0 4pt;
    }
    .section-title {
      font-size: 11.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      border-bottom: 1.2pt solid #111827;
      padding-bottom: 2pt;
      margin-top: 12pt;
      margin-bottom: 6pt;
      color: #000000;
    }
    .entry {
      margin-bottom: 8pt;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 1.5pt;
    }
    .entry-title {
      font-weight: bold;
      font-size: 10.5pt;
    }
    .entry-company {
      font-style: italic;
    }
    .entry-date {
      font-size: 9.5pt;
      color: #4b5563;
      white-space: nowrap;
    }
    ul.bullets {
      margin-left: 16pt;
      margin-top: 2pt;
    }
    ul.bullets li {
      font-size: 10pt;
      margin-bottom: 2pt;
      line-height: 1.35;
    }
    .skills-row {
      margin-bottom: 3pt;
      font-size: 10pt;
    }
    .skills-category {
      font-weight: bold;
      display: inline;
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(personalInfo.fullName)}</h1>
    ${personalInfo.jobTitle ? `<div class="subtitle">${escapeHtml(personalInfo.jobTitle)}</div>` : ''}
    <div class="contact-line">
      ${contactItems.map((c) => `<span>${c}</span>`).join('')}
    </div>
  </header>

  ${summary ? `
    <section class="avoid-break">
      <div class="section-title">Professional Summary</div>
      <p style="font-size: 10pt; text-align: justify; line-height: 1.4;">${escapeHtml(summary)}</p>
    </section>
  ` : ''}

  ${experience && experience.length > 0 ? `
    <section>
      <div class="section-title">Work Experience</div>
      ${experience.map((exp) => `
        <div class="entry avoid-break">
          <div class="entry-header">
            <div>
              <span class="entry-title">${escapeHtml(exp.title)}</span>
              <span class="entry-company">, ${escapeHtml(exp.company)}</span>
              ${exp.location ? `<span style="color: #6b7280; font-size: 9pt;"> (${escapeHtml(exp.location)})</span>` : ''}
            </div>
            <div class="entry-date">
              ${escapeHtml(exp.startDate || '')}${exp.startDate && (exp.endDate || exp.current) ? ' - ' : ''}${exp.current ? 'Present' : escapeHtml(exp.endDate || '')}
            </div>
          </div>
          ${exp.highlights && exp.highlights.length > 0 ? `
            <ul class="bullets">
              ${exp.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </section>
  ` : ''}

  ${projects && projects.length > 0 ? `
    <section>
      <div class="section-title">Technical Projects</div>
      ${projects.map((proj) => `
        <div class="entry avoid-break">
          <div class="entry-header">
            <div>
              <span class="entry-title">${escapeHtml(proj.name)}</span>
              ${Array.isArray(proj.techStack) && proj.techStack.length > 0 ? `<span style="font-size: 9pt; font-style: italic; color: #4b5563;"> [${proj.techStack.map(escapeHtml).join(', ')}]</span>` : ''}
            </div>
            <div class="entry-date">
              ${proj.liveUrl ? `<a href="${escapeHtml(proj.liveUrl)}" style="color: #111827; margin-right: 6pt;">Demo</a>` : ''}
              ${proj.githubUrl ? `<a href="${escapeHtml(proj.githubUrl)}" style="color: #111827;">Source</a>` : ''}
            </div>
          </div>
          ${proj.highlights && proj.highlights.length > 0 ? `
            <ul class="bullets">
              ${proj.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </section>
  ` : ''}

  ${education && education.length > 0 ? `
    <section>
      <div class="section-title">Education</div>
      ${education.map((edu) => `
        <div class="entry avoid-break">
          <div class="entry-header">
            <div>
              <span class="entry-title">${escapeHtml(edu.degree)}</span>
              <span class="entry-company">, ${escapeHtml(edu.institution)}</span>
              ${edu.location ? `<span style="color: #6b7280; font-size: 9pt;"> (${escapeHtml(edu.location)})</span>` : ''}
            </div>
            <div class="entry-date">
              ${escapeHtml(edu.startDate || '')}${edu.startDate && edu.endDate ? ' - ' : ''}${escapeHtml(edu.endDate || '')}
            </div>
          </div>
          ${edu.gpa ? `<div style="font-size: 9pt; color: #4b5563;">GPA: ${escapeHtml(edu.gpa)}</div>` : ''}
          ${edu.highlights && edu.highlights.length > 0 ? `
            <ul class="bullets">
              ${edu.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </section>
  ` : ''}

  ${Object.keys(normalizedSkills).length > 0 ? `
    <section class="avoid-break">
      <div class="section-title">Technical Skills</div>
      ${Object.entries(normalizedSkills).map(([cat, items]) => `
        <div class="skills-row">
          <span class="skills-category">${cat}: </span>
          <span>${items.join(', ')}</span>
        </div>
      `).join('')}
    </section>
  ` : ''}

  ${certifications && certifications.length > 0 ? `
    <section class="avoid-break">
      <div class="section-title">Certifications</div>
      ${certifications.map((c) => `
        <div class="entry" style="margin-bottom: 3pt;">
          <div class="entry-header">
            <div>
              <span class="entry-title" style="font-size: 10pt;">${escapeHtml(c.name)}</span>
              ${c.issuer ? `<span style="font-size: 9.5pt; color: #4b5563;"> — ${escapeHtml(c.issuer)}</span>` : ''}
            </div>
            ${c.date ? `<div class="entry-date">${escapeHtml(c.date)}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </section>
  ` : ''}
</body>
</html>
  `;
}

/**
 * Generates HTML string for the Modern Professional Resume template
 */
function renderModernTemplate(data) {
  const { personalInfo, summary, experience, education, projects, certifications, skills } = data;
  const normalizedSkills = normalizeSkills(skills);

  const contactItems = [
    personalInfo.email && `<a href="mailto:${escapeHtml(personalInfo.email)}">${escapeHtml(personalInfo.email)}</a>`,
    personalInfo.phone && escapeHtml(personalInfo.phone),
    personalInfo.location && escapeHtml(personalInfo.location),
    personalInfo.linkedin && `<a href="${escapeHtml(personalInfo.linkedin)}">LinkedIn</a>`,
    personalInfo.github && `<a href="${escapeHtml(personalInfo.github)}">GitHub</a>`,
    personalInfo.portfolio && `<a href="${escapeHtml(personalInfo.portfolio)}">Portfolio</a>`,
  ].filter(Boolean);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(personalInfo.fullName)} - Modern Resume</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.45;
      font-size: 10pt;
      background: #ffffff;
    }
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    header {
      margin-bottom: 12pt;
      border-bottom: 2pt solid #4f46e5;
      padding-bottom: 8pt;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    h1 {
      font-size: 22pt;
      font-weight: 800;
      letter-spacing: -0.5pt;
      color: #0f172a;
      line-height: 1.1;
    }
    .role-title {
      font-size: 11pt;
      font-weight: 600;
      color: #4f46e5;
      margin-top: 2pt;
    }
    .contact-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 3pt 10pt;
      font-size: 9pt;
      color: #64748b;
      margin-top: 6pt;
    }
    .contact-grid a {
      color: #4f46e5;
      text-decoration: none;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      color: #0f172a;
      border-bottom: 1pt solid #e2e8f0;
      padding-bottom: 3pt;
      margin-top: 11pt;
      margin-bottom: 6pt;
      display: flex;
      align-items: center;
    }
    .section-title::before {
      content: "";
      display: inline-block;
      width: 4pt;
      height: 11pt;
      background: #4f46e5;
      border-radius: 1pt;
      margin-right: 5pt;
    }
    .entry {
      margin-bottom: 7pt;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 1.5pt;
    }
    .entry-title {
      font-weight: 700;
      font-size: 10.5pt;
      color: #0f172a;
    }
    .entry-company {
      font-weight: 600;
      color: #334155;
    }
    .entry-date {
      font-size: 9pt;
      font-weight: 500;
      color: #64748b;
      white-space: nowrap;
    }
    ul.bullets {
      margin-left: 14pt;
      margin-top: 2pt;
    }
    ul.bullets li {
      font-size: 9.5pt;
      margin-bottom: 1.5pt;
      color: #334155;
      line-height: 1.35;
    }
    .skill-chip {
      display: inline-block;
      background: #f1f5f9;
      color: #1e293b;
      padding: 1.5pt 5pt;
      border-radius: 3pt;
      font-size: 8.5pt;
      font-weight: 600;
      margin: 1pt 2pt 1pt 0;
      border: 0.5pt solid #cbd5e1;
    }
  </style>
</head>
<body>
  <header>
    <div class="header-top">
      <div>
        <h1>${escapeHtml(personalInfo.fullName)}</h1>
        ${personalInfo.jobTitle ? `<div class="role-title">${escapeHtml(personalInfo.jobTitle)}</div>` : ''}
      </div>
    </div>
    <div class="contact-grid">
      ${contactItems.map((c) => `<span>${c}</span>`).join('')}
    </div>
  </header>

  ${summary ? `
    <section class="avoid-break">
      <div class="section-title">Professional Summary</div>
      <p style="font-size: 9.5pt; color: #334155; line-height: 1.45;">${escapeHtml(summary)}</p>
    </section>
  ` : ''}

  ${experience && experience.length > 0 ? `
    <section>
      <div class="section-title">Professional Experience</div>
      ${experience.map((exp) => `
        <div class="entry avoid-break">
          <div class="entry-header">
            <div>
              <span class="entry-title">${escapeHtml(exp.title)}</span>
              <span class="entry-company"> • ${escapeHtml(exp.company)}</span>
              ${exp.location ? `<span style="color: #64748b; font-size: 9pt;"> (${escapeHtml(exp.location)})</span>` : ''}
            </div>
            <div class="entry-date">
              ${escapeHtml(exp.startDate || '')}${exp.startDate && (exp.endDate || exp.current) ? ' — ' : ''}${exp.current ? 'Present' : escapeHtml(exp.endDate || '')}
            </div>
          </div>
          ${exp.highlights && exp.highlights.length > 0 ? `
            <ul class="bullets">
              ${exp.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </section>
  ` : ''}

  ${projects && projects.length > 0 ? `
    <section>
      <div class="section-title">Key Projects</div>
      ${projects.map((proj) => `
        <div class="entry avoid-break">
          <div class="entry-header">
            <div>
              <span class="entry-title">${escapeHtml(proj.name)}</span>
              ${Array.isArray(proj.techStack) && proj.techStack.length > 0 ? `<span style="font-size: 8.5pt; color: #64748b; font-weight: 500;"> | ${proj.techStack.map(escapeHtml).join(', ')}</span>` : ''}
            </div>
            <div class="entry-date">
              ${proj.liveUrl ? `<a href="${escapeHtml(proj.liveUrl)}" style="color: #4f46e5; margin-right: 6pt;">Live Demo</a>` : ''}
              ${proj.githubUrl ? `<a href="${escapeHtml(proj.githubUrl)}" style="color: #4f46e5;">GitHub</a>` : ''}
            </div>
          </div>
          ${proj.highlights && proj.highlights.length > 0 ? `
            <ul class="bullets">
              ${proj.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </section>
  ` : ''}

  ${education && education.length > 0 ? `
    <section>
      <div class="section-title">Education</div>
      ${education.map((edu) => `
        <div class="entry avoid-break">
          <div class="entry-header">
            <div>
              <span class="entry-title">${escapeHtml(edu.degree)}</span>
              <span class="entry-company"> • ${escapeHtml(edu.institution)}</span>
              ${edu.location ? `<span style="color: #64748b; font-size: 8.5pt;"> (${escapeHtml(edu.location)})</span>` : ''}
            </div>
            <div class="entry-date">
              ${escapeHtml(edu.startDate || '')}${edu.startDate && edu.endDate ? ' — ' : ''}${escapeHtml(edu.endDate || '')}
            </div>
          </div>
          ${edu.gpa ? `<div style="font-size: 9pt; color: #64748b;">GPA: ${escapeHtml(edu.gpa)}</div>` : ''}
          ${edu.highlights && edu.highlights.length > 0 ? `
            <ul class="bullets">
              ${edu.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </section>
  ` : ''}

  ${Object.keys(normalizedSkills).length > 0 ? `
    <section class="avoid-break">
      <div class="section-title">Skills & Technologies</div>
      ${Object.entries(normalizedSkills).map(([cat, items]) => `
        <div style="margin-bottom: 4pt;">
          <span style="font-size: 9pt; font-weight: 700; color: #0f172a;">${cat}: </span>
          ${items.map((i) => `<span class="skill-chip">${i}</span>`).join('')}
        </div>
      `).join('')}
    </section>
  ` : ''}

  ${certifications && certifications.length > 0 ? `
    <section class="avoid-break">
      <div class="section-title">Certifications & Credentials</div>
      ${certifications.map((c) => `
        <div class="entry" style="margin-bottom: 3pt;">
          <div class="entry-header">
            <div>
              <span class="entry-title" style="font-size: 9.5pt;">${escapeHtml(c.name)}</span>
              ${c.issuer ? `<span style="font-size: 9pt; color: #64748b;"> — ${escapeHtml(c.issuer)}</span>` : ''}
            </div>
            ${c.date ? `<div class="entry-date">${escapeHtml(c.date)}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </section>
  ` : ''}
</body>
</html>
  `;
}

/**
 * Generates HTML string for the Software Developer Resume template
 */
function renderDeveloperTemplate(data) {
  const { personalInfo, summary, experience, education, projects, certifications, skills } = data;
  const normalizedSkills = normalizeSkills(skills);

  const contactItems = [
    personalInfo.email && `<a href="mailto:${escapeHtml(personalInfo.email)}">${escapeHtml(personalInfo.email)}</a>`,
    personalInfo.phone && escapeHtml(personalInfo.phone),
    personalInfo.location && escapeHtml(personalInfo.location),
    personalInfo.github && `<a href="${escapeHtml(personalInfo.github)}">github.com/${escapeHtml(personalInfo.github).replace(/https?:\/\/github\.com\//, '')}</a>`,
    personalInfo.linkedin && `<a href="${escapeHtml(personalInfo.linkedin)}">LinkedIn</a>`,
    personalInfo.portfolio && `<a href="${escapeHtml(personalInfo.portfolio)}">Portfolio</a>`,
  ].filter(Boolean);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(personalInfo.fullName)} - Software Developer Resume</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.45;
      font-size: 10pt;
      background: #ffffff;
    }
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    header {
      margin-bottom: 11pt;
      border-bottom: 1.5pt solid #0f172a;
      padding-bottom: 6pt;
    }
    h1 {
      font-size: 21pt;
      font-weight: 800;
      letter-spacing: -0.5pt;
      color: #0f172a;
      line-height: 1.1;
    }
    .role-title {
      font-size: 11pt;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      color: #2563eb;
      font-weight: 600;
      margin-top: 1pt;
    }
    .contact-line {
      display: flex;
      flex-wrap: wrap;
      gap: 3pt 8pt;
      font-size: 9pt;
      color: #475569;
      margin-top: 4pt;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    }
    .contact-line a {
      color: #2563eb;
      text-decoration: none;
    }
    .section-title {
      font-size: 10.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8pt;
      color: #0f172a;
      border-bottom: 1pt solid #cbd5e1;
      padding-bottom: 2pt;
      margin-top: 10pt;
      margin-bottom: 6pt;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    }
    .entry {
      margin-bottom: 7pt;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 1pt;
    }
    .entry-title {
      font-weight: 700;
      font-size: 10.5pt;
      color: #0f172a;
    }
    .entry-company {
      font-weight: 600;
      color: #334155;
    }
    .entry-date {
      font-size: 8.5pt;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      color: #64748b;
      white-space: nowrap;
    }
    .tech-stack-tag {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 8.5pt;
      color: #2563eb;
      background: #eff6ff;
      padding: 1pt 4pt;
      border-radius: 2pt;
      border: 0.5pt solid #bfdbfe;
    }
    ul.bullets {
      margin-left: 14pt;
      margin-top: 2pt;
    }
    ul.bullets li {
      font-size: 9.5pt;
      margin-bottom: 1.5pt;
      color: #334155;
      line-height: 1.35;
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(personalInfo.fullName)}</h1>
    <div class="role-title">&lt;${escapeHtml(personalInfo.jobTitle || 'Software Engineer')} /&gt;</div>
    <div class="contact-line">
      ${contactItems.map((c) => `<span>${c}</span>`).join('')}
    </div>
  </header>

  ${Object.keys(normalizedSkills).length > 0 ? `
    <section class="avoid-break">
      <div class="section-title">// Technical Skills</div>
      ${Object.entries(normalizedSkills).map(([cat, items]) => `
        <div style="margin-bottom: 3pt; font-size: 9.5pt;">
          <strong style="font-family: 'SFMono-Regular', Consolas, monospace; color: #0f172a;">${cat}: </strong>
          <span style="color: #334155;">${items.join(', ')}</span>
        </div>
      `).join('')}
    </section>
  ` : ''}

  ${experience && experience.length > 0 ? `
    <section>
      <div class="section-title">// Engineering Experience</div>
      ${experience.map((exp) => `
        <div class="entry avoid-break">
          <div class="entry-header">
            <div>
              <span class="entry-title">${escapeHtml(exp.title)}</span>
              <span class="entry-company"> @ ${escapeHtml(exp.company)}</span>
              ${exp.location ? `<span style="color: #64748b; font-size: 8.5pt;"> [${escapeHtml(exp.location)}]</span>` : ''}
            </div>
            <div class="entry-date">
              ${escapeHtml(exp.startDate || '')}${exp.startDate && (exp.endDate || exp.current) ? ' - ' : ''}${exp.current ? 'Present' : escapeHtml(exp.endDate || '')}
            </div>
          </div>
          ${exp.highlights && exp.highlights.length > 0 ? `
            <ul class="bullets">
              ${exp.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </section>
  ` : ''}

  ${projects && projects.length > 0 ? `
    <section>
      <div class="section-title">// Open Source & Projects</div>
      ${projects.map((proj) => `
        <div class="entry avoid-break">
          <div class="entry-header">
            <div>
              <span class="entry-title">${escapeHtml(proj.name)}</span>
              ${Array.isArray(proj.techStack) && proj.techStack.length > 0 ? `<span class="tech-stack-tag" style="margin-left: 4pt;">${proj.techStack.map(escapeHtml).join(', ')}</span>` : ''}
            </div>
            <div class="entry-date">
              ${proj.liveUrl ? `<a href="${escapeHtml(proj.liveUrl)}" style="color: #2563eb; margin-right: 6pt;">Demo ↗</a>` : ''}
              ${proj.githubUrl ? `<a href="${escapeHtml(proj.githubUrl)}" style="color: #2563eb;">Code ↗</a>` : ''}
            </div>
          </div>
          ${proj.highlights && proj.highlights.length > 0 ? `
            <ul class="bullets">
              ${proj.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </section>
  ` : ''}

  ${education && education.length > 0 ? `
    <section>
      <div class="section-title">// Education</div>
      ${education.map((edu) => `
        <div class="entry avoid-break">
          <div class="entry-header">
            <div>
              <span class="entry-title">${escapeHtml(edu.degree)}</span>
              <span class="entry-company">, ${escapeHtml(edu.institution)}</span>
            </div>
            <div class="entry-date">
              ${escapeHtml(edu.startDate || '')}${edu.startDate && edu.endDate ? ' - ' : ''}${escapeHtml(edu.endDate || '')}
            </div>
          </div>
          ${edu.gpa ? `<div style="font-size: 8.5pt; color: #64748b;">GPA: ${escapeHtml(edu.gpa)}</div>` : ''}
          ${edu.highlights && edu.highlights.length > 0 ? `
            <ul class="bullets">
              ${edu.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </section>
  ` : ''}

  ${summary ? `
    <section class="avoid-break">
      <div class="section-title">// Technical Summary</div>
      <p style="font-size: 9.5pt; color: #334155; line-height: 1.45;">${escapeHtml(summary)}</p>
    </section>
  ` : ''}

  ${certifications && certifications.length > 0 ? `
    <section class="avoid-break">
      <div class="section-title">// Certifications</div>
      ${certifications.map((c) => `
        <div class="entry" style="margin-bottom: 2pt;">
          <div class="entry-header">
            <div>
              <span class="entry-title" style="font-size: 9.5pt;">${escapeHtml(c.name)}</span>
              ${c.issuer ? `<span style="font-size: 8.5pt; color: #64748b;"> [${escapeHtml(c.issuer)}]</span>` : ''}
            </div>
            ${c.date ? `<div class="entry-date">${escapeHtml(c.date)}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </section>
  ` : ''}
</body>
</html>
  `;
}

/**
 * Returns rendered HTML based on selected template
 */
export function renderResumeHtml(data) {
  const template = data.template || 'modern';
  switch (template) {
    case 'classic':
      return renderClassicTemplate(data);
    case 'developer':
      return renderDeveloperTemplate(data);
    case 'modern':
    default:
      return renderModernTemplate(data);
  }
}

/**
 * Launches Puppeteer, renders HTML, and returns a PDF Buffer
 */
export async function generatePdfFromResumeData(resumeData) {
  const html = renderResumeHtml(resumeData);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '12mm',
        right: '12mm',
      },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
