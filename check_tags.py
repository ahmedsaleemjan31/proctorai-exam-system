
import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

# Remove comments
content = re.sub(r'//.*', '', content)
content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)

# Simple regex to find tags
# This is not perfect but should give us a hint
tags = re.findall(r'<([a-zA-Z0-9\.]+)|</([a-zA-Z0-9\.]+)>', content)

stack = []
for open_tag, close_tag in tags:
    if open_tag:
        # Check if self-closing
        # We need a better way to find the end of the tag
        pass
    elif close_tag:
        pass

# Let's try a different approach: find all < and >
pos = 0
while True:
    start = content.find('<', pos)
    if start == -1: break
    end = content.find('>', start)
    if end == -1: break
    
    tag_content = content[start+1:end].strip()
    if not tag_content:
        pos = end + 1
        continue
    
    if tag_content.startswith('!'): # Comment or doctype
        pos = end + 1
        continue
        
    if tag_content.startswith('/'):
        tag_name = tag_content[1:].strip()
        if not stack:
            print(f"Extra closing tag </{tag_name}> near {start}")
        else:
            top = stack.pop()
            if top != tag_name and not (top == "" and tag_name == ""): # Fragment support
                print(f"Mismatch: <{top}> closed by </{tag_name}> near {start}")
    elif tag_content.endswith('/'):
        # Self-closing
        pass
    else:
        tag_name = tag_content.split()[0]
        # Ignore components that start with uppercase? No, check all.
        # But some tags like <input> in HTML are self-closing. 
        # In JSX, they must be self-closing or have a closing tag.
        stack.append(tag_name)
    
    pos = end + 1

if stack:
    print("Unclosed tags:", stack)
else:
    print("All tags balanced (according to simple parser)")
