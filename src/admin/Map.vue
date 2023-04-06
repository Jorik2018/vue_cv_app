<template>
	<v-map ref="map" style="height:100%" @build="mapBuild" @addlayer="addlayer">
		<v-layer-control ref="layerControl" @scope="scope"></v-layer-control>
		<v-map-control class="ol-horizontal"
			style="top: 8px;left: 50px;width:200px;">
	
<div class="v-form"> 
			<label>Fecha:</label>
			<v-calendar v-model="o.date" />
			<label @dblclick="vehicleInput">Vehiculo:</label>
			<v-select v-model="o.plate" @input="vehicleInput">
				<option>--Seleccionar Opción--</option>
				<v-options store="vehicle" displayField="plate"  valueField="plate"/>
			</v-select>
			</div>
		</v-map-control>
		<v-map-control class="ol-vertical"
			style="top: 40px;right: 8px;widt h:200px;">
	<v-button icon="fa-draw-polygon" v-on:click="fit(routeLayer)"/>
<v-button icon="fa-car" v-on:click="fit(vehiclesLayer)"/>
<v-button icon="fa-sync" v-on:click="vehicleInput"/>
		</v-map-control>
	</v-map>
</template>
<script>
import 'ol/ol.css';
import Feature from 'ol/Feature';
import Icon from 'ol/style/Icon';
import TileWMS from 'ol/source/TileWMS';
import ImageWMS from 'ol/source/ImageWMS';
import Image from 'ol/layer/Image';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import {Vector as VectorLayer} from 'ol/layer';
import {fromLonLat} from 'ol/proj';
import {LineString} from 'ol/geom';
import {Vector as VectorSource} from 'ol/source';
import Overlay from 'ol/Overlay';
var {ol,axios}=window

ol.style.Icon=Icon;
ol.style.Feature=Feature;
ol.source.TileWMS=TileWMS;
ol.source.ImageWMS=ImageWMS;
ol.layer.Image=Image;

export default window.ui({
	mounted(){
		this.ic=require('@/cdn/images/ancash.svg');
	},
	data(){
		var o = localStorage.getItem('setting'),plate='';
		if(o){
			o = JSON.parse(o) ;
			plate=o.vehicle;
		}
		return {
			draw:null,
			source:null,
			da:null,
			sketch:null,
			drawing:null,
			vehicleLayer:null,
			vehiclesLayer:null,
			routeLayer:null,
			helpTooltipElement:null,
			helpTooltip:null,
			measureTooltipElement:null,
			measureTooltip:null,
			continuePolygonMsg:'Click to continue drawing the polygon',
			continueLineMsg:'Click to continue drawing the line',
			transform:null,
			marker:null,
			markerV:require('@/cdn/images/car.png'),
			groups:[],
			showLayers:true,showConvertor:true,filters2:{},layers:[],markerIcon:null,ic:null,
			sizeC:null,sizeR:null,/*filters: {type: 'rest'}, */
			o: {date:new Date(),concesionTab:1,mainPlate:plate,plate:plate,reinfoTab:1,order: null, id: null}
		}
	},
	watch:{
		drawing(/*nv*/){
			/*var me=this,map=me.$refs.map.map,draw=me.draw;
			if(nv){
				map.addInteraction(draw);
			}else 
				map.removeInteraction(draw);*/
		}
	},
	methods: {
		vehicleInput(){
			var me=this,o=me.o,today=o.date;
			today=typeof today=='number'?new Date(today):today;
			if(me.vehicleLayer){
				axios.get('/api/geo/location',{
						params:{
							date:today.getFullYear()+'-'+me.pad(today.getMonth()+1,2)+'-'+me.pad(today.getDate(),2),
							plate:o.plate
						}}).then((e)=>{
					var location=[];
					e.data.forEach(e=>{
						location.push(
							e.longitude<-10000?
							[parseFloat(e.longitude),parseFloat(e.latitude)]:
							fromLonLat([parseFloat(e.longitude),parseFloat(e.latitude)])
						);
					});
					var source=me.vehicleLayer.getSource();
					source.clear();
					source.addFeature(new Feature({
						geometry: new LineString(location)
					}));
					me.fit(me.vehicleLayer);
				});
			}
		},
		fit(layer){
			var map=this.$refs.map.map,view=map.getView(),ext=layer.getSource().getExtent();
			if(isFinite(ext[0])){
				view.fit(ext, {
					size: map.getSize(),
					duration:1000,
					padding: [25, 10, 25, 10],
					callback(){
						view.setZoom(Math.min(view.getZoom(),18));
					}
				});
				
			}
		},
		addlayer(){},
		createHelpTooltip() {
			var me=this,helpTooltipElement=me.helpTooltipElement,helpTooltip=me.helpTooltip,
				map=me.$refs.map.map;
			if (helpTooltipElement) {
				helpTooltipElement.parentNode.removeChild(helpTooltipElement);
			}
			console.log("SE CREA EL ELEMENTO createHelpTooltip!");
			helpTooltipElement = document.createElement('div');
			helpTooltipElement.className = 'ol-tooltip hidden ol-tooltip-measure';
			helpTooltip = new Overlay({
				element: helpTooltipElement,
				offset: [15, 0],
				positioning: 'center-left',
			});
			map.addOverlay(helpTooltip);
			me.helpTooltip=helpTooltip;
			me.helpTooltipElement=helpTooltipElement;
		},
		createMeasureTooltip() {
			var me=this,measureTooltipElement=me.measureTooltipElement,measureTooltip=me.measureTooltip,map=me.$refs.map.map;
			if (measureTooltipElement) {
				measureTooltipElement.parentNode.removeChild(measureTooltipElement);
			}
			measureTooltipElement = document.createElement('div');
			measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
			measureTooltip = new Overlay({
				element: measureTooltipElement,
				offset: [0, -15],
				positioning: 'bottom-center',
				stopEvent: false,
				insertFirst: false,
			});
			me.measureTooltipElement=measureTooltipElement;
			map.addOverlay(me.measureTooltip=measureTooltip);
		},
		refresh2(){

		},
		ss(t){
			t.resize(t.$parent.$el.clientHeight-40);
		},
		scope(){
		},
		mapBuild(e){
			var me=this,map=e.map;
			const source= new VectorSource();
			me.source=source;
			source.on('changefeature',(e)=>{
				var coords = e.feature.getGeometry().getCoordinates();
				me.da=coords;
			});
			
			
			
			
			let vehicleMap={};
			var layer = new ol.layer.Vector({
				source: new ol.source.Vector({
					features: []
				}),
				style:(feature)=> {
				
					
					const s2=new Style({
						image: new ol.style.Icon({
						anchor: [0.5, 32],
						anchorXUnits: 'fraction',
						anchorYUnits: 'pixels',
						src: me.markerV
						}),
						text: new ol.style.Text({
							stroke: new ol.style.Stroke({
							color: me.o.mainPlate==feature.values_.plate?'yellow':'white',
							width: 4
							}),
							text: feature.values_.plate,
							font: 'bold 12px Arial, Verdana, Helvetica, sans-serif',
							offsetY: 10
						})
					});
				
				
					return s2;
				}
			});
			axios.get('/api/geo/location/vehicle').then(e=>{
				//e.data);
				e.data.forEach(e=>{
					let point=new ol.geom.Point(
						e.longitude<-10000?
						[parseFloat(e.longitude),parseFloat(e.latitude)]:
						fromLonLat([parseFloat(e.longitude),parseFloat(e.latitude)])
					);
					vehicleMap[e.plate]=point;
					layer.getSource().addFeature(new ol.Feature({
						geometry: point,...e
					}));
				});
					
				
			});
			
			
			map.addLayer(me.vehiclesLayer=layer);
			
			me.app.$on('location',()=>{
				
			});
			
			/*map.on('click',(e)=>{
				let c=e.coordinate,me=this;
				point.setCoordinates(c);
				c=ol.proj.toLonLat(c);
				me.app.postLocation({plate:me.o.plate,longitude:c[0],latitude:c[1]});
			});*/
			map.addLayer(me.vehicleLayer=new VectorLayer({
				source: new VectorSource(),
				style: new Style({
					stroke: new Stroke({
						color: '#ff1111',
						width: 5,
					}),
					image: new CircleStyle({
						radius: 9,
						fill: new Fill({
							color: '#ffcc33',
						}),
					}),
				})
			}));
			if(me.o.plate)
			me.fit(me.vehicleLayer);
			axios.get('/api/geo/path').then((e)=>{
				var points=[];
				e.data.forEach(e=>{
					points.push([e.lat*1,e.lon*1]);
				});
				source.addFeature(new Feature({
					geometry: new LineString(points)
				}));
				map.addLayer(me.routeLayer=new VectorLayer({
					source: source,
					style: new Style({
						fill: new Fill({
						color: 'rgba(255, 255, 255, 0.2)',
						}),
						stroke: new Stroke({
						color: '#111111',
						width: 3,
						}),
						image: new CircleStyle({
						radius: 9,
						fill: new Fill({
							color: '#ffcc33',
						}),
						}),
					})
				}));
			});
		},
		layerOnChange(evt) {
			var me = this;
			var f = evt.feature;
			if (f.values_) {
				if (f.values_.data[2]) {
					this.o.id = f.values_.data[2];
					var view = evt.map.getView();
					view.animate({
						center: f.getGeometry().getCoordinates(),
						zoom: 17 > view.getZoom() ? 17 : view.getZoom(),
						duration: 500
					}, function () {
						me.$refs.overlay.open(evt);
					});
				} else {
					console.log(f.values_.data);
				}
			}
		},
		save(){
			var me=this,p=[];

			me.source.getFeatures().forEach((e)=>{
				p=p.concat(e.getGeometry().getCoordinates());
			});
			console.log(p);
			axios.post('/api/geo/path',{points:p}).then((e)=>{console.log(e)});
		},
		layerLoad(/*o*/) {
			//var data = o.data;
			//console.log(data);
			/*var style = function (f) {
				return [
					new ol.style.Style({
						image: new ol.style.Circle({
							radius: 14,
							stroke: new ol.style.Stroke({
								color: '#8a0000',
								width: 1
							}),
							fill2: new ol.style.Fill({
								color: 'orange'
							})
						})
					}),
					new ol.style.Style({
						image: new ol.style.Icon({
							scale: 0.85,
							src: require('@/admin/dircetur/icons/' + (f.values_.data[4] == 'rest' ? 'restaurant' : 'hotel') + '.png')
						}),
						text2: new ol.style.Text({
							text: f.values_.data[4] == 'rest' ? '\uf0f5' : '\uf236',
							font: 'normal 18px FontAwesome'
						})
					})
				]
			};*/
			/*for (var i = 0; data.length > i; i++) {
				var d = data[i];
				if (0 > parseFloat(d[0])) {
					//console.log(parseFloat(d[0])+' ; '+parseFloat(d[1]));
					var f = new ol.Feature({
						geometry: new ol.geom.Point(ol.proj.fromLonLat([parseFloat(d[0]), parseFloat(d[1])])),
						data: d
					});
					f.setStyle(style);
					o.features.push(f);
				}
			}*/
		}
	}
});
</script>
<style scope>
	.ol-tooltip-measure{
		color:blue;
		background-color:white;
		border-radius:5px;
		padding:5px;
		opacity:0.5;
	}
	.splash li {
		margin: 0;
		padding: 14px 0 14px 58px;
		list-style: none;
		background-image: url(https://www.regionancash.gob.pe/images/principal/menu_secundario_pagina/sicamif.png);
		background-repeat: no-repeat;
		background-position: left center;
		background-size: 40px;
	}
	.map-info .v-table{
		border:1px solid gray;
	}
	.map-info:not(:last-child){
		margin-bottom:10px;
	}
	.map-info .v-table td{
		padding:5px;
		line-break: anywhere;
	}
	.search{
		width:100%;
	}
	.search .v-ol-body{
		padding:0px !important;
		
	}
	.search .v-panel-titlebar{
		padding-left: 30px !important;
		background-size: 20px;
		background-position: 5px;
		background-repeat: no-repeat;
		background-image: url(https://web.regionancash.gob.pe/cdn/images/favicon.png);
	}
	.search .v-ol-body input{
		color:black;
	}
	.ui-selectlistbox-listcontainer{
		height: auto !important;
	}
	#icon-ancash{
		color:white;
		fill:red;
	}
	.item-icon > div > span:nth-child(1){
		margin-left: 1px;margin-top: 2px;margin-right:10px;display:inline-block;width:24px;height:24px;
	}
	.item-icon > div > span:nth-child(2){
		display: inline-block;
		margin-left: 0px;
		margin-top: 5px;
		margin-right: 10px;
		float: right;
		display: inline-block;
		width: calc(100% - 45px);
	}
	.ic-42 {
		background-image: url(/img/ancash.177e7438.svg);
		background-repeat: no-repeat;
		color: white !important;
		background-size: 40px 40px;
		background-position: 4px 4px;
		fill: #ab4444 !important;
	}
	.ic-42 path {
		fill: red;
	}
	.ic-42 button{
	width: -webkit-fill-available !important;
    height: -webkit-fill-available !important;
	}
	.ui-button {
		margin-right: 0px !important;
	}
	.ui-selectonelistbox{
		padding: 0px;
	}
	[data-type='tourist']{
		border: 1px #2f6126 solid !important;
		background-color: #afffaf;
	}
	.container{
		position: relative;
		padding-top: 25%;
		float: left;
		display: inline-block;
		margin-right: -4px;
		border:1px solid gray;
		width: calc(33.33% - 2px);
		margin:0px !important;
		word-spacing: -1;
	}
	.text{
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		text-align: center;
		overflow-y: hidden;
		color: white;
		opacity: 0.7;
	}
	.container .text{
		-webkit-transition: opacity 0.2s ease-in-out;
		-moz-transition: opacity 0.2s ease-in-out;
		-o-transition: opacity 0.2s ease-in-out;
		transition: opacity 0.2s ease-in-out;
	}
	.container:hover .text {
		opacity: 1;
	}
	@media(max-width:700px){
		.as1{
			width: calc(100% - 2px) !important;
			float: left !important;
			height: calc(100% - 2px) !important;
		}
		.as2{
			width: calc(100% - 2px) !important;
			float: right !important;
			height: auto !important;
		}
		.container{
			width: calc(50% - 2px) !important;
			padding-top: 45%;
		}
	}
	#marker-tooltip{
		border-width: 0px !important;
		background-color: transparent ; padding: 0px;
	}
	.x-dlg-header{
		border-radius: 4px 4px 0px 0px;
		background-color:#0f62ac;
		color:white;padding: 10px;
	}
	.x-dlg-body{
		border: 1px solid #a5a5a5;
		border-width: 0px 1px 0px 1px;
		background-color: white;
		height:460px;
		overflow: auto;
	}
	.x-dlg-footer{
		text-align: right;
		border: 1px solid #a5a5a5;
		padding:5px;
		border-width: 1px 1px 0px 1px;
		background-color: white;
	}
	.x-link{
		text-decoration:  underline;
		color: #3399ff;
		cursor: pointer;
	}
	.summary{
		bottom: 44px;
		left: 0.5em;
		background-color: rgb(255 255 255 / 73%) !important;
		color: black;
		transition: background-color 1s;
	}
	.summary:hover{
		background-color: white !important;
	}
	.summary .v-checkbox{
		height:auto;
		margin-bottom: 3px;
	}
	ul.v-tabs li {
		display: inline-block;
		border: 1px solid gray;
		padding: 3px 5px;
		cursor:pointer;
	}
	.v-panel-titlebar{
	cursor:grab;
	}
	.ol-horizontal > button{
		float:right;
	}
</style>