#!/usr/bin/env bash
# compare_git_repos.sh
# Usage: ./compare_git_repos.sh <repo-or-gitdir-A> <repo-or-gitdir-B>
# Accepts either the repository root (containing .git) or the .git directory itself.

set -euo pipefail

usage(){
  echo "Usage: $0 <repo-root-or-gitdir-A> <repo-root-or-gitdir-B>"
  echo "Examples:"
  echo "  $0 '/c/Users/DELL/Desktop/project dev/CRM_IMMOBILIER_COMPLET_FINAL' '/c/Users/DELL/Desktop/project dev/CRM_IMMOBILIER_COMPLET_FINAL/.git version'"
  exit 1
}

if [ "$#" -ne 2 ]; then
  usage
fi

prepare_paths(){
  local input="$1"
  local gitdir worktree

  if [ -d "$input/.git" ]; then
    gitdir="$input/.git"
    worktree="$input"
  elif [ -d "$input" ] && [ -f "$input/HEAD" ]; then
    # input looks like a .git directory already
    gitdir="$input"
    worktree="$(dirname "$input")"
  else
    echo "Error: path '$input' not a repo root nor a .git directory"
    exit 2
  fi

  echo "$gitdir|$worktree"
}

gather_info(){
  local gitdir="$1"
  local worktree="$2"

  # ensure git can read this repo
  if ! git --git-dir="$gitdir" --work-tree="$worktree" rev-parse --git-dir >/dev/null 2>&1; then
    echo "ERROR|Cannot open git repo ($gitdir)"
    return
  fi

  local branch
  branch=$(git --git-dir="$gitdir" --work-tree="$worktree" rev-parse --abbrev-ref HEAD 2>/dev/null || true)
  local last_date_ts
  last_date_ts=$(git --git-dir="$gitdir" --work-tree="$worktree" show -s --format=%ct HEAD 2>/dev/null || echo 0)
  local last_date
  last_date=$(git --git-dir="$gitdir" --work-tree="$worktree" show -s --format=%ci HEAD 2>/dev/null || echo "<no-commit>")
  local full_hash
  full_hash=$(git --git-dir="$gitdir" --work-tree="$worktree" rev-parse HEAD 2>/dev/null || echo "<no-hash>")
  local short_hash
  short_hash=$(git --git-dir="$gitdir" --work-tree="$worktree" rev-parse --short HEAD 2>/dev/null || echo "<no-hash>")
  local message
  message=$(git --git-dir="$gitdir" --work-tree="$worktree" log -1 --pretty=format:%s 2>/dev/null || echo "<no-message>")
  local remotes
  remotes=$(git --git-dir="$gitdir" --work-tree="$worktree" remote -v 2>/dev/null | sed -n '1,10p' || echo "<no-remote>")

  printf '%s|%s|%s|%s|%s|%s|%s\n' "$worktree" "$gitdir" "$branch" "$last_date_ts" "$last_date" "$short_hash" "$message"
  # print remotes after as multi-line for clarity
  echo "REMOTES_START"
  echo "$remotes"
  echo "REMOTES_END"
}

echo "Comparing repos..."

left_raw=$(prepare_paths "$1")
right_raw=$(prepare_paths "$2")

left_gitdir=$(echo "$left_raw" | cut -d'|' -f1)
left_worktree=$(echo "$left_raw" | cut -d'|' -f2)
right_gitdir=$(echo "$right_raw" | cut -d'|' -f1)
right_worktree=$(echo "$right_raw" | cut -d'|' -f2)

echo
echo "Repository A: $left_worktree"
gather_info "$left_gitdir" "$left_worktree"
echo
echo "Repository B: $right_worktree"
gather_info "$right_gitdir" "$right_worktree"

# Extract timestamps for comparison
left_ts=$(git --git-dir="$left_gitdir" --work-tree="$left_worktree" show -s --format=%ct HEAD 2>/dev/null || echo 0)
right_ts=$(git --git-dir="$right_gitdir" --work-tree="$right_worktree" show -s --format=%ct HEAD 2>/dev/null || echo 0)

echo
echo "SUMMARY"
if [ "$left_ts" -eq 0 ] && [ "$right_ts" -eq 0 ]; then
  echo "Neither repository has readable commits. Check paths."
  exit 3
fi

if [ "$left_ts" -gt "$right_ts" ]; then
  echo "=> Repository A ($left_worktree) is more recent."
elif [ "$right_ts" -gt "$left_ts" ]; then
  echo "=> Repository B ($right_worktree) is more recent."
else
  echo "=> Both repositories have the same last commit timestamp (likely same commit)."
fi

echo
echo "Tips: If paths contain spaces, quote them as in the usage examples above."

exit 0
