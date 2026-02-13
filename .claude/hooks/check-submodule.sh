#!/bin/bash
# Post-tool hook: After git commit, check if SistersPromiseMobile has unpushed changes
# Receives JSON on stdin with tool_input

INPUT=$(cat)

# Extract the command that was run
CMD=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null)

# Only run after git commit commands
case "$CMD" in
  *"git commit"*)
    # Check submodule for unpushed commits
    SUBMODULE_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}/SistersPromiseMobile"
    if [ -d "$SUBMODULE_DIR/.git" ] || [ -f "$SUBMODULE_DIR/.git" ]; then
      cd "$SUBMODULE_DIR" 2>/dev/null || exit 0
      UNPUSHED=$(git log --oneline @{u}..HEAD 2>/dev/null | wc -l | tr -d ' ')
      if [ "$UNPUSHED" -gt "0" ]; then
        echo "REMINDER: SistersPromiseMobile submodule has $UNPUSHED unpushed commit(s). Run /deploy or push manually."
      fi
    fi
    ;;
esac
exit 0
