export default {
    template: `
    <div class="container mt-4" style="height: 90vh; display: flex; flex-direction: column;">
        
        <h2 class="mb-4">Admin Summary</h2>

        <!-- SCROLLABLE CONTENT -->
        <div style="flex: 1; overflow-y: auto; padding-right: 10px;">

            <!-- USERS LIST -->
            <div class="card shadow-sm mb-4" style="border-radius: 12px;">
                <div class="card-body">
                    <h4>Registered Users</h4>
                    <table class="table table-stripped mt-3">
                        <thead>
                            <tr>
                                <th>User ID</th>
                                <th>Email</th>
                                <th>Username</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in users" :key="user.id">
                                <td>{{ user.id }}</td>
                                <td>{{ user.email }}</td>
                                <td>{{ user.username }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- CHARTS SECTION -->
            <div class="row">

                <!-- PIE -->
                <div class="col-md-6 mb-4">
                    <div class="card shadow-sm" style="border-radius: 12px; height: 350px;">
                        <div class="card-body" style="height: 320px; position: relative;">
                            <h5 class="text-center mb-2">Available vs Booked Spots</h5>

                            <!-- FORCE CANVAS TO FIT -->
                            <div style="height: 260px; width: 100%; position: relative;">
                                <canvas id="spotsPieChart" style="position:absolute; top:0; left:0; width:100%; height:100%;"></canvas>
                            </div>

                        </div>
                    </div>
                </div>

                <!-- BAR -->
                <div class="col-md-6 mb-4">
                    <div class="card shadow-sm" style="border-radius: 12px; height: 350px;">
                        <div class="card-body" style="height: 320px;">
                            <h5 class="text-center">Spots per Parking Lot</h5>
                            <div style="height: 260px; width:100%; position:relative;">
                                <canvas id="spotsBarChart" style="position:absolute; top:0; left:0; width:100%; height:100%;"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

    </div>`,
    data: function(){
        return {
            users: [],
            parkingLots: [],
            totalBooked: 0,
            totalAvailable: 0
        }
    },

    mounted() {
        this.fetchUsers()
        this.fetchParkingLots()
    },

    methods: {
        fetchUsers() {
            fetch("/api/all_users", {
                method: "GET",
                headers: {
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json())
            .then(data => {this.users = data})
        },

        fetchParkingLots() {
            fetch("/api/get_parkinglot", {
                method: "GET",
                headers: {
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json())
            .then(data => {
                this.parkingLots = data

                let booked = 0
                let available = 0

                data.forEach(lot => {
                    lot.spots.forEach(s => {
                        if(s.status === "booked") booked++
                        else available++
                    })
                })

                this.totalBooked = booked
                this.totalAvailable = available

                this.renderCharts()
            })
        },

        renderCharts() {
            // PIE CHART
            new Chart(document.getElementById("spotsPieChart"), {
                type: "pie",
                data: {
                    labels: ["Booked", "Available"],
                    datasets: [{
                        data: [this.totalBooked, this.totalAvailable],
                        backgroundColor: ["red", "green"]
                    }]
                },
                options: {
                    maintainAspectRatio: false
    }
            })

            // BAR CHART
            new Chart(document.getElementById("spotsBarChart"), {
                type: "bar",
                data: {
                    labels: this.parkingLots.map(l => l.location_name),
                    datasets: [{
                        label: "Number of Spots",
                        data: this.parkingLots.map(l => l.no_of_spots),
                        backgroundColor: "#0d6efd"
                    }]
                }
            })
        }
    }
}
