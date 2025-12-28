export default {
    template: `
    <div class="container" style="max-height: 90vh; overflow-y: auto; padding-right: 10px;">

        <h2 class="mb-4">User Summary</h2>

        <!-- USER INFO CARD -->
        <div class="card shadow-sm mb-4" style="border-radius:12px;">
            <div class="card-body">
                <h4 class="mb-3">Profile Details</h4>

                <p><strong>Name:</strong> {{ user.username }}</p>
                <p><strong>Email:</strong> {{ user.email }}</p>
                <p><strong>Role:</strong> User</p>
            </div>
        </div>

        <!-- ACTIVE BOOKINGS -->
        <div class="card shadow-sm mb-4" style="border-radius:12px;">
            <div class="card-header bg-primary text-white">
                <h4 class="mb-0">Active Bookings</h4>
            </div>

            <div class="card-body" style="max-height: 250px; overflow-y: auto;">
                <table class="table table-striped table-hover mb-0">
                    <thead>
                        <tr>
                            <th>Location</th>
                            <th>Spot ID</th>
                            <th>Start Time</th>
                            <th>Cost/hr</th>
                        </tr>
                    </thead>
                    <tbody v-if="activeBookings.length > 0">
                        <tr v-for="b in activeBookings" :key="b.reservation_id">
                            <td>{{ b.lot_location }}</td>
                            <td>{{ b.spot_id }}</td>
                            <td>{{ formatDate(b.parking_timestamp) }}</td>
                            <td>₹{{ b.parking_cost }}</td>
                        </tr>
                    </tbody>
                    <tbody v-else>
                        <tr>
                            <td colspan="4" class="text-center text-muted">No Active Bookings</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- COMPLETED BOOKINGS -->
        <div class="card shadow-sm mb-4" style="border-radius:12px;">
            <div class="card-header bg-success text-white">
                <h4 class="mb-0">Completed Bookings</h4>
            </div>

            <div class="card-body" style="max-height: 300px; overflow-y: auto;">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Location</th>
                            <th>Spot ID</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Hours</th>
                            <th>Total Cost</th>
                        </tr>
                    </thead>
                    <tbody v-if="completedBookings.length > 0">
                        <tr v-for="b in completedBookings" :key="b.reservation_id">
                            <td>{{ b.lot_location }}</td>
                            <td>{{ b.spot_id }}</td>
                            <td>{{ formatDate(b.parking_timestamp) }}</td>
                            <td>{{ formatDate(b.leaving_timestamp) }}</td>
                            <td>{{ b.total_hours }} hrs</td>
                            <td>₹{{ b.total_cost }}</td>
                        </tr>

                        <!-- TOTAL COST ROW -->
                        <tr style="font-weight:bold; background:#f8f9fa;">
                            <td colspan="5" class="text-end">
                                Total Spent
                            </td>
                            <td>₹{{ totalSpent }}</td>
                        </tr>
                    </tbody>

                    <tbody v-else>
                        <tr>
                            <td colspan="6" class="text-center text-muted">No Completed Bookings</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- STATS SUMMARY -->
        <div class="card shadow-sm mb-4" style="border-radius:12px;">
            <div class="card-body">
                <h4 class="mb-3">Summary Stats</h4>

                <p><strong>Total Parking Sessions:</strong> {{ completedBookings.length }}</p>
                <p><strong>Total Amount Spent:</strong> ₹{{ totalSpent }}</p>
            </div>
        </div>

    </div>
    `,

    data: function(){
        return {
            user: {},
            activeBookings: [],
            completedBookings: [],
            totalSpent: 0
        }
    },

    mounted() {
        this.fetchUser()
        this.fetchBookings()
    },

    methods: {
        fetchUser() {
            fetch('/api/home', {
                method: 'GET',
                headers: {
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json())
            .then(data => this.user = data)
        },

        fetchBookings() {
            fetch('/api/user_bookings', {
                method: 'GET',
                headers: {
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json())
            .then(data => {
                // Split into active & completed
                this.activeBookings = data.filter(b => b.spot_status === "booked")
                this.completedBookings = data.filter(b => b.spot_status === "available")

                // Calculate total amount spent
                this.totalSpent = this.completedBookings.reduce((sum, b) => sum + (b.total_cost || 0), 0)
            })
        },

        formatDate(ts) {
            return new Date(ts).toLocaleString()
        }
    }
}
