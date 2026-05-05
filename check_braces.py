

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

stack = []
pairs = {'{': '}', '(': ')', '[': ']'}
for i, char in enumerate(content):
    if char in pairs:
        stack.append((char, i))
    elif char in pairs.values():
        if not stack:
            print(f"Extra closing {char} at index {i}")
        else:
            top, pos = stack.pop()
            if pairs[top] != char:
                print(f"Mismatch: {top} at {pos} closed by {char} at {i}")
                # Context for mismatch
                start = max(0, pos - 20)
                end = min(len(content), pos + 20)
                print(f"Start context: {content[start:end]}")
                start = max(0, i - 20)
                end = min(len(content), i + 20)
                print(f"End context: {content[start:end]}")

if stack:
    for char, pos in stack:
        print(f"Unclosed {char} at index {pos}")
        start = max(0, pos - 20)
        end = min(len(content), pos + 20)
        print(f"Context: {content[start:end]}")
else:
    print("All brackets are balanced")

