const fs = require('fs');
const files = [
  "pages/appointments/[id].tsx",
  "pages/appointments/new.tsx",
  "pages/communications/email.tsx",
  "pages/communications/templates/index.tsx",
  "pages/documents/generate.tsx",
  "pages/finance/commissions/[id].tsx",
  "pages/finance/commissions/new.tsx",
  "pages/finance/invoices/[id].tsx",
  "pages/finance/invoices/new.tsx",
  "pages/finance/payments/[id].tsx",
  "pages/finance/payments/new.tsx",
  "pages/investment/auto-import.tsx",
  "pages/mandates/[id].tsx",
  "pages/mandates/[id]/edit.tsx",
  "pages/mandates/new.tsx",
  "pages/marketing/campaigns/[id].tsx",
  "pages/marketing/campaigns/index.tsx",
  "pages/marketing/campaigns/new.tsx",
  "pages/marketing/tracking/index.tsx",
  "pages/page-builder/index.tsx",
  "pages/seo-ai/index.tsx",
  "pages/seo-ai/property/[id].tsx",
  "pages/settings/index.tsx",
  "pages/settings/llm-providers.tsx",
  "pages/tasks/tasks/index.tsx",
  "pages/transactions/[id].tsx",
  "pages/transactions/new.tsx"
];

for (const file of files) {
  const path = `c:\\Users\\BOB\\Desktop\\project dev\\Immo Saas\\frontend\\${file}`;
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(/<Layout>/g, '<MainLayout>');
    fs.writeFileSync(path, content, 'utf8');
    console.log(`Fixed ${file}`);
  } else {
    console.log(`Not found: ${file}`);
  }
}
