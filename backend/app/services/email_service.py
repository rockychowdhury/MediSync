import os
import shutil
from datetime import datetime
from typing import List, Dict, Any
from pathlib import Path

from fastapi import BackgroundTasks
from app.core.config import settings

class EmailService:
    """
    Centralized service for sending emails.
    Handles environment-specific behavior:
    - DEBUG=True: Saves emails to backend/emails/ folder.
    - DEBUG=False: Sends via SMTP.
    """
    
    EMAILS_DIR = Path("emails")

    @classmethod
    def _save_to_file(cls, subject: str, recipients: List[str], body: str):
        """Helper to save email content to a local HTML file for development."""
        if not cls.EMAILS_DIR.exists():
            cls.EMAILS_DIR.mkdir(parents=True, exist_ok=True)
            
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{subject.replace(' ', '_')}.html"
        file_path = cls.EMAILS_DIR / filename
        
        content = f"""
        <div style="background: #f4f4f4; padding: 20px; font-family: sans-serif;">
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                <p><strong>To:</strong> {", ".join(recipients)}</p>
                <p><strong>Subject:</strong> {subject}</p>
                <hr/>
                {body}
            </div>
        </div>
        """
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        
        return str(file_path)

    @classmethod
    def send_email(cls, subject: str, recipients: List[str], body: str):
        """Send an email based on the current environment."""
        if settings.DEBUG:
            print(f"[DEBUG EMAIL] Saving email to file: {subject}")
            cls._save_to_file(subject, recipients, body)
            return

        # Production SMTP Logic
        # For production, we'll use standard smtplib for minimal dependencies
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        if not settings.MAIL_SERVER:
            print("[WARNING] MAIL_SERVER not configured, email not sent.")
            return

        msg = MIMEMultipart()
        msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
        msg["To"] = ", ".join(recipients)
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))

        try:
            with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT) as server:
                if settings.MAIL_USERNAME and settings.MAIL_PASSWORD:
                    server.starttls()
                    server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
                server.send_message(msg)
        except Exception as e:
            print(f"[ERROR] Failed to send email: {e}")

    @classmethod
    def send_password_reset_email(cls, email: str, token: str):
        """Send a password reset link to a user."""
        subject = "MediSync - Password Reset Request"
        # In a real app, this would be a link to your frontend
        reset_link = f"http://localhost:3000/reset-password?token={token}"
        
        body = f"""
        <h2>Reset Your Password</h2>
        <p>You requested a password reset for your MediSync account.</p>
        <p>Click the link below to set a new password. This link will expire in 15 minutes.</p>
        <p><a href="{reset_link}" style="display:inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        """
        cls.send_email(subject, [email], body)

    @classmethod
    def send_account_activation_email(cls, email: str, name: str):
        """Notify a user that their account has been activated."""
        subject = "MediSync - Account Activated"
        body = f"""
        <h2>Welcome to MediSync, {name}!</h2>
        <p>Your account has been activated by the administrator.</p>
        <p>You can now login to your portal using your registered email and password.</p>
        <p><a href="http://localhost:3000/login" style="display:inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px;">Login Now</a></p>
        """
        cls.send_email(subject, [email], body)
