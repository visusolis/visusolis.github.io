#!/usr/bin/env python3
"""
Helper script to update the secret page message and password.
This script encodes a single message and generates password hash for the hidden page.
"""

import base64
import hashlib
import os

def encode_message(text):
    """Encode a message to Base64."""
    return base64.b64encode(text.encode('utf-8')).decode('utf-8')

def hash_password(password):
    """Generate SHA-256 hash of password."""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def update_js_file(message, password_hash):
    """Update the JavaScript file with new message and password."""

    # Get the path to the JS file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    js_path = os.path.join(script_dir, '..', 'static', 'assets', 's.js')

    # Encode message
    encoded_message = encode_message(message)

    # Create the new JavaScript content
    js_content = f"""(function(){{const _0x5f2a={{p:'{password_hash}',m:'{encoded_message}'}};async function h(s){{const e=new TextEncoder().encode(s);const b=await crypto.subtle.digest('SHA-256',e);return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');}}function dec(s){{return atob(s);}}function show(m){{const c=document.getElementById('s-content');const o=document.getElementById('s-overlay');c.innerHTML='<div class="s-msg">'+m+'</div>';o.style.display='none';c.style.display='block';}}function err(){{document.getElementById('s-error').textContent='incorrect password';}}const i=document.getElementById('s-pwd');i.addEventListener('keypress',async function(e){{if(e.key==='Enter'){{const v=i.value;const hv=await h(v);if(hv===_0x5f2a.p){{show(dec(_0x5f2a.m));}}else{{err();}}}}}});i.focus();}})();
"""

    # Write to file
    with open(js_path, 'w') as f:
        f.write(js_content)

    print(f"✓ Updated {js_path}")

def main():
    print("=== Secret Page Message Updater ===\n")

    # Get password
    print("Enter new password (or press Enter to keep current 'foxmessage'):")
    new_password = input("> ").strip()
    if not new_password:
        new_password = "foxmessage"

    password_hash = hash_password(new_password)
    print(f"✓ Password hash: {password_hash[:16]}...\n")

    # Get message
    print("Enter your secret message (press Enter twice when done):\n")
    lines = []
    while True:
        line = input()
        if not line and lines:  # Empty line and we have content
            break
        if line or not lines:  # Add line if not empty, or if it's the first line
            lines.append(line)

    message = '\n'.join(lines).strip()
    if not message:
        message = "This is a placeholder message. Update me!"

    # Preview
    print("\n=== Preview ===")
    print(f"Password: {new_password}")
    print(f"\nMessage:")
    preview = message[:100] + "..." if len(message) > 100 else message
    print(f"  {preview}")

    print("\nUpdate the JavaScript file? (y/n):")
    confirm = input("> ").strip().lower()

    if confirm == 'y':
        update_js_file(message, password_hash)
        print("\n✓ Secret page updated successfully!")
        print(f"\nThe page will be accessible at /secret/")
        print(f"Password: {new_password}")
    else:
        print("\nCancelled.")

if __name__ == "__main__":
    main()
