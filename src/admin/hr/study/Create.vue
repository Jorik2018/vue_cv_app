<template>
  <v-form action="/api/hr/study" :header="(o.id ? 'Editar' : 'Crear') + '  Estudio'"
    :class="
      o.id < 0 || (o.tmpId && !o.synchronized)
        ? 'yellow'
        : o.tmpId
          ? 'green'
          : ''
    " store="study">
    <div class="v-form">
		<label>Empleado:</label>
		<div><a :href="'/admin/hr/employee/'+o.employeeId">
			<template v-if="o.people">{{o.people.surnames}} {{o.people.names}}</template>
			<template v-else>{{o.employeeId}}</template>
		</a></div>
        <label>Titulo / Grado:</label>
        <input v-model="o.grade" required="true"/>
        <label>Especialidad:</label>
        <input v-model="o.name" required="true"/>
        <label>Fecha Expedición:</label>
        <v-calendar v-model="o.expeditionDate" required="true"/>
        <v-checkbox v-model="o.inProgress" label="Estudios en curso"/>
        <label>Universidad:</label>
        <input v-model="o.entity" required="true"/>
        <label>Ciudad / Pais</label>
        <input v-model="o.city" required="true"/>
        <label>Documentación:</label>
        <template v-if="o.attachment">
      <a class="_" v-if="o.attachment.tempFile" :href="'/uploads/'+o.attachment.tempFile" target="_new" >
      {{ o.attachment.tempFile }}
    </a>
    <a class="_" v-else :href="'/uploads/'+o.attachment" target="_new">
      {{ o.attachment }}
    </a>
    </template>
		<v-uploader icon="fa-upload" @input="o.attachment=$event"/>
    </div>
    <center>
      <v-button value="Grabar" icon="fa-save" class="blue" @click.prevent="save"></v-button>
    </center>
  </v-form>
</template>
<script>
import { Geolocation } from "@capacitor/geolocation";
import "ol/ol.css";
import Feature from "ol/Feature";
import Icon from "ol/style/Icon";
var { _, axios, ol } = window;
ol.style.Icon = Icon;
ol.style.Feature = Feature;
export default _.ui({
	props: ["id","employee"],
	data() {
		return {
			count: 0,
			o: {
				id: null,
				attachment:null,
				synchronized: null,
				tmpId: null,
				employeeId:null
			},
		};
	},
  computed: {
    filteredEvent() {
      return this.o.category != null
        ? this.event
          .filter((e) => e.category == this.o.category)
          .map((e) => e.type)
          .filter((value, index, self) => self.indexOf(value) === index)
        : [];
    },
    filteredDetailEvent() {
      return this.o.type != null
        ? this.event
          .filter(
            (e) => e.category == this.o.category && e.type == this.o.type
          )
          .map((e) => e.detail)
        : [];
    },
  },
  created() {
    var me = this;
    me.$on("sync", (o) => {
      me.getStoredList("study").then((peoples) => {
        peoples.forEach((e) => {
          if (e.tmpId == Math.abs(o.tmpId)) {
            if (e.damage_salud)
              e.damage_salud.forEach((e) => {
                if (o.damage_salud)
                  o.damage_salud.forEach((o) => {
                    if (o.tmpId == e.tmpId) {
                      e.id = o.id;
                      e.synchronized = o.synchronized;
                    }
                  });
                e.peopleId = o.id;
              });
            _.db
              .transaction(["study"], "readwrite")
              .objectStore("study")
              .put(e);
          }
        });
      });
    });
  },
  mounted() {
    var me = this;
    me.changeRoute();
  },

  methods: {
    inputEdad(){
      this.o.edad=this.o.fecha_nacimiento?this.app.getAge(this.o.fecha_nacimiento):null;
    },
    onInputFUR(o) {
      if (o) {
        o = new Date(o);
        o.setFullYear(o.getFullYear() + 1);
        o.setMonth(o.getMonth() - 3);
        o.setDate(o.getDate() + 7);
      }
      this.o.gestanteFPP = _.toDate(o, "date-");
    },
    inputProvince(a,b){
      var me=this,o=me.o;
      o.province=(b ? b.object.name || "" : "");
      me.$refs.district.load({ code: o.province_code })
    },
    inputDistrict(a,b){
      var me=this,o=me.o;
      o.district=b ? b.object.name || "" : "";
      me.$refs.ccpp.load({ id: o.district_code })
    },
    inputCCPP(a, b) {
      this.o.ccpp = b ? b.object.name || "" : "";
    },
    inputEstablishment(a, b) {
      this.o.establecimiento = b ? b.object.name : "";
    },
    process(o) {
      return o;
    },
    mapBuild() {
      var o = this.o;
      if (0 > o.lon) {
        this.$refs.map.addFeature(
          {
            lon: o.lon,
            lat: o.lat,
          },
          {}
        );
      }
    },
    translateend(o) {
      this.o.lat = o.lat;
      this.o.lon = o.lon;
    },
    async addMarker() {
      //var o = this.o;
      var me = this,
        m = me.$refs.map;
      if (!m.collection.getLength()) {
        me.trayLocation = 1;
        const coordinates = await Geolocation.getCurrentPosition();
        var c = coordinates.coords;
        me.o.lat = c.latitude;
        me.o.lon = c.longitude;
        if(m)
        m.addFeature({ draggable: true, lat: me.o.lat, lon: me.o.lon }, { zoom: 14 });
      } else
        m.map.getView().animate({
          center: m.collection.item(0).getGeometry().getCoordinates(),
          zoom: 17,
          duration: 500,
        });
    },
    async changeRoute() {
      var me = this,
        id = me.id;
      me.trayLocation = 0;
      if (id < 0) {
        me.getStoredList("study").then((study) => {
          study.forEach((e) => {
            if (e.tmpId == Math.abs(me.id)) {
              me.o = e;
              me.$refs.province.load({ code: me.o.region || "02" });
              me.trayLocation = Number(e.lat) && e.lon;
            }
          });
        });
      } else if (Number(id)) {
        axios
          .get("/api/hr/study/" + id)
          .then((response) => {
            var o = response.data;
            me.o = o;
          });
      } else {
        try {
          var s = localStorage.getItem("setting");
          if (s) {
            s = JSON.parse(s);
            var o = this.o;
            if (s.region) o.region = s.region.code;
            if (s.province) o.province_code = s.province.code;
            if (s.district) o.district_code = s.district.code;
            if (s.town) o.ccpp_code = s.town.id;
            /*o.town = s.town;*/
          }
        } catch (e) {
          console.log(e);
        }
        me.o.employeeId=me.employee;
      }
    },
    close(r) {
      var me = this, o = me.o;
      if (r.success === true) {
        me.o.id = r.data.id;
        me.o.tmpId = r.data.tmpId;
        if (r.data.uploaded) {
          delete o.tempFile;
        }
      }
      var nid = o.tmpId ? -o.tmpId : o.id;
      if (me.id != nid)
        me.$router.replace("/admin/hr/study/" + nid);
    }
  },
});
</script>