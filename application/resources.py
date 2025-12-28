from flask_restful import Api, Resource, reqparse
from .models import *
from flask_security import auth_required, roles_required, roles_accepted, current_user
from .cache import cache
from .utils import roles_list
import pytz
from .tasks import lot_report

api = Api(prefix="/api")


create_lot_parser = reqparse.RequestParser()
create_lot_parser.add_argument("location_name", type=str)
create_lot_parser.add_argument("address", type=str)
create_lot_parser.add_argument("price", type=int)
create_lot_parser.add_argument("no_of_spots", type=int)

edit_parking_lot_parser = reqparse.RequestParser()
edit_parking_lot_parser.add_argument('location_name', type=str)
edit_parking_lot_parser.add_argument('price', type=int)
edit_parking_lot_parser.add_argument('address', type=str)
edit_parking_lot_parser.add_argument('no_of_spots', type=int)

class ParkingLotApi(Resource):
    @cache.cached(timeout=300, key_prefix="admin_parking_lots")
    @auth_required("token")
    @roles_required("admin")
    def get(self):
        lots = ParkingLot.query.all()
        lot_list = []

        for lot in lots:
            this_lot = {}
            this_lot["id"] = lot.id
            this_lot["address"] = lot.address
            this_lot["location_name"] = lot.location_name
            this_lot["price"] = lot.price
            this_lot["no_of_spots"] = lot.no_of_spots
            this_lot["spots"] = []

            spots = ParkingSpot.query.filter_by(lot_id = lot.id).all()
            for spot in spots:
                this_lot["spots"].append({
                    "id": spot.id,
                    "status": spot.status
                })

            lot_list.append(this_lot)

        return lot_list, 200



    @auth_required("token")
    @roles_required("admin")
    def post(self):
        args = create_lot_parser.parse_args()

        existing_lot = ParkingLot.query.filter_by(location_name=args["location_name"]).first()
        if existing_lot:
            return {
                "message": "Location name already exists. Please choose a different name."
            }, 400
        
        lot = ParkingLot(
            location_name = args["location_name"],
            address = args["address"],
            price = args["price"],
            no_of_spots = args["no_of_spots"]
        )
        db.session.add(lot)
        db.session.commit()
        
        for _ in range(args["no_of_spots"]):
            new_spot = ParkingSpot(lot_id = lot.id, status = "available")
            db.session.add(new_spot)
        
        db.session.commit()
        cache.delete("admin_parking_lots")
        cache.delete("user_parking_lots")

        result = lot_report()

        return {
            "message" : "Parking lot and spots created successfully."
        }, 201
    

    @auth_required('token')
    @roles_required('admin')
    def delete(self, id):
        lot = ParkingLot.query.get(id)
        if not lot:
            return {"message" : "Parking lot not found."}, 400
        
        for spot in lot.spots:
            if spot.status != 'available':
                return {"message": "Cannot delete parking lot. Some spots are not available."}, 400
        
        for spot in lot.spots:
            db.session.delete(spot)
        
        db.session.delete(lot)
        db.session.commit()
        cache.delete("admin_parking_lots")
        cache.delete("user_parking_lots")

        return {"message": "Parking lot deleted successfully."}, 200
    

    @auth_required('token')
    @roles_required('admin')
    def put(self, id):
        lot = ParkingLot.query.get(id)
        if not lot:
            return {"message" : "Parking lot not found."}, 404
        args = edit_parking_lot_parser.parse_args()

        old_spots = lot.no_of_spots
        new_spots = args['no_of_spots']

        if args['location_name']:
            lot.location_name = args['location_name']
        if args['price'] is not None:
            lot.price = args['price']
        if args['address']:
            lot.address = args['address']

        if new_spots is not None and new_spots != old_spots:
            if new_spots > old_spots:
                diff = new_spots - old_spots
                for _ in range(diff):
                    new_spot = ParkingSpot(
                        lot_id = lot.id,
                        status = "available"
                    )
                    db.session.add(new_spot)

            elif new_spots < old_spots:
                diff = old_spots - new_spots
                extra_spots = ParkingSpot.query.filter_by(lot_id = id).order_by(ParkingSpot.id.desc()).limit(diff).all()
                for spot in extra_spots:
                    if spot.status == "booked":
                        return {
                            "message": "Cannot reduce spots - some of the spots are booked."
                        }, 400
                
                for spot in extra_spots:
                    db.session.delete(spot)
            lot.no_of_spots = new_spots
        
        db.session.commit()
        cache.delete("admin_parking_lots")
        cache.delete("user_parking_lots")
        return {"message" : "Parking lot updated successfully."}, 200
    

class ParkingSpotDetails(Resource):
    @auth_required('token')
    @roles_required('admin')
    def get(self, spot_id):
        spot = ParkingSpot.query.get(spot_id)
        if not spot:
            return {"message" : "Spot not found"}, 404
        
        lot = ParkingLot.query.get(spot.lot_id)
        reservation = ReservedParkingSpot.query.filter_by(spot_id=spot.id, leaving_timestamp=None).first()
        
        response = {}
        response["spot_id"] = spot.id
        response["status"] = spot.status
        response["lot_id"] = spot.lot_id
        response["lot_price"] = lot.price

        if reservation:
            response["customer_id"] = reservation.user_id
            response["parking_timestamp"] = reservation.parking_timestamp.isoformat()
            response["parking_cost"] = reservation.parking_cost

        return response, 200
    

    @auth_required('token')
    @roles_required('admin')
    def delete(self, spot_id):
        spot = ParkingSpot.query.get(spot_id)

        if not spot:
            return {"message": "Spot not found"}, 404
        
        if spot.status != "available":
            return {"message": "Cannot delete. Spot is booked."}, 400
        
        lot = ParkingLot.query.get(spot.lot_id)
        lot.no_of_spots -= 1

        db.session.delete(spot)
        db.session.commit()
        cache.delete("admin_parking_lots")
        cache.delete("user_parking_lots")

        return {"message": "Spot deleted successfully"}, 200
    

class BookParkingSpot(Resource):
    @auth_required('token')
    @roles_accepted('user', 'admin')
    def get(self):
        if 'admin' in roles_list(current_user.roles):
            bookings = ReservedParkingSpot.query.all()
        else:
            bookings = current_user.reservations

        bookings = sorted(
            bookings,
            key=lambda b: (
                b.leaving_timestamp is not None,
                -b.parking_timestamp.timestamp()
            ),
        )
        
        reserved_bookings = []
        for booking in bookings:
            spot = ParkingSpot.query.get(booking.spot_id)
            lot = ParkingLot.query.get(spot.lot_id)

            total_hours = None
            total_cost = None

            if booking.leaving_timestamp:
                duration = booking.leaving_timestamp - booking.parking_timestamp
                total_hours = round(duration.total_seconds() / 3600, 2)
                total_cost = round(total_hours * booking.parking_cost, 2)

            this_booking = {}
            this_booking['reservation_id'] = booking.id
            this_booking['user_id'] = booking.user_id
            this_booking['spot_id'] = booking.spot_id
            this_booking['parking_timestamp'] = booking.parking_timestamp.isoformat()
            this_booking['leaving_timestamp'] = booking.leaving_timestamp.isoformat() if booking.leaving_timestamp else None
            this_booking['lot_location'] = lot.location_name
            this_booking['spot_status'] = 'booked' if booking.leaving_timestamp is None else 'available'
            this_booking['parking_cost'] = booking.parking_cost
            this_booking['total_hours'] = total_hours
            this_booking['total_cost'] = total_cost
            reserved_bookings.append(this_booking)
            
        if reserved_bookings:
            return reserved_bookings
        return {
            "message": "No bookings found"
        }, 404


    @auth_required("token")
    @roles_required("user")
    def post(self, lot_id):
        lot = ParkingLot.query.get(lot_id)
        spot = ParkingSpot.query.filter_by(lot_id=lot_id, status="available").first()
        spot.status = "booked"
        reserved_spot = ReservedParkingSpot(
            user_id = current_user.id,
            spot_id = spot.id,
            parking_timestamp = datetime.now(pytz.timezone("Asia/Kolkata")),
            parking_cost = lot.price
        )
        db.session.add(reserved_spot)
        db.session.commit()
        cache.delete("admin_parking_lots")
        cache.delete("user_parking_lots")

        return {
            "message" : "Spot booked successfully"
        }, 200


class ReleaseParkingSpotApi(Resource):
    @auth_required('token')
    @roles_required('user')
    def post(self, reservation_id):
        reservation = ReservedParkingSpot.query.get(reservation_id)
        if not reservation:
            return {"message": "Reservation not found."}, 404
        
        if reservation.user_id != current_user.id:
            return {"message": "Unauthorized to release this reservation."}, 403

        reservation.leaving_timestamp = datetime.now(pytz.timezone("Asia/Kolkata"))

        spot = ParkingSpot.query.get(reservation.spot_id)
        if spot:
            spot.status = "available"

        db.session.commit()
        cache.delete("admin_parking_lots")
        cache.delete("user_parking_lots")

        return {
            "message": "Spot released successfully.",
        }, 200


class ParkingLotsForUsers(Resource):
    @cache.cached(timeout=300, key_prefix="user_parking_lots")
    @auth_required("token")
    @roles_required("user")
    def get(self):
        lots = ParkingLot.query.all()
        lot_list = []

        for lot in lots:
            available_spots = ParkingSpot.query.filter_by(lot_id=lot.id, status="available").count()

            this_lot = {}
            this_lot["id"] = lot.id
            this_lot["address"] = lot.address
            this_lot["location_name"] = lot.location_name
            this_lot["price"] = lot.price
            this_lot["no_of_spots"] = lot.no_of_spots
            this_lot["available_spots"] = available_spots
            lot_list.append(this_lot)
        
        if lot_list:
            return lot_list
        
        return {
            "message" : "No lots found"
        }, 404


class AllUsersApi(Resource):
    @auth_required("token")
    @roles_required("admin")
    def get(self):
        users = User.query.all()
        user_list = []

        for user in users:
            role_names = [role.name for role in user.roles]
            if "admin" in role_names:
                continue
            this_user = {}
            this_user["id"] = user.id
            this_user["email"] = user.email
            this_user["username"] = user.username
            user_list.append(this_user)
        
        if user_list:
            return user_list
        
        return {
            "message" : "No user found"
        }, 404


api.add_resource(ParkingLotApi, '/get_parkinglot', '/create_parkinglot', '/delete_parkinglot/<int:id>', '/edit_parkinglot/<int:id>')
api.add_resource(ParkingSpotDetails, '/spot_details/<int:spot_id>', '/delete_spot/<int:spot_id>')
api.add_resource(ParkingLotsForUsers, '/parkinglots_for_users')
api.add_resource(BookParkingSpot, '/user_bookings', '/book_spot/<int:lot_id>')
api.add_resource(ReleaseParkingSpotApi, '/release_spot/<int:reservation_id>')
api.add_resource(AllUsersApi, '/all_users')
