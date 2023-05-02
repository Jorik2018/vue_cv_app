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
					path: 'directory/people/create', props: true,
					component: r => require.ensure([], () => r(require('./admin/directory/people/Create.vue')), 'productosgeneral'),
				},
				{
					path: 'hr/people', props: true,
					component: r => require.ensure([], () => r(require('./admin/directory/people/Create.vue')), 'employee'),
				},
				{
					path: 'hr/employee/create', props: true,
					component: r => require.ensure([], () => r(require('./admin/hr/employee/Create.vue')), 'employee'),
				},
				{
					path: 'hr/employee/create', props: true,
					component: r => require.ensure([], () => r(require('./admin/hr/employee/Create.vue')), 'employee'),
				},
				{
					path: 'hr/employee/:id', props: true,
					component: r => require.ensure([], () => r(require('./admin/hr/employee/Create.vue')), 'employee'),
				},
				{
					path: 'hr/employee/:id/edit', props: true,
					component: r => require.ensure([], () => r(require('./admin/hr/employee/Create.vue')), 'employee'),
				},
				{
					path: 'hr/experience', props: true,
					component: r => require.ensure([], () => r(require('./admin/hr/experience/List.vue')), 'experience'),
				},
				{
					path: 'hr/experience/create', props: true,
					component: r => require.ensure([], () => r(require('./admin/hr/experience/Create.vue')), 'experience'),
				},
				{
					path: 'hr/experience/:id', props: true,
					component: r => require.ensure([], () => r(require('./admin/hr/experience/Create.vue')), 'experience'),
				},
				{
					path: 'hr/experience/:id/edit', props: true,
					component: r => require.ensure([], () => r(require('./admin/hr/experience/Create.vue')), 'experience'),
				},
				{
					path: 'hr/study', props: true,
					component: r => require.ensure([], () => r(require('./admin/hr/study/List.vue')), 'study'),
				},
				{
					path: 'hr/study/create', props: true,
					component: r => require.ensure([], () => r(require('./admin/hr/study/Create.vue')), 'study'),
				},
				{
					path: 'hr/study/:id', props: true,
					component: r => require.ensure([], () => r(require('./admin/hr/study/Create.vue')), 'study'),
				},
				{
					path: 'hr/study/:id/edit', props: true,
					component: r => require.ensure([], () => r(require('./admin/hr/study/Create.vue')), 'study'),
				},
				{
					path: 'hr/training', props: true,
					component: r => require.ensure([], () => r(require('./admin/hr/training/List.vue')), 'training'),
				},
				{
					path: 'hr/training/create', 
					component: r => require.ensure([], () => r(require('./admin/hr/training/Create.vue')), 'training'),
				},
				{
					path: 'hr/training/:id', props: true,
					component: r => require.ensure([], () => r(require('./admin/hr/training/Create.vue')), 'training'),
				},
				{
					path: 'hr/training/:id/edit', props: true,
					component: r => require.ensure([], () => r(require('./admin/hr/training/Create.vue')), 'training'),
				},
				{
					path: 'hr/document', props: true,
					component: r => require.ensure([], () => r(require('./admin/hr/document/List.vue')), 'document'),
				},
				{
					path: 'hr/document/create', 
					component: r => require.ensure([], () => r(require('./admin/hr/document/Create.vue')), 'document'),
				},
				{
					path: 'hr/document/:id', props: true,
					component: r => require.ensure([], () => r(require('./admin/hr/document/Create.vue')), 'document'),
				},
				{
					path: 'hr/document/:id/edit', props: true,
					component: r => require.ensure([], () => r(require('./admin/hr/document/Create.vue')), 'document'),
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
