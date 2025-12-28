import Home from './components/Home.js'
import Login from './components/Login.js'
import Register from './components/Register.js'
import Navbar from './components/Navbar.js'
import User_Dashboard from './components/User_Dashboard.js'
import Admin_Dashboard from './components/Admin_Dashboard.js'
import Admin_Summary from './components/Admin_Summary.js'
import User_Summary from './components/User_Summary.js'

const routes = [
    {path: '/', component: Home},
    {path: '/login', component: Login},
    {path: '/register', component: Register},
    {path: '/user_dashboard', component: User_Dashboard},
    {path: '/admin_dashboard', component: Admin_Dashboard},
    {path: '/admin_summary', component: Admin_Summary},
    {path: '/user_summary', component: User_Summary}
]

const router = new VueRouter({
    routes     // route: route
})

const app = new Vue({
    el: "#app",
    router,    // router: router
    template: `
    <div class="layout" style="min-height:100vh; background:#f5f6fa;">
        <nav-bar></nav-bar>
        <router-view></router-view>
    </div>
    `,
    data: {
        section: "Frontend",
    },
    components:{
        "nav-bar": Navbar       // use double quote if you use hypen
    }
})
