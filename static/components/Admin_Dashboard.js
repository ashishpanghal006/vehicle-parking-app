export default {
    template: `
    <div class="container mt-4">
        <h2 class="mb-4">Welcome, {{userData.username}}</h2>

        <!-- CSV Download Button -->
        <button @click="downloadCSV" class="btn btn-success mb-3">
            Download CSV Report
        </button>

        <!-- CREATE LOT BUTTON -->
        <button @click="showCreateLotForm = true" style="position: fixed; bottom: 25px; right: 25px; width: 60px; height: 60px; border-radius: 50%; background: #0d6efd; color: white; font-size: 32px; border: none; box-shadow: 0 4px 8px rgba(0,0,0,0.2); cursor: pointer;">+ New Lot</button>
        
        <!-- CREATE LOT FORM (POPUP) -->
        <div v-if="showCreateLotForm" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
            <form @submit.prevent="createParkingLot" style="background: white; padding: 20px; border-radius: 8px; width: 350px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                <h3>Create Parking Lot</h3>

                <label>Location Name</label>
                <input type="text" v-model="lotForm.location_name" class="form-control" required>

                <label class="mt-2">Address</label>
                <input type="text" v-model="lotForm.address" class="form-control" required>

                <label class="mt-2">Price per hour</label>
                <input type="number" v-model="lotForm.price" class="form-control" required>

                <label class="mt-2">Number of Spots</label>
                <input type="number" v-model="lotForm.no_of_spots" class="form-control" required>

                <div class="mt-3 d-flex justify-content-between">
                    <button type="button" class="btn btn-secondary" @click="cancelLotForm">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create</button>
                </div>
            </form>
        </div>

        <!-- PARKING LOT CARDS -->

        <div class="row" style="max-height: 75vh; overflow-y: auto; padding-right: 10px;">

            <!-- NO LOTS MESSAGE -->
            <div v-if="parkingLots.length === 0" style="width: 100%; text-align: center; margin-top: 60px; color: #6c757d;">
                <h4>No parking lots created yet</h4>
                <p>Click <strong>+ New Lot</strong> to create your first parking lot.</p>
            </div>

            <!-- LOT CARDS -->
            <div class="col-md-4 mb-3" v-else v-for="lot in parkingLots" :key="lot.id">
                <div class="card shadow-sm" style="position: relative;">
                    <div class="card-body">
                        <h5 class="card-title">{{ lot.location_name }}</h5>
                        <p class="card-text">
                            <strong>Address:</strong> {{ lot.address }} <br>
                            <strong>Price:</strong> ₹{{ lot.price }} per hour <br>
                            <strong>Total Spots:</strong> {{ lot.no_of_spots }}
                        </p>
                        <!-- Action Icons -->
                        <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 10px;">
    
                            <!-- Edit Icon -->
                            <span 
                                @click="openEditLotForm(lot)"
                                style="cursor: pointer; color: blue; font-size: 18px;"
                            >
                                ✏️
                            </span>

                            <!-- Delete Icon -->
                            <span 
                                @click="deleteParkingLot(lot.id)"
                                style="cursor: pointer; color: red; font-size: 18px;"
                            >
                                🗑️
                            </span>

                        </div>

                        <hr style="margin: 8px 0; border: 0; border-top: 5px solid #ccc;">

                        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; max-height: 120px; overflow-y: auto; padding-right: 4px;">
                            <div
                                v-for="spot in lot.spots"
                                :key="spot.id"
                                @click="openSpotPopup(spot.id)"
                                :style="{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '4px',
                                    backgroundColor: spot.status === 'available' ? 'green' : 'red',
                                    border: '1px solid #ccc',
                                    cursor: 'pointer'
                                }"
                                :title="'Spot ID: ' + spot.id"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- EDIT LOT FORM -->
        <div v-if="showEditLotForm" style="position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center;">
            <div style="background:white; padding:20px; width:350px; border-radius:10px;">
                <h3>Edit Parking Lot</h3>

                <label>Location Name</label>
                <input class="form-control" v-model="editLotForm.location_name" style="width:100%; margin-bottom:10px;" disabled>

                <label>Address</label>
                <input class="form-control" v-model="editLotForm.address" style="width:100%; margin-bottom:10px;" disabled>

                <label>Price</label>
                <input class="form-control" type="number" v-model="editLotForm.price" style="width:100%; margin-bottom:10px;">

                <label>No. of Spots</label>
                <input class="form-control" type="number" v-model="editLotForm.no_of_spots" style="width:100%; margin-bottom:10px;">

                <div style="display:flex; justify-content:space-between; margin-top:15px;">
                    <button @click="editParkingLot()">Save</button>
                    <button @click="showEditLotForm = false">Cancel</button>
                </div>
            </div>
        </div>

        <!-- SPOT DETAILS -->
        <div v-if="showSpotPopup" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000;">
            <div style="background: white; padding: 20px; width: 350px; border-radius: 10px;">
                <h3>Spot Details</h3>

                <p><strong>Spot ID:</strong> {{ selectedSpot.spot_id }}</p>
                <p><strong>Status:</strong> {{ selectedSpot.status }}</p>

                <template v-if="selectedSpot.status === 'booked'">
                    <p><strong>Customer ID:</strong> {{ selectedSpot.customer_id }}</p>
                    <p><strong>Parking Time:</strong> {{ formattedParkingTime }}</p>
                    <p><strong>Price:</strong> ₹{{ selectedSpot.parking_cost }}</p>
                </template>

                <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                    <button class="btn btn-secondary" @click="showSpotPopup = false">Close</button>

                    <button v-if="selectedSpot.status === 'available'" class="btn btn-danger" @click="deleteSpot(selectedSpot.spot_id)">
                        Delete Spot
                    </button>
                </div>

            </div>
        </div>
    </div>`,
    data: function(){
        return {
            userData: "",
            parkingLots: [],
            showCreateLotForm: false,
            showEditLotForm: false,
            showSpotPopup: false,
            selectedSpot: {},

            lotForm: {
                location_name: "",
                address: "",
                price: null,
                no_of_spots: null
            },

            editLotForm: {
                id: null,
                location_name: "",
                address: "",
                price: null,
                no_of_spots: null
            }
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
    },

    methods: {
        cancelLotForm() {
            this.showCreateLotForm = false;
            this.lotForm = {
                location_name: "",
                address: "",
                price: null,
                no_of_spots: null
            }
        },

        createParkingLot(){
            fetch("/api/create_parkinglot", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authentication-Token": localStorage.getItem("auth_token")
                },
                body: JSON.stringify(this.lotForm)
            })
            .then(async response => {
                const result = await response.json();

                if (response.ok){
                    alert("Parking Lot Created");
                    this.cancelLotForm();
                    this.fetchParkingLots();
                } else{
                    alert(result.message || "Error creating lot");
                }
            })
        },

        openEditLotForm(lot) {
            this.showEditLotForm = true;
            this.editLotForm = {
                id: lot.id,
                location_name: lot.location_name,
                address: lot.address,
                price: lot.price,
                no_of_spots: lot.no_of_spots
            }
        },

        editParkingLot(){
            fetch(`/api/edit_parkinglot/${this.editLotForm.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authentication-Token": localStorage.getItem("auth_token")
                },
                body: JSON.stringify(this.editLotForm)
            })
            .then(async response => {
                const data = await response.json();

                if (response.ok) {
                    alert("Parking lot updated successfully.");
                    this.showEditLotForm = false;
                    this.fetchParkingLots();
                } else {
                    alert(data.message || "Error updating lot");
                }
            })
        },

        deleteParkingLot(id){
            fetch(`/api/delete_parkinglot/${id}`, {
                method: "DELETE",
                headers: {
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(async response => {
                const data = await response.json();

                if (response.ok) {
                    alert("Parking lot deleted successfully.");
                    this.fetchParkingLots();
                } else {
                    alert(data.message || "Cannot delete parking lot");
                }
            })
        },

        fetchParkingLots() {
            fetch('/api/get_parkinglot', {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json())
            .then(data => this.parkingLots = data)
        },

        openSpotPopup(spotId) {
            fetch(`/api/spot_details/${spotId}`, {
                method: "GET",
                headers: {
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json())
            .then(data => {
                this.selectedSpot = data;
                this.showSpotPopup = true;
            })
        },

        deleteSpot(spotId) {
            fetch(`/api/delete_spot/${spotId}`, {
                method: "DELETE",
                headers: {
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json().then(data => ({ ok: response.ok, data })))
            .then(result => {
                if(result.ok){
                    this.selectedSpot = {};
                    this.showSpotPopup = false;
                    this.fetchParkingLots();
                } else {
                    alert(result.data.message || "Error deleting spot");
                }
            });
        },

        downloadCSV(){
            fetch('/api/export', {
                headers: {
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json())
            .then(data => {
                const taskId = data.id;
                this.checkCsvStatus(taskId);
            });
        },

        checkCsvStatus(taskId){
            fetch(`/api/csv_result/${taskId}`)
                .then(async response => {
                    if (response.status === 202){
                        // csv not ready - poll again after 1 second
                        setTimeout(() => this.checkCsvStatus(taskId), 1000);
                    }
                    else if (response.status === 200){
                        // csv ready - trigger download
                        window.location.href = `/api/csv_result/${taskId}`;
                    }
                    else {
                        const data = await response.json();
                        alert(data.message || "Error generating CSV");
                    }
                });
        },
    },

    computed: {
        formattedParkingTime() {
            if (!this.selectedSpot.parking_timestamp) return "";
            return new Date(this.selectedSpot.parking_timestamp).toLocaleString();
        }
    }
}
