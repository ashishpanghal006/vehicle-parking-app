from celery import shared_task
from .models import User, ReservedParkingSpot, ParkingLot, ParkingSpot
from .utils import format_report
from .mail import send_email
import datetime
import csv
import requests

@shared_task(ignore_results = False, name = "csv_report")
def csv_report():
    reserved_spots = ReservedParkingSpot.query.all()

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_file_name = f"reserved_{timestamp}.csv"
    
    with open(f'static/{csv_file_name}', 'w', newline = "") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow([
            'Sr No', 'User Name', 'Address', 'Lot ID', 'Spot ID', 'Parking Timestamp', 'Leaving Timestamp'
        ])
        
        for idx, reservation in enumerate(reserved_spots, start=1):
            spot = ParkingSpot.query.get(reservation.spot_id)
            lot = ParkingLot.query.get(spot.lot_id)
            user = User.query.get(reservation.user_id)

            writer.writerow([
                idx, user.username, lot.address, lot.id, spot.id, reservation.parking_timestamp.isoformat(), reservation.leaving_timestamp.isoformat() if reservation.leaving_timestamp else ''
            ])

    return csv_file_name


@shared_task(ignore_results = False, name = "monthly_report")
def monthly_report():
    today = datetime.date.today()

    # previous month logic
    first_day_this_month = today.replace(day=1)
    last_day_prev_month = first_day_this_month - datetime.timedelta(days=1)
    month = last_day_prev_month.month
    year = last_day_prev_month.year

    users = User.query.all()

    for user in users:
        reservations = ReservedParkingSpot.query.filter(
            ReservedParkingSpot.user_id == user.id
        ).all()

        if not reservations:
            continue

        lot_usage = {}
        records = []

        for r in reservations:
            spot = ParkingSpot.query.get(r.spot_id)
            lot = ParkingLot.query.get(spot.lot_id)
            lot_usage[lot.location_name] = lot_usage.get(lot.location_name, 0) + 1

            records.append({
                "lot": lot.location_name,
                "spot_id": spot.id,
                "parked_at": r.parking_timestamp,
                "left_at": r.leaving_timestamp
            })
        
        most_used_lot = max(lot_usage, key=lot_usage.get)

        data = {
            "username": user.username,
            "month": last_day_prev_month.strftime("%B %Y"),
            "total_bookings": len(reservations),
            "most_used_lot": most_used_lot,
            "bookings": records
        }
          
        html = format_report('templates/mail_details.html', data)

        send_email(user.email, subject = "Monthly Parking Activity Report - ParkIn", message = html)

    return "Monthly reports sent"


@shared_task(ignore_results = False, name = "lot_updates")
def lot_report():
    text = f"Hi users, a new parking lot is created. Please check the app at http://127.0.0.1:5000"
    response = requests.post(your_google_chats, json = {"text": text})
    return "The remainder has been sent to users"
