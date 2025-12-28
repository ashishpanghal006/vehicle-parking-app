export default {
    template: `
    <div class="login-wrapper d-flex justify-content-center align-items-center">
        <div class="border shadow-lg p-4 bg-white" style="width: 350px; border-radius: 12px;">

            <h2 class="text-center mb-3" style="font-weight:600;">Login</h2>

            <p class="text-danger text-center" style="font-size:14px; height:18px;">{{message}}</p>

            <div class="mb-3">
                <label for="email" class="form-label" style="font-weight:500;">Email</label>
                <input type="email" class="form-control" id="email" v-model="formData.email" placeholder="name@example.com" style="border-radius:8px; padding:10px;">
            </div>

            <div class="mb-3">
                <label for="password" class="form-label" style="font-weight:500;">Password</label>
                <input type="password" class="form-control" id="password" v-model="formData.password" style="border-radius:8px; padding:10px;">
            </div>

            <button class="btn btn-primary w-100 mt-2" style="padding:10px; border-radius:8px; font-weight:600;" @click="loginUser">
                Login
            </button>

        </div>

    </div>`,
    data: function(){
        return {
            formData:{
                email: "",
                password: ""
            },
            message: ""
        }
    },
    methods:{
        loginUser: function(){
            fetch('/api/login-user', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(this.formData)     // the content goes to backend as JSON string
            })
            .then(response => response.json())
            .then(data => {
                if(Object.keys(data).includes("auth-token")){
                    localStorage.setItem("auth_token", data["auth-token"])
                    localStorage.setItem("id", data.id)
                    localStorage.setItem("username", data.username)
                    localStorage.setItem("role", data.roles[0])

                    if (data.roles.includes('admin')){
                        this.$router.push('/admin_dashboard')
                    } else{
                        this.$router.push('/user_dashboard')
                    }
                }
                else{
                    this.message = data.message
                }
            })

        }
    }
}
