export default {
    template: `
    <div class="d-flex justify-content-center align-items-center" style="height:100vh; width:100vw; background:#f7f9fc; overflow:hidden;">
        <div class="shadow-lg p-4 bg-white" style="width: 360px; border-radius: 14px;">

            <h2 class="text-center mb-3" style="font-weight:600;">Register</h2>
            <p class="text-danger text-center" style="font-size:14px; height:18px;">{{message}}</p>

            <div class="mb-3">
                <label for="email" class="form-label" style="font-weight:500;">Email</label>
                <input type="email" id="email" v-model="formData.email" class="form-control" style="border-radius:8px; padding:10px;" placeholder="name@example.com">
            </div>

            <div class="mb-3">
                <label for="username" class="form-label" style="font-weight:500;">Username</label>
                <input type="text" id="username" v-model="formData.username" class="form-control" style="border-radius:8px; padding:10px;" placeholder="Your username">
            </div>

            <div class="mb-3">
                <label for="pass" class="form-label" style="font-weight:500;">Password</label>
                <input type="password" id="pass" v-model="formData.password" class="form-control" style="border-radius:8px; padding:10px;">
            </div>

            <button class="btn btn-primary w-100" style="padding:10px; border-radius:8px; font-weight:600;" @click="addUser">
                Register
            </button>
        
        </div>
    </div>`,
    data: function(){
        return {
            formData:{
                email: "",
                password: "",
                username: ""
            },
            message: ""
        }
    },
    methods:{
        addUser: function(){
            this.message = "";

            fetch('/api/register', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(this.formData)     // the content goes to backend as JSON string
            })
            .then(async response => {
                const data = await response.json();

                if (response.ok) {
                    alert(data.message);
                    this.$router.push('/login');
                } else {
                    this.message = data.message;
                }
            })

        }
    }
}
