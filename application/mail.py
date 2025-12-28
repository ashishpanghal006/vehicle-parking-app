import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from jinja2 import Template

SMTP_SERVER_HOST = "localhost"
SMTP_SERVER_PORT = 1025
SENDER_ADDRESS = "parkin@donotreply.in"

def send_email(to_address, subject, message, content = "html"):
    msg = MIMEMultipart()
    msg['From'] = SENDER_ADDRESS
    msg['To'] = to_address
    msg['Subject'] = subject

    msg.attach(MIMEText(message, "html" if content == "html" else "plain"))
    
    with smtplib.SMTP(SMTP_SERVER_HOST, SMTP_SERVER_PORT) as server:
        server.send_message(msg)

    return True
