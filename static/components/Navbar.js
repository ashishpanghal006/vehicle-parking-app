export default {
    template: `
    <div class="d-flex justify-content-between align-items-center" style="padding: 12px 24px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid rgba(20, 18, 18, 0.8)">

        <div style="font-size: 26px; font-weight: 700; color:#2d3436;">
            Park<span style="color:#0984e3;">In</span>
        </div>

        <div>
            
            <!-- IF NOT LOGGED IN -->
            <div v-if="!role">
                <router-link class="btn btn-primary mx-1" style="padding:6px 14px;border-radius:8px;" to="/login">Login</router-link>
                <router-link class="btn btn-warning mx-1" style="padding:6px 14px;border-radius:8px;" to="/register">Register</router-link>
            </div>

            <!-- IF USER -->
            <div v-else-if="role === 'user'">
                <router-link class="btn btn-outline-primary mx-1" style="padding:6px 14px;border-radius:8px;" to="/user_dashboard">Home</router-link>
                <router-link class="btn btn-outline-success mx-1" style="padding:6px 14px;border-radius:8px;" to="/user_summary">Summary</router-link>
                <button class="btn btn-danger mx-1" style="padding:6px 14px;border-radius:8px;" @click="logout">Logout</button>
            </div>

            <!-- IF ADMIN -->
            <div v-else-if="role === 'admin'">
                <router-link class="btn btn-outline-primary mx-1" style="padding:6px 14px;border-radius:8px;" to="/admin_dashboard">Home</router-link>
                <router-link class="btn btn-outline-success mx-1" style="padding:6px 14px;border-radius:8px;" to="/admin_summary">Summary</router-link>
                <button class="btn btn-danger mx-1" style="padding:6px 14px;border-radius:8px;" @click="logout">Logout</button>
            </div>

        </div>
    </div>`,
    data: function(){
        return {
            role: localStorage.getItem("role")
        }
    },

    created() {
        // Watch for route navigation and update role dynamically
        this.$watch(
            () => this.$route,
            () => {
                this.role = localStorage.getItem("role");
            }
        );
    },

    methods: {
        logout() {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("username");
            localStorage.removeItem("id");
            localStorage.removeItem("role");

            this.role = null;
            this.$router.push("/login");
        }
    }
}
