import logging
import smtplib
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate, make_msgid

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, html_body: str, plain_body: str) -> bool:
    """Send an email via SMTP with both HTML and plain-text parts.

    In development (no SMTP configured), logs the email to console instead.
    """
    if not settings.smtp_host or not settings.smtp_user:
        logger.warning(
            "SMTP not configured — email not sent.\n"
            "  To: %s\n  Subject: %s\n  Plain body:\n%s",
            to, subject, plain_body,
        )
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = formataddr((settings.smtp_from_name, settings.smtp_from_email))
    msg["To"] = to
    msg["Subject"] = subject
    msg["Reply-To"] = settings.smtp_from_email
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain=settings.smtp_from_email.split("@")[-1])

    # Plain text FIRST, then HTML — RFC 2046 says last part is preferred,
    # so mail clients show HTML but spam filters see we have both.
    msg.attach(MIMEText(plain_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, to, msg.as_string())
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to)
        return False


def _email_html_wrapper(content: str) -> str:
    """Wrap email content in a proper HTML document structure.

    Using a full DOCTYPE + html + body structure prevents spam filters
    from flagging the email as a bare HTML fragment.
    """
    return f"""\
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nutrition Hub Bangladesh</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f7f7; -webkit-text-size-adjust: 100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e8e8e8;">
          <!-- Header -->
          <tr>
            <td style="background-color: #1a1a2e; padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 800; color: #c9a55a; letter-spacing: 0.5px;">
                Nutrition Hub Bangladesh
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              {content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #fafafa; border-top: 1px solid #eee; text-align: center;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #999; line-height: 1.5;">
                Nutrition Hub Bangladesh &mdash; 100% Authentic Supplements<br />
                Delivered nationwide via Pathao Courier
              </p>
              <p style="margin: 8px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #bbb;">
                This is a transactional email from Nutrition Hub Bangladesh.<br />
                You received this because of an action on your account.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_verification_email(to: str, verify_url: str) -> bool:
    """Send an email verification link to a newly registered user."""
    subject = "Verify your email - Nutrition Hub Bangladesh"

    content = f"""\
              <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #1a1a2e;">
                Verify Your Email Address
              </h2>
              <p style="margin: 0 0 8px; font-size: 15px; color: #444; line-height: 1.6;">
                Hi there! Thanks for creating your Nutrition Hub Bangladesh account.
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; color: #444; line-height: 1.6;">
                Please confirm your email address by clicking the button below.
                This link is valid for <strong>24 hours</strong>.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="{verify_url}"
                       style="display: inline-block; background-color: #c9a55a; color: #1a1a2e; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: bold; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 8px; font-size: 13px; color: #888; line-height: 1.5;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 16px; font-size: 12px; color: #c9a55a; word-break: break-all; line-height: 1.4;">
                {verify_url}
              </p>
              <p style="margin: 0; font-size: 13px; color: #888; line-height: 1.5;">
                If you didn't create an account with us, you can safely ignore this email.
              </p>"""

    html = _email_html_wrapper(content)

    plain = f"""\
Verify Your Email Address

Hi there! Thanks for creating your Nutrition Hub Bangladesh account.

Please confirm your email address by visiting the link below.
This link is valid for 24 hours.

Verify here: {verify_url}

If you didn't create an account with us, you can safely ignore this email.

---
Nutrition Hub Bangladesh - 100% Authentic Supplements
Delivered nationwide via Pathao Courier
"""

    return send_email(to, subject, html, plain)


def send_password_reset_email(to: str, reset_url: str) -> bool:
    """Send a password reset email with the given reset link."""
    subject = "Reset your password - Nutrition Hub Bangladesh"

    content = f"""\
              <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #1a1a2e;">
                Reset Your Password
              </h2>
              <p style="margin: 0 0 8px; font-size: 15px; color: #444; line-height: 1.6;">
                We received a request to reset the password for your Nutrition Hub Bangladesh account.
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; color: #444; line-height: 1.6;">
                Click the button below to set a new password.
                This link is valid for <strong>30 minutes</strong>.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="{reset_url}"
                       style="display: inline-block; background-color: #c9a55a; color: #1a1a2e; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: bold; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 8px; font-size: 13px; color: #888; line-height: 1.5;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 16px; font-size: 12px; color: #c9a55a; word-break: break-all; line-height: 1.4;">
                {reset_url}
              </p>
              <p style="margin: 0; font-size: 13px; color: #888; line-height: 1.5;">
                If you didn't request a password reset, you can safely ignore this email.
                Your password will not be changed.
              </p>"""

    html = _email_html_wrapper(content)

    plain = f"""\
Reset Your Password

We received a request to reset the password for your Nutrition Hub Bangladesh account.

Click the link below to set a new password.
This link is valid for 30 minutes.

Reset here: {reset_url}

If you didn't request a password reset, you can safely ignore this email.
Your password will not be changed.

---
Nutrition Hub Bangladesh - 100% Authentic Supplements
Delivered nationwide via Pathao Courier
"""

    return send_email(to, subject, html, plain)
