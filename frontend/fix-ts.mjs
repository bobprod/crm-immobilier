import fs from 'fs';

function fixFile(file, replacer) {
  if (fs.existsSync(file)) {
    const data = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, replacer(data), 'utf8');
    console.log(`Fixed ${file}`);
  }
}

// 1. auto-import.tsx missing Head
fixFile('pages/investment/auto-import.tsx', (content) => {
  if (!content.includes("import Head")) {
    return "import Head from 'next/head';\n" + content;
  }
  return content;
});

// 2. remove duplicate imports in settings pages
const settingsPages = [
  'pages/settings/ai-billing/index.tsx',
  'pages/settings/ai-orchestrator/index.tsx',
  'pages/settings/modules/[slug].tsx',
  'pages/settings/providers/index.tsx'
];
for (const page of settingsPages) {
  fixFile(page, (content) => {
    return content.replace(/import Head from 'next\/head';\r?\nimport Head from 'next\/head';/, "import Head from 'next/head';");
  });
}

// 3. Duplicate description in PropertyFormModal.tsx
fixFile('src/modules/business/properties/components/PropertyFormModal.tsx', (content) => {
  return content.replace(/description: property\.description \|\| '',\r?\n\s+description: property\.description \|\| '',/g, "description: property.description || '',");
});

// 4. Missing properties in properties.mock.ts
fixFile('src/modules/business/properties/__mocks__/properties.mock.ts', (content) => {
  return content.replace(/updatedAt: (.*),/g, "updatedAt: $1,\n    userId: 'user-1',\n    viewsCount: 0,");
});

