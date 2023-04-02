<template>
	<router-view></router-view>
</template>
<script>
//https://github.com/capacitor-community/background-geolocation
import './cdn/vue-ui.js'
import { LocalNotifications } from "@capacitor/local-notifications";
import '@fortawesome/fontawesome-free/css/all.css'
import '@fortawesome/fontawesome-free/js/all.js'
import { Network } from '@capacitor/network';
import { registerPlugin } from "@capacitor/core";
import { App as CapacitorApp } from '@capacitor/app';

const BackgroundGeolocation = registerPlugin("BackgroundGeolocation");

CapacitorApp.addListener('appRestoredResult', (data) => {
	console.log('My state:', JSON.stringify(data));
});

var {_,axios,ui} = window;

export default ui({
	created() {
		var me = this;
		me.markerImg = require('@/cdn/images/marker.gif');
		//me.initGPS();
		window.o = me.o;
		_.app = me;
		var session = me.session;
		if(session){
			window.app.profileImg = session.people ? session.people.urlPerfil : null;
			me.connected = session.connected;
		}else me.$router.push('/');
		me.imgError = require('@/cdn/images/no-image.png');
		me.watcher = localStorage.getItem('watcher');
		if (me.watcher) {
			me.startWatcher();
		}
		var networkStatusChange = (status)=> {
			status.connected = status.connected && me.connected;
			_.networkStatus = status;
			me.networkStatus = status;
		};
		Network.addListener("networkStatusChange", networkStatusChange);
		Network.getStatus().then(networkStatusChange);
		_.initDB(12, [
			["region", { keyPath: "id" }, "/admin/directory/api/region/0/0"],
			["province", { keyPath: "code" }, "/admin/directory/api/province/0/0"],
			["district", { keyPath: "code" }, "/admin/directory/api/district/0/0"],
			["vehicle", { keyPath: "id" }],
			["setting", { keyPath: "code" }],
		]);
	},
	data() {
		return {
			tracking:false,
			gps: null,
			markerImg: null,
			poll: 1,
			watcher: null,
			iconoConClick: false,
			ws: null,
			title: '',
			icono: '',
			connected: true,
			networkStatus: { connected: null },
			notification: [],
			profileImg: null,
			ki: 0,
			BUILT_ON: process.env.VUE_APP_BUILT_ON,
			imgError: null,
			k: 0,
			idcategoria: null,
			showMenu: false,
			showUser: false,
			overlay: null,
			locations:[],
		}
	},
	watch:{
        tracking(v){
            var me=this,watcher=me.app.watcher;
            if(v){
                if(!watcher){
					console.log('addWatcher');
                    me.app.addWatcher(true);
                }
            }else if(watcher){
				console.log('removeWatcher');
                me.app.removeWatcher({id:watcher});
            }
        }
    },
	mounted() {
		this.bindLinks();
	},
	updated() {
		this.bindLinks();
		this.$emit('updated');
	},
	methods: {
		addWatcher(background) {
            var me=this,app=this.app;
            BackgroundGeolocation.addWatcher(
                Object.assign({
                    stale: false,
                    distanceFilter: 10
                }, (
                    background
                    ? {
                        backgroundTitle: "Tracking your location.",
                        backgroundMessage: "Cancel to prevent battery drain."
                    }
                    : {}
                )),
                me.app.watchCallback
            ).then((id) => {
                app.saveWatcher(id);
                return true;
            }).catch(function (error) {
				me.toast({message:''+error,color:'danger',
							showCloseButton: true});
				setTimeout(()=>{me.tracking=false},300);
            });
        },
		watchCallback(location, error) {
			var me = this;
			if (error) {
				if (
					error.code === "NOT_AUTHORIZED" &&
					window.confirm(
						"This app needs your location, " +
						"but does not have permission.\n\n" +
						"Open settings now?"
					)
				) {
					BackgroundGeolocation.openSettings();
				}
				return me.logError(error);
			}
			return me.postLocation(location);
		},
		logWatch() { },
		logError(error) {
			this.locations.unshift({time:new Date(),error:error});
		},
		guess(timeout) {
            var me=this;
            return me.makeGuess(timeout).then((location) => {
				//mode 1=manual
                location.mode=1;
                me.postLocation(location,true);
                return 1;
            });
        },
        makeGuess() {
            var me=this;
            return new Promise((resolve)=>{
				try{
					let id;
					BackgroundGeolocation.addWatcher({
							requestPermissions: true,
							stale: false
						},
						(location,error) =>{
							var me = this;
							if(error){
								if (
									error.code === "NOT_AUTHORIZED" && window.confirm(
										"This app needs your location, " +
										"but does not have permission.\n\n" +
										"Open settings now?"
									)
								) {
									BackgroundGeolocation.openSettings();
								}else me.logError(error);
							}else if(id){
								BackgroundGeolocation.removeWatcher({id});
								id=null;
								resolve(location);
							}
						}
					).then((the_id)=>{
						id = the_id;
					}).catch((error)=>{
						me.toast({message:''+error,color:'danger',showCloseButton: true});
					});
				}catch(e){console.log(e);}
            });
        },
		postLocation(location, toast) {
			var me = this;
			if (location.latitude) {
				try {
					var plate = JSON.parse(localStorage.getItem("setting")).vehicle;
					location.plate = plate;
					var config = {};
					if (!toast) {
						config.mask = () => {};
						config.error = () => { return null };
					}
					if(me.connected)
						axios.post('/api/location', location, config).then((e) => {
							if (toast)
								me.toast('Coordenadas enviadas!');
							else{
								me.logWatch(
									'Recibido ' + e.data.id + ' ' + [
										location.latitude,
										location.longitude
									].map(String).join(":")
								)
								me.locations.unshift({...location,id:e.data.id,time:new Date()});
							}
						}).catch(function (error) {
							me.logError(error);
							me.locations.unshift({...location,time:new Date(),error:error});
						});
					else
						me.locations.unshift({...location,time:new Date()});
				} catch (e) {
					me.logError(e);
				}
			} else {
				me.logWatch('No se pudo enviar localizacion, datos incompletos.')
			}
			return 1;
		},
		getElementY(query) {
			return window.pageYOffset + document.querySelector(query).getBoundingClientRect().top
		},
		doScrolling(element, duration) {
			var startingY = window.pageYOffset;
			var elementY = this.getElementY(element);
			var targetY = document.body.scrollHeight - elementY < window.innerHeight ? document.body.scrollHeight - window.innerHeight : elementY
			var diff = targetY - startingY
			// Easing function: easeInOutCubic
			// From: https://gist.github.com/gre/1650294
			var easing = function (t) { return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1 }
			var start
			if (!diff) return
			// Bootstrap our animation - it will get called right before next frame shall be rendered.
			window.requestAnimationFrame(function step(timestamp) {
				if (!start) start = timestamp
				// Elapsed miliseconds since start of scrolling.
				var time = timestamp - start
				// Get percent of completion in range [0, 1].
				var percent = Math.min(time / duration, 1)
				// Apply the easing.
				// It can cause bad-looking slow frames in browser performance tool, so be careful.
				percent = easing(percent)
				window.scrollTo(0, startingY + diff * percent);
				if (time < duration) {
					window.requestAnimationFrame(step)
				}
			})
		},
		connect() {
			var me = this, session = localStorage.getItem('session');
			if (session) {
				session = JSON.parse(session);
			}
			if (session != null) {
				var ws = new WebSocket("wss://web.regionancash.gob.pe/ws/S" + session.uid);
				ws.onopen = function () {
					// subscribe to some channels
					//ws.send(JSON.stringify({
					//.... some message the I must send when I connect ....
					//}));
				};
				ws.onmessage = function (e) {
					me.notify({ body: e.data.msg ? e.data.msg : e.data, title: 'SHAMI APP' });
				};
				ws.onclose = function (e) {
					console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
					setTimeout(function () {
						me.connect();
					}, 5000);
				};
				ws.onerror = function (err) {
					console.error('Socket encountered error: ', err.message, 'Closing socket');
					ws.close();
				};
				me.ws = ws;
			}
		},
		async notify(o) {
			const notifs = await LocalNotifications.schedule({
				notifications: [
					{
						title: o.title,
						body: o.body,
						id: 1,
						/*schedule: { at: new Date(Date.now() + 1000 * 5) },*/
						sound: 'file://sound.mp3',
						attachments: null,
						actionTypeId: '',
						extra: null
					}
				]
			});
			this.notification.push(o);
			console.log('scheduled notifications', notifs);
		},
		logout() {
			this.session = null;
			localStorage.removeItem('session');
			this.$router.push('/login');
		},
		error(event, src) {
			if (!src)
				src = this.imgError;
			event.target.src = src;
			event.target.style.objectFit = 'contain';
		},
		saveWatcher(id) {
			this.watcher = id;
			if (id)
				localStorage.setItem('watcher', id);
			else
				localStorage.removeItem('watcher');
		},
		startWatcher() {

		},
		removeWatcher(watcher) {
			var me = this, id = watcher.id;
			return BackgroundGeolocation.removeWatcher({ id }).then(
				function () {
					me.app.saveWatcher(null);
					me.app.toast({ duration: 2000, message: 'Se ha detenido el servicio GPS de ID=' + id, color: 'success' });
				}
			).catch(
				(error) => me.logError(error)
			);
		}
	}
})
</script>
<style>
@font-face {
	font-family: 'DeliusSwashCaps';
	src: url('~@/cdn/fonts/DeliusSwashCaps-Regular.ttf');
}

@font-face {
	font-family: 'NeoSans';
	src: url('~@/cdn/fonts/NeoSansProRegular.OTF');
}

* {
	margin: 0px;
	padding: 0px;
}

*,
ion-content,
div,
li,
span,
label,
.ui-outputlabel,
a,
ui-link,
.ui-widget {
	font-family: NeoSans !important;
}

fieldset,
.v-fieldset {
	border-color: #0f62ac !important;
}

.v-title {
	text-overflow: ellipsis;
	white-space: nowrap;
	overflow: hidden;
	position: absolute;
	padding: 5px;
	width: calc(100% - 66px);
	display: inline-block;
	left: 28px;
}

img.error {
	opacity: 0;
	width: 100%;
}

.view-list>*:not(label):not(:last-child) {
	margin-bottom: 10px;
}

.view-list>h2:first-of-type *,
.view-list>h2:first-of-type {
	font-size: 23px !important;
}

.view-list>h2:first-of-type>* {
	margin-right: 5px !important;
}

.loading {
	background: url(./cdn/images/loading.svg) no-repeat top center;
}

.v-controls>*:not(:last-child) {
	margin-right: 15px;
}

.v-primary-dark {
	display: inline-block !important;
	width: calc(100% - 80px) !important;
	padding: 5px 40px;
	text-decoration: none;
	border-radius: 10px;
	margin-bottom: 10px;
	border: 1px solid white;
}

li>.v-primary-dark {
	border-radius: 0px;
	width: calc(100% - 20px);
	border: 0px solid white;
}

body {
	background-color: #0f62ac;
}

#app {
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	color: #2c3e50;
	margin-top: 0px;
}

#page-header {
	border: 1px solid gray;
	min-height: 36px;
}

#page-header>* {
	min-height: 36px;
}

.v-widget-header,
.ui-state-default {
	border: 1px solid #a8a8a8;
	background: #c4c4c4 linear-gradient(top, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0));
	background: #c4c4c4 -webkit-gradient(linear, left top, left bottom, from(rgba(255, 255, 255, 0.8)), to(rgba(255, 255, 255, 0)));
	background: #c4c4c4 -moz-linear-gradient(top, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0));
	background: #c4c4c4 -webkit-gradient(linear, left top, left bottom, from(rgba(255, 255, 255, 0.8)), to(rgba(255, 255, 255, 0)));
	color: #333;
	font-weight: bold;
	text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
}

.v-button-text-icon-left i,
.v-button-text-icon-left svg,
a svg {
	margin-right: 10px;
}

.tre li a {
	border-bottom: 1px solid #5d4141;
	padding: 10px;
	font-size: 22px;
	font-weight: normal;
}

.tre ul {
	padding-left: 30px;
}

.tre i {
	margin-right: 10px;
	width: 26px;
	text-align: center;
}

#page-header>.v-header-button {
	min-height: 36px;
	padding: 0px 6px;
	display: inline-block;
}

.v-header-button {
	cursor: pointer;
}

.v-header-button:hover {
	background-color: #0e355a;
}

.v-header-button>svg {
	overflow: visible;
	height: 34px;
	width: 22px !important;
	color: white;
}

.ui-datatable thead th,
.ui-datatable tbody td,
.ui-datatable tfoot td,
.ui-datatable tfoot th {
	padding: 4px 5px;
	border-color: #ccd0d4;
	overflow: hidden;
	border: 1px solid #ccd0d4;
}

body {
	overflow-y: unset;
}

.v-popup-2 svg {
	left: 0px;
	top: 0px;
	margin: 10px;
	position: absolute;
}

.v-popup-2 li {
	position: relative;
	border: 1px solid #c1c1c1;
	cursor: pointer;
	padding: 7px 7px 7px 50px;
}

.v-table {
	width: 100%;
}

.v-popup-2 li:hover {
	font-weight: bold;
	background-color: #dae1e4;
}

.v-popup-2 {
	list-style-type: none;
}

@media (min-width: 700px) {
	.v-mobil {
		visibility: hidden;
		display: none;
	}
}

@media (max-width: 700px) {
	.v-popup-2 {
		width: 100% !important;
	}

	.ui-datatable-header {
		visibility: hidden;
		display: none;
	}

	.v-switch>* {
		padding: 8px;
	}
}

.v-link {
	border-radius: 50% 0% 0% 50%;
	border: 1px solid gray;
	padding: 10px 10px 10px 30px;
	background-color: #e6dff9;
}

.ic-42 svg {
	height: 36px;
	width: 36px;
	-webkit-filter: brightness(10);
	filter: brightness(10);
	background-size: 34px 34px;
	background-position: 2px 2px;
	background-repeat: no-repeat;
}

.v-map-overlay {
	background-color: white;
	border-radius: 5px;
	border: 1px solid gray;
}

.v-map-overlay .x-dlg-body {
	overflow-y: auto;
}

.v-map-overlay .x-dlg-header {
	border-radius: 5px 5px 0px 0px;
	background-color: #0f62ac;
	color: white;
	padding: 10px 30px 10px 10px;
}

.v-map-overlay .x-dlg-footer {
	padding: 5px;
}

.v-map-overlay .x-dlg-footer>* {
	display: inline-block;
}

.v-map-overlay .triangle {
	width: 0;
	height: 0;
	border-width: 21px 13px 0 13px;
	border-color: #FFFFFF transparent transparent transparent;
	border-style: solid;
	filter: drop-shadow(0px 8px 1px #A3A3A3);
	position: absolute;
	bottom: -12px;
}

.ui-user>a {
	display: inline-block;
	padding: 5px;
}

.ui-user {
	min-height: 0px !important;
	float: right;
	color: white;
	padding: 7px 0px 7px 7px;
	margin: 0px;
}

.x-menu-list {
	z-index: 1005;
	top: 38px;
	width: 200px;
}

.x-menu-list>li>a {
	padding: 10px 20px;
	display: block !important;
	width: unset !important;
}

.x-menu-bar svg.fa-bars {
	font-size: 24px !important;
	padding: 5px !important;
}

.tre ul>li a>svg {
	width: 24px;
	height: 24px;
}

.s-button {
	background: unset;
	border-radius: 10px;
	text-shadow: none;
}

.v-load-more {
	padding: 10px;
	margin: 0px 0px 10px 0px;
	background-color: gray;
	color: white;
	border-radius: 10px;
}

.v-selected>td.yellow {
	background-color: #9c9c38 !important;
}

.primary {
	background-color: rgb(15, 98, 172);
	color: white;
}

.ui-datatable-scrollable-body::-webkit-scrollbar-thumb,
::-webkit-scrollbar-thumb {
	background: rgb(15, 98, 172);
}

.img {
	width: 100%;
}

div.img.error {
	background-color: rgb(232, 232, 232);
}

.img.error>img {
	opacity: 0;
}

.v-dataview> :not(:last-child) {
	margin-bottom: 15px;
}

.v-search {
	position: relative;
	margin: 15px 0px
}

.v-search input {
	border: 1px solid rgb(187, 187, 187);
	width: calc(100% - 60px);
	background-color: rgb(232, 232, 232);
	padding: 5px 30px;
	border-radius: 10px;
}

.v-search>span {
	padding: 5px 7px;
	position: absolute;
	right: 0px;
	top: 0px;
}

.v-search>i,
.v-search>svg {
	position: absolute;
	left: 0px;
	top: 0px;
	padding: 5px 7px;
}

.v-dataview>div>* {
	width: 100%;
	display: inline-block;
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity .5s;
}

.fade-enter,
.fade-leave-to

/* .fade-leave-active below version 2.1.8 */
	{
	opacity: 0;
}

.v-input-field svg {
	margin: 5px;
	opacity: .5;
}

.v-form input,
.v-form select,
.v-form textarea {
	border-radius: 8px !important;
}

.v-input-field input {
	border-radius: 8px;
	padding-left: 26px !important;
}

.v-tab-content>span {
	text-align: justify;
	padding: 5px 0px;
}

.v-accordion>div:not(:last-child)>.v-tab-content {
	padding-bottom: 20px;
}

.v-accordion>div:not(:last-child) {
	border-bottom: 1px solid gray;
}

.v-accordion>*>.expanded {
	font-weight: bolder;
}

#page-header>* {
	min-height: unset;
}

html:not(.hydrated) body {
	display: initial !important;
}

.modaltodo .modal-wrapper {
	--min-height: 100%;
	--min-width: 100%;
	--border-radius: 0px;
}

.c-w-1 {
	width: 100%;
}

.product img {
	height: 100%;
	object-fit: cover;
	max-height: none !important;
}

.c-w-2 {
	width: calc(50% - 9px);
}

.c-w-3 {
	width: calc(33.33% - 9px);
}

.c-w-4 {
	width: calc(25% - 9px);
}

.c-w-5 {
	width: calc(20% - 9px);
}

.c-w-6 {
	width: calc(16.6667% - 9px);
}

.v-search {
	position: relative;
	margin: 15px 0px
}

.v-search input {
	border: 1px solid rgb(187, 187, 187);
	width: calc(100% - 60px);
	background-color: rgb(232, 232, 232);
	padding: 5px 30px;
	border-radius: 10px;
}

.v-search>span {
	padding: 5px 7px;
	position: absolute;
	right: 0px;
	top: 0px;
}

.v-search>i,
.v-search>svg {
	position: absolute;
	padding: 0px;
	left: 6px;
	top: 6px;
}

.v-search>input:nth-child(2) {
	padding-left: 36px !important;
}

.v-last {
	margin-right: 0px !important;
}

ion-content>.v-dataview {
	margin: 10px;
	display: inline-block;
	width: -webkit-fill-available;
}

ion-segment-button.category2 {
	padding-top: 10px;
}

.toolbar>a {
	width: 25%;
	text-align: center;
	color: #2958b1;
}

.toolbar>a .svg-inline--fa {
	width: 100% !important;
	text-align: center;

}

.sc-ion-searchbar-ios-h {
	display: block;
	height: auto;
	contain: unset;
}

.searchionic {
	margin-top: 0px !important;
}

ion-toolbar {
	min-height: auto;
}

.sub_product_detail {
	display: none !important;
}

.product .v-controls,
#iconosproducto {
	margin: 5px 0px;
}

.a_product .price {
	font-size: 22px;
	color: #FFF;
}

.v-dataview>.product {
	margin-bottom: 10px !important;
}

.ion-content-yellow {
	background-color: #ffd102;
	--ion-background-color: #ffd102;
}

.ion-content-blue {
	background-color: #2b58b5;
	--ion-background-color: #2b58b5;
}

.ion-content-blue .fa-shopping-cart {
	color: white;
}

.ion-content-blue .v-dataview>.v-more-results,
.v-dataview>.v-more-results {
	background: #ffffffff !important;
}

.v-no-results {
	background: white;
}

#logotienda {
	display: block;
	margin-left: auto;
	width: 80px;
	background-color: white;
	background-repeat: no-repeat;
	background-position: 50%;
	border-radius: 50%;
	background-size: 100% auto;
	margin-top: -25px;
	transition: .4s all;
	transition: .3s all;
	z-index: 1;
	border-style: solid;
	padding: 5px;
	border-width: 2px;
	border-color: #535353a3;
	padding: 0px;
	box-shadow: 1px 2px 2px #535353a3;
	margin-right: 10px;
}

.product-info .price {
	color: black;
}

.loading {
	background: url(./cdn/images/loading.svg) no-repeat top center !important;
}

ion-router-outlet {
	display: none;
}

.v-dialog-content {
	background-color: transparent !important;
}

.ui-panel .v-panel-titlebar {
	background: transparent !important;
	color: #2b57b5 !important;
	border-width: 0px;
	font-size: 30px;
}

.span-rounded {
	background-color: white;
	padding: 2px;
	border-radius: 1000px;
	width: 24px;
	position: absolute;
	right: 5px;
}

.v-button {
	color: white;
	background: #2b57b5;
	text-shadow: none;
}

.v-button:focus,
.v-button:hover,
.v-button:not(.ui-state-disabled):not(disabled):not(.disabled):hover {
	color: white;
	background: #1c3977 !important;
	text-shadow: none;
}

label {
	color: #2b57b5;
}

.v-button label {
	color: #FFF;
}

span.yellow {
	background-color: yellow;
}

.v-msgbox {
	background-color: white;
	text-align: center;
}

.v-widget-header>.v-panel-title {
	background-size: 20px !important;
	padding-left: 25px !important;
	background: none !important;
}

.v-button-top-float {
	float: right;
	position: sticky;
	display: inline-block;
	cursor: pointer;
	font-size: 32px;
	padding: 5px 10px;
	background-color: #c9d5ff;
	top: 12px;
	border: 1px solid #919bff;
	z-index: 100;
	border-radius: 10px;
}

.v-button-top-float>svg {
	margin: 0px;
}

.svg-inline--fa {
	font-size: 30px;
}

.v-table-buttons {
	display: inline-block;
	background-color: transparent;
	position: absolute;
	border-width: 0px;
	top: 3px;
	right: 0px;
	padding: 3px 5px;
	z-index: 200;
}

.v-table-buttons>.svg-inline--fa {
	font-size: 26px;
}

.v-dialog-content>form>h2 {
	padding-left: 44px !important;
	margin-bottom: 20px;
	position: relative;
	font-size: 24px;
	background-color: transparent;
}

fieldset>div {
	padding: 0px !important;
}

.v-table tr:nth-child(even).yellow {
	background-color: #fff767;
}

.yellow,
td.yellow {
	background-color: #ffffb0;
}

.ui-panel .v-panel-titlebar {
	background: white !important;
}

.v-fieldset {
	background-color: white;
}

button>.svg-inline--fa {
	font-size: inherit;
}</style>
