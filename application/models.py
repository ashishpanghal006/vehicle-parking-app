from .database import db
from flask_security import UserMixin, RoleMixin
from datetime import datetime

class User(db.Model, UserMixin):
    # required for flask security
    __tablename__ = "user"
    id = db.Column(db.Integer, primary_key = True)
    email = db.Column(db.String, unique = True, nullable = False)
    username = db.Column(db.String, unique = True, nullable = False)
    password = db.Column(db.String, nullable = False)
    fs_uniquifier = db.Column(db.String, unique = True, nullable = False)
    active = db.Column(db.Boolean, nullable = False)
    roles = db.relationship('Role', backref = 'bearer', secondary = 'users_roles')
    reservations = db.relationship('ReservedParkingSpot', backref='user', lazy=True)

class Role(db.Model, RoleMixin):
    __tablename__ = "role"
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String, unique = True, nullable = False)
    description = db.Column(db.String)

class UsersRoles(db.Model):
    __tablename__ = "users_roles"
    id = db.Column(db.Integer, primary_key = True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'))

class ParkingLot(db.Model):
    __tablename__ = "parkinglot"
    id = db.Column(db.Integer, primary_key = True)
    location_name = db.Column(db.String, unique = True, nullable = False)
    address = db.Column(db.String, nullable = False)
    price = db.Column(db.Integer, nullable = False)
    no_of_spots = db.Column(db.Integer, nullable = False)
    spots = db.relationship('ParkingSpot', backref = 'lot', lazy = True)

class ParkingSpot(db.Model):
    __tablename__ = "parkingspot"
    id = db.Column(db.Integer, primary_key = True)
    lot_id = db.Column(db.Integer, db.ForeignKey('parkinglot.id'))
    status = db.Column(db.String, nullable = False, default = 'available')
    reservation = db.relationship('ReservedParkingSpot', backref = 'spot', lazy = True)

class ReservedParkingSpot(db.Model):
    __tablename__ = "reservedparkingspot"
    id = db.Column(db.Integer, primary_key = True)
    spot_id = db.Column(db.Integer, db.ForeignKey('parkingspot.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    parking_timestamp = db.Column(db.DateTime, nullable = False, default = datetime.utcnow)
    leaving_timestamp = db.Column(db.DateTime, nullable = True)
    parking_cost = db.Column(db.Integer, nullable = True)
