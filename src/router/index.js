import { createRouter, createWebHistory } from 'vue-router'

const Home = () => import('../pages/home/home.vue')
const Products = () => import('../pages/products/products.vue')
const Profile = () => import('../pages/profile/Profile.vue')
const Services = () => import('../pages/services/Services.vue')
const Cart = () => import('../pages/cart/Cart.vue')

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/products', name: 'Products', component: Products },
  { path: '/profile', name: 'Profile', component: Profile },
  { path: '/services', name: 'Services', component: Services },
  { path: '/cart', name: 'Cart', component: Cart },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
