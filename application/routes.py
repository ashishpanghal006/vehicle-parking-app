from .database import db
from .models import User, Role
from flask import current_app as app, jsonify, request, render_template, send_from_directory
from flask_security import auth_required, roles_required, current_user, login_user, roles_accepted
from werkzeug.security import check_password_hash, generate_password_hash
from .utils import roles_list
from celery.result import AsyncResult
from .tasks import csv_report


@app.route('/', methods = ['GET'])
def home():
    return render_template('index.html')


@app.route('/api/login-user', methods=['POST'])
def user_login():
    body = request.get_json()
    email = body["email"]
    password = body["password"]

    if not email:
        return jsonify({
            "message" : "Email is required"
        }), 400
    
    user = app.security.datastore.find_user(email = email)

    if user:
        if check_password_hash(user.password, password):
            login_user(user)     # creates the session
            return jsonify({
                "id": user.id,
                "username": user.username,
                "auth-token": user.get_auth_token(),
                "roles": roles_list(user.roles)
            })
        else:
            return jsonify({
                "message": "Incorrect Password"
            }), 400
    else:
        return jsonify({
            "message": "User Not Found"
        }), 404


@app.route('/api/admin')
@auth_required('token')    # Authentication
@roles_required('admin')   # Authorization/RBAC
def admin_home():
    return jsonify({
        "message":"admin logged in successfully"
    })

@app.route('/api/home')
@auth_required('token')
@roles_accepted('user', 'admin')
def user_home():
    user = current_user
    return jsonify({
        "username" : user.username,
        "email" : user.email,
        "roles": roles_list(user.roles)
    })

@app.route('/api/register', methods = ['POST'])
def create_user():
    credentials = request.get_json()

    email = credentials.get("email")
    username = credentials.get("username")
    password = credentials.get("password")

    if not email or not username or not password:
        return jsonify({
            "message": "Every field is required"
        }), 400
    
    if app.security.datastore.find_user(email=email):
        return jsonify({"message": "Email already exists"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 400

    app.security.datastore.create_user(email = email,
                                        username = username,
                                        password = generate_password_hash(password),
                                        roles = ['user'])
    db.session.commit()
    return jsonify({
        "message" : "User created successfully"
    }), 201



@app.route('/api/export', methods=['GET'])  # this manually triggers the job
@auth_required('token')
@roles_required('admin')
def export_csv():
    result = csv_report.delay()  # async object
    return jsonify({
        "id": result.id,
        "result": "csv is getting generated",
    })



@app.route('/api/csv_result/<task_id>')  # just create to test the status of result
def csv_result(task_id):
    res = AsyncResult(task_id)

    if not res.ready():
        return {"message": "CSV is not ready"}, 202
    
    if res.failed():
        return {"message": "CSV generation failed"}, 500
    
    # Task finished successfully
    return send_from_directory('static', res.result, as_attachment=True)
