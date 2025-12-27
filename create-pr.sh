#!/bin/bash

# Script pour créer la Pull Request
# Usage: ./create-pr.sh

set -e

echo "=== Création de la Pull Request ==="
echo ""

# Vérifier la branche actuelle
CURRENT_BRANCH=$(git branch --show-current)
echo "Branche actuelle: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "claude/real-estate-crm-ai-core-tJa5B" ]; then
  echo "❌ Erreur: Vous devez être sur la branche claude/real-estate-crm-ai-core-tJa5B"
  exit 1
fi

# Vérifier que tout est pushé
if ! git diff-index --quiet HEAD --; then
  echo "❌ Erreur: Vous avez des modifications non commitées"
  echo "Veuillez committer et pusher vos changements d'abord"
  exit 1
fi

echo "✓ Branche correcte et aucune modification en attente"
echo ""

# Vérifier si gh CLI est installé
if command -v gh &> /dev/null; then
  echo "✓ GitHub CLI (gh) détecté"
  echo ""
  echo "Création de la PR via GitHub CLI..."
  echo ""

  gh pr create \
    --base main \
    --head claude/real-estate-crm-ai-core-tJa5B \
    --title "feat: Modules AI Orchestrator et Prospecting AI - Intelligence Backend" \
    --body-file PR_DESCRIPTION.md

  echo ""
  echo "✅ Pull Request créée avec succès!"

else
  echo "❌ GitHub CLI (gh) non installé"
  echo ""
  echo "Options pour créer la PR:"
  echo ""
  echo "Option 1 - Installer GitHub CLI puis relancer ce script:"
  echo "  # Sur macOS:"
  echo "  brew install gh"
  echo ""
  echo "  # Sur Ubuntu/Debian:"
  echo "  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg"
  echo "  echo \"deb [arch=\$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main\" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null"
  echo "  sudo apt update"
  echo "  sudo apt install gh"
  echo ""
  echo "  # Puis s'authentifier:"
  echo "  gh auth login"
  echo ""
  echo "Option 2 - Via l'interface web GitHub:"
  echo "  1. Allez sur https://github.com/bobprod/crm-immobilier"
  echo "  2. Cliquez sur 'Pull requests'"
  echo "  3. Cliquez sur 'New pull request'"
  echo "  4. Base: main ← Compare: claude/real-estate-crm-ai-core-tJa5B"
  echo "  5. Titre: feat: Modules AI Orchestrator et Prospecting AI - Intelligence Backend"
  echo "  6. Copiez le contenu de PR_DESCRIPTION.md dans la description"
  echo "  7. Cliquez 'Create pull request'"
  echo ""
  echo "Option 3 - Via cURL (API GitHub):"
  echo "  export GITHUB_TOKEN='your-github-token'"
  echo "  curl -X POST https://api.github.com/repos/bobprod/crm-immobilier/pulls \\"
  echo "    -H \"Authorization: token \$GITHUB_TOKEN\" \\"
  echo "    -H \"Content-Type: application/json\" \\"
  echo "    -d '{\"title\":\"feat: Modules AI Orchestrator et Prospecting AI - Intelligence Backend\",\"head\":\"claude/real-estate-crm-ai-core-tJa5B\",\"base\":\"main\",\"body\":\"'\"$(cat PR_DESCRIPTION.md | sed 's/\"/\\\"/g' | tr '\n' ' ')\"'\"}'"
  echo ""
fi

echo ""
echo "Informations de la PR:"
echo "  Branch: claude/real-estate-crm-ai-core-tJa5B → main"
echo "  Commits: 7"
echo "  Files changed: 33"
echo "  Description: PR_DESCRIPTION.md"
echo ""
echo "Commits inclus:"
git log --oneline main..HEAD
