export default {
    template: `
    <div class="container mt-3" style="width: 95%; max-width: 100%;">

    <div class="row">

        <!-- LEFT: AVAILABLE PARKING LOTS -->
        <div class="col-md-6 mb-3">
            <div class="card" style="border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); height: 630px;">
                <div class="card-header bg-success text-white" style="border-radius: 10px 10px 0 0;">
                    <h4 class="mb-0">Available Parking Lots</h4>
                </div>

                <div class="card-body" style="overflow-y: auto; padding: 0px;">
                    <table class="table table-striped table-hover" style="margin-bottom: 0; width: 100%;">
                        <thead>
                            <tr>
                                <th>Address</th>
                                <th>Location</th>
                                <th>Available</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr v-for="lot in parking_lots">
                                <td>{{ lot.address }}</td>
                                <td>{{ lot.location_name }}</td>
                                <td>{{ lot.available_spots }}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary"
                                            :disabled="lot.available_spots === 0"
                                            @click="openBookingPopup(lot)">
                                        Book
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>


        <!-- RIGHT: RESERVED BOOKINGS -->
        <div class="col-md-6 mb-3">
            <div class="card" style="border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); height: 630px;">
                <div class="card-header bg-primary text-white" style="border-radius: 10px 10px 0 0;">
                    <h4 class="mb-0">Reserved Bookings</h4>
                </div>

                <div class="card-body" style="overflow-y: auto; padding: 0px;">
                    <table class="table table-striped table-hover" style="margin-bottom: 0; width: 100%;">
                        <thead>
                            <tr>
                                <th>Location</th>
                                <th>Cost/hr</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody v-if="reserved_bookings?.length > 0">
                            <tr v-for="booking in reserved_bookings">
                                <td>{{booking.lot_location}}</td>
                                <td>₹{{ booking.parking_cost }}</td>
                                <td>
                                    <button v-if="booking.spot_status === 'booked'"
                                            class="btn btn-sm btn-danger"
                                            @click="openReleasePopup(booking)">
                                        Release
                                    </button>

                                    <button v-else class="btn btn-sm btn-secondary" disabled>
                                        Completed
                                    </button>
                                </td>
                            </tr>
                        </tbody>

                        <tbody v-else>
                            <tr>
                                <td colspan="3" class="text-center text-muted">No bookings yet.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

   

        <!-- BOOKING POPUP -->
        <div v-if="showBookingPopup"
             style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.5); display: flex; justify-content: center;
                    align-items: center; z-index: 9999;">

            <div style="background: white; padding: 20px; width: 350px; border-radius: 10px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);">

                <h4 style="margin-bottom: 15px;">Confirm Booking</h4>

                <p><strong>Lot ID:</strong> {{ selectedLot.id }}</p>
                <p><strong>Location:</strong> {{ selectedLot.location_name }}</p>
                <p><strong>Available Spots:</strong> {{ selectedLot.available_spots }}</p>
                <p><strong>Cost/hr:</strong> ₹{{ selectedLot.price }}</p>

                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                    <button class="btn btn-secondary btn-sm"
                            @click="showBookingPopup = false">
                        Cancel
                    </button>

                    <button class="btn btn-success btn-sm"
                            @click="confirmBooking">
                        Reserve
                    </button>
                </div>
            </div>
        </div>



        <!-- RELEASE POPUP -->
        <div v-if="showReleasePopup"
             style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.6); display: flex; justify-content: center;
                    align-items: center; z-index: 9999;">

            <div style="background: white; padding: 20px; border-radius: 10px; width: 360px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);">

                <h4 style="margin-bottom: 15px;">Confirm Release</h4>

                <p><strong>Spot ID:</strong> {{ selectedBooking.spot_id }}</p>
                <p><strong>Parking Time:</strong> {{ parkingTime }}</p>
                <p><strong>Leaving Time:</strong> {{ leavingTime }}</p>

                <div style="text-align: right; margin-top: 20px;">
                    <button class="btn btn-secondary btn-sm"
                            style="margin-right: 10px;"
                            @click="closeReleasePopup">
                        Cancel
                    </button>

                    <button class="btn btn-success btn-sm"
                            @click="confirmRelease">
                        Release
                    </button>
                </div>
            </div>
        </div>

    </div>`,
    data: function(){
        return {
            userData: "",
            parking_lots: null,
            reserved_bookings: null,

            showBookingPopup: false,
            selectedLot: {},

            bookings: [],
            showReleasePopup: false,
            selectedBooking: {},
            leavingTime: "",
            price: 0,
            parkingTime: ""
        }
    },

    mounted(){
        fetch('/api/home', {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authentication-Token": localStorage.getItem("auth_token")
            }
        })
        .then(response => response.json())
        .then(data => this.userData = data)

        this.fetchParkingLots()
        this.fetchBookings()
    },

    methods: {
        fetchParkingLots() {
            fetch('/api/parkinglots_for_users', {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json())
            .then(data => this.parking_lots = data)
        },

        fetchBookings() {
            fetch('/api/user_bookings', {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json())
            .then(data => this.reserved_bookings = data)
        },

        openBookingPopup(lot) {
            this.selectedLot = lot;
            this.showBookingPopup = true;

        },

        confirmBooking() {
            fetch(`/api/book_spot/${this.selectedLot.id}`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json().then(data => ({ status: response.status, body: data })))
            .then(({ status}) => {
                if (status === 200) {
                    this.fetchBookings();
                    this.fetchParkingLots(); // update available spots
                    this.showBookingPopup = false;
                }
            })
        },

        openReleasePopup(booking) {
            this.selectedBooking = booking;
            this.leavingTime = new Date().toLocaleString();
            this.parkingTime = new Date(booking.parking_timestamp).toLocaleString();
            this.price = booking.parking_cost;
            this.showReleasePopup = true;
        },

        closeReleasePopup() {
            this.showReleasePopup = false;
        },

        confirmRelease() {
            fetch(`/api/release_spot/${this.selectedBooking.reservation_id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json().then(data => ({ status: response.status, body: data })))
            .then(({ status}) => {
                if (status === 200) {
                    alert("Spot released successfully");
                    this.showReleasePopup = false;
                    this.fetchBookings();
                    this.fetchParkingLots(); // refresh availability
                }
            })
        }
    }
}
