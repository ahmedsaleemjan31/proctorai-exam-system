import smtplib
import os
from dotenv import load_dotenv

load_dotenv()

smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
smtp_port = int(os.getenv("SMTP_PORT", "465"))
smtp_user = os.getenv("SMTP_USER", "")
smtp_password = os.getenv("SMTP_PASSWORD", "")

print(f"User: {smtp_user}")

try:
    with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
        server.login(smtp_user, smtp_password)
        print("Login successful!")
except Exception as e:
    print(f"Login failed: {e}")
