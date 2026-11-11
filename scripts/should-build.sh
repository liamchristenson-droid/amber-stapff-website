#!/usr/bin/env bash
# Netlify "ignore" check — decides whether a new commit should rebuild the live site.
#   exit 0 = skip the build (no credits used)
#   exit 1 = build and publish
#
# Edits saved in the editor (/admin) are drafts: they are stored in GitHub but don't rebuild the site.
# The site only rebuilds when someone presses "Publish website" in the editor (which adds a commit
# starting "Publish website"), when a commit message contains "[publish]", or from a Netlify build hook.

msg="$(git log -1 --pretty=%s 2>/dev/null)"

case "$msg" in
  "Publish website"*|*"[publish]"*) echo "Publishing: $msg"; exit 1 ;;
esac

if [ -n "$INCOMING_HOOK_URL" ]; then
  echo "Publishing: triggered by build hook"; exit 1
fi

echo "Skipping build — draft saved (\"$msg\"). Press 'Publish website' in the editor to update the live site."
exit 0
