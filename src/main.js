import Vue from 'vue'
import Router from 'vue-router'
import './cdn/vue-ui.js'
import IsobitUI from 'isobit-ui'
import App from './App.vue'
import Ionic from '@ionic/vue';
import '@ionic/core/css/ionic.bundle.css';
import "./cdn/isobit.css";
import { createPinia, PiniaVuePlugin } from 'pinia'
Vue.use(PiniaVuePlugin)
const pinia = createPinia()
Vue.config.productionTip = false;
Vue.use(Router);
Vue.use(IsobitUI);
Vue.use(Ionic);
Vue.config.ignoredElements = [/^ion-/,/^v-filter/];   // add this line
Vue.config.productionTip = false;
const publicPath=process.env.VUE_APP_PUBLIC_PATH||'/';
window.axios.defaults.baseURL = process.env.VUE_APP_BASE_URL;
const router = new Router({
	base:publicPath,
	mode: 'history',
	routes: [
		{
			path: '/',
			redirect: '/admin'
		},
		{
			path: '/login',
			component: r => require.ensure([], () => r(require('./Login.vue')), 'login')
		},
		{
			path: '/register',
			component: r => require.ensure([], () => r(require('./Register.vue')), 'registros')
		},
		{
			path: '/password',
			component: r => require.ensure([], () => r(require('./Password.vue')), 'passwords')
		},
		{
			path: '/admin',
			component: r => require.ensure([], () => r(require('./Admin.vue')), 'template'),
			children: [
				{
					path: '/', props: true,
					component: r => require.ensure([], () => r(require('./admin/Inicio.vue')), 'productosgeneral'),
				},
				{
					path: 'setting', props: true,
					component: r => require.ensure([], () => r(require('./admin/Setting.vue')), 'productosgeneral'),
				},
				{
					path: 'profile', props: true,
					component: r => require.ensure([], () => r(require('./admin/Profile.vue')), 'productosgeneral'),
				},
				{
					path: 'map', props: true,
					component: r => require.ensure([], () => r(require('./admin/Map.vue')), 'productosgeneral'),
				},
				{
					path: 'route/map', props: true,
					component: r => require.ensure([], () => r(require('./admin/route/Map.vue')), 'productosgeneral'),
				}
			]
		}
	]
});


router.beforeEach((to, from, next) => {
	var session = localStorage.getItem('session');
	//console.log(session);
	if (to.path == '/logout') {
		if (session) {
			window.axios.config = {};
			localStorage.removeItem('session');
		}
		next('/');
		return;
	}
	if (session) session = JSON.parse(session);
	if (to.path == '/login' && session) {
		next('/admin');
	} else if (to.path !== '/login' && !session) {

		if (to.path == '/register' || to.path == '/password') {

			next();
		} else {
			next('/login');
		}
	} else if (to.path == '/') {
		next('/admin');
	} else {
		console.log('=next  ==========' + to.path);
		next();
	}
});
new Vue({
	router,
	render: h => h(App),
	created() { window.$app = this; },
	pinia
}).$mount('#app')
