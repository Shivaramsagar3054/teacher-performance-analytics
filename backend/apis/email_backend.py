import os
import json
import urllib.request
import urllib.error
import ssl
from django.core.mail.backends.smtp import EmailBackend as SmtpEmailBackend
from django.core.mail.backends.base import BaseEmailBackend
import certifi

class CustomSSLEmailBackend(SmtpEmailBackend):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        try:
            context = ssl.create_default_context(cafile=certifi.where())
        except Exception:
            context = ssl._create_unverified_context()
        
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        self.ssl_context = context

class ResendHTTPEmailBackend(BaseEmailBackend):
    """
    Sends emails via Resend's HTTPS REST API instead of SMTP.
    This bypasses all cloud host SMTP port blocks (ports 25, 465, 587).
    """
    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        
        api_key = os.getenv('EMAIL_HOST_PASSWORD') or os.getenv('RESEND_API_KEY')
        from_email = os.getenv('DEFAULT_FROM_EMAIL', 'onboarding@resend.dev')
        
        if not api_key:
            if not self.fail_silently:
                raise ValueError("RESEND_API_KEY or EMAIL_HOST_PASSWORD environment variable is missing.")
            return 0

        num_sent = 0
        for message in email_messages:
            try:
                html_content = ""
                if hasattr(message, 'alternatives'):
                    for content, mimetype in message.alternatives:
                        if mimetype == 'text/html':
                            html_content = content
                            break
                if not html_content:
                    html_content = f"<pre>{message.body}</pre>"

                payload = {
                    "from": from_email,
                    "to": message.to,
                    "subject": message.subject,
                    "html": html_content,
                    "text": message.body
                }

                req = urllib.request.Request(
                    "https://api.resend.com/emails",
                    data=json.dumps(payload).encode('utf-8'),
                    headers={
                        "Authorization": f"Bearer {api_key.strip()}",
                        "Content-Type": "application/json",
                        "User-Agent": "Django-Resend-HTTP/1.0"
                    },
                    method="POST"
                )

                with urllib.request.urlopen(req, timeout=10) as response:
                    if response.status in (200, 201):
                        num_sent += 1
            except urllib.error.HTTPError as http_err:
                error_body = http_err.read().decode('utf-8', errors='ignore')
                if not self.fail_silently:
                    raise RuntimeError(f"Resend HTTP API error {http_err.code}: {error_body}")
            except Exception as e:
                if not self.fail_silently:
                    raise e
        return num_sent

class BrevoHTTPEmailBackend(BaseEmailBackend):
    """
    Sends emails via Brevo's (Sendinblue) HTTPS REST API (https://api.brevo.com/v3/smtp/email).
    This bypasses all cloud host SMTP port blocks (ports 25, 465, 587).
    """
    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        
        api_key = os.getenv('BREVO_API_KEY') or os.getenv('EMAIL_HOST_PASSWORD')
        from_email = os.getenv('DEFAULT_FROM_EMAIL') or os.getenv('EMAIL_HOST_USER') or 'sagarshivaram44@gmail.com'
        
        if not api_key:
            if not self.fail_silently:
                raise ValueError("BREVO_API_KEY or EMAIL_HOST_PASSWORD environment variable is missing.")
            return 0

        num_sent = 0
        for message in email_messages:
            try:
                html_content = ""
                if hasattr(message, 'alternatives'):
                    for content, mimetype in message.alternatives:
                        if mimetype == 'text/html':
                            html_content = content
                            break
                if not html_content:
                    html_content = f"<pre>{message.body}</pre>"

                payload = {
                    "sender": {"email": from_email},
                    "to": [{"email": recipient} for recipient in message.to],
                    "subject": message.subject,
                    "htmlContent": html_content,
                    "textContent": message.body
                }

                req = urllib.request.Request(
                    "https://api.brevo.com/v3/smtp/email",
                    data=json.dumps(payload).encode('utf-8'),
                    headers={
                        "api-key": api_key.strip(),
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    method="POST"
                )

                with urllib.request.urlopen(req, timeout=10) as response:
                    if response.status in (200, 201, 202):
                        num_sent += 1
            except urllib.error.HTTPError as http_err:
                error_body = http_err.read().decode('utf-8', errors='ignore')
                if not self.fail_silently:
                    raise RuntimeError(f"Brevo HTTP API error {http_err.code}: {error_body}")
            except Exception as e:
                if not self.fail_silently:
                    raise e
        return num_sent

