<template>
	<ion-content :scroll-events="true">
		<v-form style="padding:10px;" class="v-form" store="setting">
			<h2
				style="padding-left: 34px;margin-bottom:20px;position: relative;
				font-size: 24px;background-color: transparent;">
				<i class="fa fa-sliders-h" style="position: absolute; left: 2px; top: 3px;"></i>
				Configuración
			</h2>
			<v-fieldset :key="k" legend="Juridiccion de encuesta predeterminada">
				<v-button icon="fa fa-sync" value="Recuperar Datos Maestros" @click="load"
					style="width:-webkit-fill-available;" />

				<label>Región:</label>
				<v-select v-model="o.region" ref="regionSelect" v-bind:label="o.regionName ? o.regionName : '---'"
					v-on:input="$refs.provinceSelect.load({ code: o.region ? o.region.code : '*' })">
					<option value="">Seleccionar Opción</option>
					<v-options store="region" display-field="name" />
				</v-select>
				<label>Provincia:</label>
				<v-select v-bind:label="o.provinceName ? o.provinceName : '---'" autoload="false" v-bind:disabled="!o.region"
					ref="provinceSelect" v-model="o.province"
					@input="$refs.districtSelect.load({ code: o.province ? o.province.code : '*' })">
					<option value="">Seleccionar Opción</option>
					<v-options store="province" display-field="name" />
				</v-select>
				<label>Distrito:</label>
				<v-select autoload="false" v-bind:label="o.districtName ? o.districtName : '---'" v-bind:disabled="!o.province"
					ref="districtSelect" v-model="o.district">

					<option value="">Seleccionar Opción</option>
					<v-options store="district" display-field="name" />
				</v-select>
			</v-fieldset>
		</v-form>
	</ion-content>
</template>
<script>
import { IonContent } from '@ionic/vue';

export default window._.ui({
	components: { IonContent },
	props: ['id'],
	data() { return { o: {}, k: 0 } },
	mounted() {
		var o = localStorage.getItem('setting');
		this.o = o ? JSON.parse(o) : {};
	},
	methods: {
		load() {
			var me = this,axios = window.axios,db = window._.db;
			var timer;
			var reset = function () {
				me.k++;
			};
			var postAdd = function () {
				clearTimeout(timer);
				timer = setTimeout(reset, 500);
			};
			postAdd();
			[
				["/api/vehicle", "vehicle"],
				["/admin/directory/api/district/0/0", "district"],
				["/admin/directory/api/region/0/0", "region"],
				["/admin/directory/api/province/0/0", "province"]
			].forEach((e) => {
				axios.get(e[0]).then(function (data) {
					var objectStore = db
						.transaction([e[1]], "readwrite")
						.objectStore(e[1]);
					data = data.data;
					try {
						objectStore.clear().onsuccess = async () =>  {
							for (var i in data) {
								try {
								
									await objectStore.add(data[i]);
								} catch (exception) {
								console.log(data[i]);
									console.log("Error during add on " + e[1]);
									
									throw exception;
								}
							}
						};
					} catch (exception) {
						console.error(exception);
					}
				});
			});

		},
		save() {
			localStorage.setItem('setting', JSON.stringify(this.o));
			this.app.toast('Configuracion grabada!');
		},

		changeRegion(e, o, s) {
			s.load({ regionId: o.id });
		},

		changeDistrict() { },

		changeProvince(e, o, s) {
			s.load({ provinceId: o.code });
		},
		close2(o) {
			if (o.data.id) this.o.id = o.data.id;
		}
	}
});
</script>
<style scope>
.table input {
	width: 100% !important;
}

.table td {
	padding: 2px;
}

.ww>a:not(:last-child) {
	margin-bottom: 20px;
}

.ww>a {
	display: block;
	border: 1px solid gray;
	padding: 10px;
}

.ww span {
	font-size: 16px;
	font-weight: bolder;
}

.ww i {
	font-size: 14px;
	color: gray;
	display: block;
}

.ww div {
	display: inline-block;
	width: calc(100% - 100px);
	padding-top: 20px;
	float: left;
}

.ww img {
	width: 100px;
}

img.error {
	padding: 30% !important;
	width: 40% !important;
	background-color: transparent;
}

.cart-control>* {
	display: block;
	width: 90%;
}

.cart-control>*:not(:last-child) {
	margin-bottom: 10px;
}

.controls a:not(:last-child) {
	display: inline-block;
	margin-right: 10px;
}

.product {
	padding: 20px;
	background-color: white;
	position: relative;
}

.product-list iframe {
	width: 100%;
}

.controls {
	position: relative;
}

.controls>*:not(:last-child) {
	margin-right: 10px;
}

fieldset>div {
	padding: 10px;
}

.view {
	margin: 15px 0px;
}

.inner-scroll {
	--padding: 10px;
}

.v-fieldset {
	border: 1px solid #0f62ac;
}

.v-controls {
	font-size: 30px;
}</style>