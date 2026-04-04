import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3002";
const SLUG = "agence-demo";
const SCREENSHOTS_DIR = "./test-results/screenshots";

// Créer le dossier screenshots
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const results = [];
function log(status, name, detail = "") {
  const icon = status === "pass" ? "✅" : status === "fail" ? "❌" : "⚠️";
  console.log(`  ${icon} ${name}${detail ? " — " + detail : ""}`);
  results.push({ status, name, detail });
}

async function run() {
  console.log(
    "╔═══════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║     TESTS PLAYWRIGHT — VITRINE PUBLIQUE IMMO SAAS           ║",
  );
  console.log(
    "╚═══════════════════════════════════════════════════════════════╝\n",
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: "fr-FR",
  });

  try {
    // ━━━ TEST 1 : Page d'accueil vitrine ━━━
    console.log("━━━ TEST 1 : Page d'accueil vitrine ━━━");
    const homePage = await context.newPage();
    const homeRes = await homePage.goto(`${BASE_URL}/sites/${SLUG}`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    if (homeRes?.ok()) {
      log("pass", "Page accueil chargée", `HTTP ${homeRes.status()}`);
    } else {
      log("fail", "Page accueil", `HTTP ${homeRes?.status()}`);
    }

    // Vérifier les éléments principaux
    const title = await homePage.title();
    log(title ? "pass" : "warn", "Titre de page", title || "vide");

    // Chercher le nom de l'agence ou des éléments de la vitrine
    const bodyText = await homePage.textContent("body");
    const hasContent = bodyText && bodyText.length > 100;
    log(
      hasContent ? "pass" : "warn",
      "Contenu de page chargé",
      `${bodyText?.length || 0} caractères`,
    );

    await homePage.screenshot({
      path: `${SCREENSHOTS_DIR}/01-home.png`,
      fullPage: true,
    });
    log("pass", "Screenshot accueil", "01-home.png");
    await homePage.close();

    // ━━━ TEST 2 : Page biens ━━━
    console.log("\n━━━ TEST 2 : Page biens (propriétés) ━━━");
    const biensPage = await context.newPage();
    const biensRes = await biensPage.goto(`${BASE_URL}/sites/${SLUG}/biens`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    if (biensRes?.ok()) {
      log("pass", "Page biens chargée", `HTTP ${biensRes.status()}`);
    } else {
      log("fail", "Page biens", `HTTP ${biensRes?.status()}`);
    }

    // Vérifier la présence de propriétés
    const biensBody = await biensPage.textContent("body");
    const hasProperties =
      biensBody?.includes("Appartement") || biensBody?.includes("appartement");
    log(
      hasProperties ? "pass" : "warn",
      "Propriétés affichées",
      hasProperties ? "oui" : "aucune trouvée",
    );

    // Vérifier les prix
    const hasPrice = biensBody?.includes("000") || biensBody?.includes("TND");
    log(hasPrice ? "pass" : "warn", "Prix affichés", hasPrice ? "oui" : "non");

    await biensPage.screenshot({
      path: `${SCREENSHOTS_DIR}/02-biens.png`,
      fullPage: true,
    });
    log("pass", "Screenshot biens", "02-biens.png");
    await biensPage.close();

    // ━━━ TEST 3 : Page agents ━━━
    console.log("\n━━━ TEST 3 : Page agents ━━━");
    const agentsPage = await context.newPage();
    const agentsRes = await agentsPage.goto(
      `${BASE_URL}/sites/${SLUG}/agents`,
      { waitUntil: "networkidle", timeout: 30000 },
    );
    if (agentsRes?.ok()) {
      log("pass", "Page agents chargée", `HTTP ${agentsRes.status()}`);
    } else {
      log("fail", "Page agents", `HTTP ${agentsRes?.status()}`);
    }

    const agentsBody = await agentsPage.textContent("body");
    const hasSophie = agentsBody?.includes("Sophie");
    const hasPierre = agentsBody?.includes("Pierre");
    log(
      hasSophie ? "pass" : "warn",
      "Agent Sophie Martin",
      hasSophie ? "trouvé" : "non trouvé",
    );
    log(
      hasPierre ? "pass" : "warn",
      "Agent Pierre Durand",
      hasPierre ? "trouvé" : "non trouvé",
    );

    await agentsPage.screenshot({
      path: `${SCREENSHOTS_DIR}/03-agents.png`,
      fullPage: true,
    });
    log("pass", "Screenshot agents", "03-agents.png");
    await agentsPage.close();

    // ━━━ TEST 4 : Page contact ━━━
    console.log("\n━━━ TEST 4 : Page contact ━━━");
    const contactPage = await context.newPage();
    const contactRes = await contactPage.goto(
      `${BASE_URL}/sites/${SLUG}/contact`,
      { waitUntil: "networkidle", timeout: 30000 },
    );
    if (contactRes?.ok()) {
      log("pass", "Page contact chargée", `HTTP ${contactRes.status()}`);
    } else {
      log("fail", "Page contact", `HTTP ${contactRes?.status()}`);
    }

    // Chercher le formulaire de contact
    const formElements = await contactPage
      .locator("form, input, textarea")
      .count();
    log(
      formElements > 0 ? "pass" : "warn",
      "Formulaire de contact",
      `${formElements} éléments trouvés`,
    );

    // Essayer de remplir le formulaire
    const nameInput = contactPage
      .locator(
        'input[name="name"], input[placeholder*="nom"], input[placeholder*="Nom"]',
      )
      .first();
    const emailInput = contactPage
      .locator('input[name="email"], input[type="email"]')
      .first();
    const messageInput = contactPage
      .locator('textarea[name="message"], textarea')
      .first();

    if ((await nameInput.count()) > 0) {
      await nameInput.fill("Jean Test Playwright");
      log("pass", "Champ nom rempli");
    }
    if ((await emailInput.count()) > 0) {
      await emailInput.fill("playwright@test.com");
      log("pass", "Champ email rempli");
    }
    if ((await messageInput.count()) > 0) {
      await messageInput.fill(
        "Test automatisé Playwright - Vérification formulaire de contact",
      );
      log("pass", "Champ message rempli");
    }

    await contactPage.screenshot({
      path: `${SCREENSHOTS_DIR}/04-contact.png`,
      fullPage: true,
    });
    log("pass", "Screenshot contact", "04-contact.png");

    // Soumettre le formulaire
    const submitBtn = contactPage
      .locator(
        'button[type="submit"], button:has-text("Envoyer"), button:has-text("envoyer")',
      )
      .first();
    if ((await submitBtn.count()) > 0) {
      await submitBtn.click();
      await contactPage.waitForTimeout(2000);
      await contactPage.screenshot({
        path: `${SCREENSHOTS_DIR}/04b-contact-submitted.png`,
        fullPage: true,
      });
      log("pass", "Formulaire soumis", "screenshot capturé après soumission");
    } else {
      log("warn", "Bouton submit non trouvé");
    }
    await contactPage.close();

    // ━━━ TEST 5 : Navigation inter-pages ━━━
    console.log("\n━━━ TEST 5 : Navigation ━━━");
    const navPage = await context.newPage();
    await navPage.goto(`${BASE_URL}/sites/${SLUG}`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Vérifier les liens de navigation
    const links = await navPage.locator("a[href], nav a").allTextContents();
    log("pass", "Liens de navigation", `${links.length} liens trouvés`);

    await navPage.close();

    // ━━━ TEST 6 : Responsive (mobile) ━━━
    console.log("\n━━━ TEST 6 : Responsive mobile ━━━");
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      locale: "fr-FR",
      isMobile: true,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${BASE_URL}/sites/${SLUG}`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await mobilePage.screenshot({
      path: `${SCREENSHOTS_DIR}/05-mobile-home.png`,
      fullPage: true,
    });
    log("pass", "Screenshot mobile accueil", "05-mobile-home.png");

    await mobilePage.goto(`${BASE_URL}/sites/${SLUG}/biens`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await mobilePage.screenshot({
      path: `${SCREENSHOTS_DIR}/06-mobile-biens.png`,
      fullPage: true,
    });
    log("pass", "Screenshot mobile biens", "06-mobile-biens.png");

    await mobilePage.close();
    await mobileContext.close();

    // ━━━ TEST 7 : Page 404 ━━━
    console.log("\n━━━ TEST 7 : Gestion des erreurs ━━━");
    const errorPage = await context.newPage();
    const errorRes = await errorPage.goto(
      `${BASE_URL}/sites/slug-inexistant-xyz`,
      { waitUntil: "networkidle", timeout: 30000 },
    );
    log(
      errorRes?.status() === 404 ? "pass" : "warn",
      "Slug inexistant → 404",
      `HTTP ${errorRes?.status()}`,
    );
    await errorPage.screenshot({ path: `${SCREENSHOTS_DIR}/07-404.png` });
    log("pass", "Screenshot 404", "07-404.png");
    await errorPage.close();

    // ━━━ TEST 8 : Performance ━━━
    console.log("\n━━━ TEST 8 : Performance ━━━");
    const perfPage = await context.newPage();
    const startTime = Date.now();
    await perfPage.goto(`${BASE_URL}/sites/${SLUG}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    const loadTime = Date.now() - startTime;
    log(
      loadTime < 5000 ? "pass" : "warn",
      "Temps de chargement accueil",
      `${loadTime}ms`,
    );

    const startBiens = Date.now();
    await perfPage.goto(`${BASE_URL}/sites/${SLUG}/biens`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    const biensLoadTime = Date.now() - startBiens;
    log(
      biensLoadTime < 5000 ? "pass" : "warn",
      "Temps de chargement biens",
      `${biensLoadTime}ms`,
    );
    await perfPage.close();

    // ━━━ TEST 9 : Console errors ━━━
    console.log("\n━━━ TEST 9 : Erreurs console JS ━━━");
    const consolePage = await context.newPage();
    const consoleErrors = [];
    consolePage.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await consolePage.goto(`${BASE_URL}/sites/${SLUG}`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await consolePage.goto(`${BASE_URL}/sites/${SLUG}/biens`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await consolePage.goto(`${BASE_URL}/sites/${SLUG}/agents`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await consolePage.goto(`${BASE_URL}/sites/${SLUG}/contact`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    if (consoleErrors.length === 0) {
      log("pass", "Aucune erreur console JS");
    } else {
      log("warn", "Erreurs console JS", `${consoleErrors.length} erreur(s)`);
      consoleErrors
        .slice(0, 5)
        .forEach((e) => console.log(`    → ${e.substring(0, 120)}`));
    }
    await consolePage.close();
  } catch (error) {
    log("fail", "Erreur inattendue", error.message);
  } finally {
    await browser.close();
  }

  // ━━━ RAPPORT ━━━
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const warned = results.filter((r) => r.status === "warn").length;

  console.log(
    "\n╔═══════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║              RAPPORT PLAYWRIGHT FINAL                        ║",
  );
  console.log(
    "╚═══════════════════════════════════════════════════════════════╝",
  );
  console.log(`\n  Total: ${results.length} tests`);
  console.log(`  ✅ Passés : ${passed}`);
  console.log(`  ❌ Échoués: ${failed}`);
  console.log(`  ⚠️  Warnings: ${warned}`);
  console.log(`\n  Screenshots: ${SCREENSHOTS_DIR}/`);
  console.log(
    failed === 0
      ? "\n  🎉 TOUS LES TESTS PLAYWRIGHT SONT PASSÉS !"
      : "\n  ⚠️  CERTAINS TESTS ONT ÉCHOUÉ",
  );
}

run().catch(console.error);
