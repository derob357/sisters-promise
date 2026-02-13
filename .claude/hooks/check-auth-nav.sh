#!/bin/bash
# Post-edit hook: Warn if an HTML file with a navbar is missing auth-nav-item
# Receives JSON on stdin with tool_input containing file_path

# Read stdin for the JSON input
INPUT=$(cat)

# Extract the file path from the tool input
FILE=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    # For Edit/Write tools, file_path is in tool_input
    ti = data.get('tool_input', {})
    print(ti.get('file_path', ti.get('file', '')))
except:
    print('')
" 2>/dev/null)

# Only check .html files in the project root or pages/ directory
case "$FILE" in
  *.html)
    # Skip if file doesn't exist
    [ -f "$FILE" ] || exit 0

    # Check if file has a navbar
    if grep -q 'navbar-nav' "$FILE" 2>/dev/null; then
      # Check if auth-nav-item is present
      if ! grep -q 'id="auth-nav-item"' "$FILE" 2>/dev/null; then
        echo "WARNING: $FILE has a navbar but is missing id=\"auth-nav-item\". Did you forget to add it?"
      fi
    fi
    ;;
esac
exit 0
