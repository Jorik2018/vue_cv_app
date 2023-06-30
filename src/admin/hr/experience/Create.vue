<template>
  <v-form action="/api/hr/experience" :header="(o.id ? 'Editar' : 'Crear') + '  Experiencia'"
    :class="
      o.id < 0 || (o.tmpId && !o.synchronized)
        ? 'yellow'
        : o.tmpId
          ? 'green'
          : ''
    " store="experience">
    <div class="v-form">
		<label>Empleado:</label>
		<div><a :href="'/admin/hr/employee/'+o.employeeId"><template v-if="o.people">{{o.people.surnames}} {{o.people.names}}</template>
		<template v-else>{{o.employeeId}}</template>
		</a></div>
        <label>Entidad / Empresa:</label>
        <input v-model="o.entity"/>
        <label>Cargo:</label>
        <input v-model="o.position" />
        <label>Fecha Inicio:</label>
        <v-calendar v-model="o.startDate"/>
        <label>Fecha Termino:</label>
        <v-calendar v-model="o.endDate"/>
        <label>Experiencia Especifica?:</label>
        <v-switch v-model="o.specific"/>
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
			red: [],
			age:null,
			trayLocation: null,
			o: {
				id: null,
				synchronized: null,
				attachment:null,
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
      me.getStoredList("experience").then((experiences) => {
        experiences.forEach((e) => {
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
                e.experienceId = o.id;
              });
            _.db
              .transaction(["experience"], "readwrite")
              .objectStore("experience")
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
    async changeRoute() {
      var me = this,
        id = me.id, m = me.$refs.map;me.age=0;
      me.trayLocation = 0;
      if (id < 0) {
        me.getStoredList("experience").then((experience) => {
          experience.forEach((e) => {
            if (e.tmpId == Math.abs(me.id)) {
              me.o = e;
              if(m)
              m.addFeature({ draggable: true, lat: me.o.lat, lon: me.o.lon }, { zoom: 14 });
              //me.$refs.province.load({ code: me.o.region || "02" });
              me.trayLocation = Number(e.lat) && e.lon;
            }
          });
        });
      } else if (Number(id)) {
        axios
          .get("/api/hr/experience/" + id)
          .then((response) => {
            var o = response.data;
			o.specific=o.specific=='1';
            if (o.red) {
              o.red = me.pad(o.red, 2);
            }
            if (o.microred) {
              o.microred = me.pad(o.microred, 4);
            }
            if (o.province_code) {
              o.province_code = me.pad(o.province_code, 4);
              o.region = o.province_code.substring(0, 2);
            }
            if (o.district_code) o.district_code= me.pad(o.district_code, 6);
            if (o.ccpp_code) o.ccpp_code= me.pad(o.ccpp_code, 10);
            me.trayLocation = 0;
            me.o = o;
            me.age=o.edad;
            if(Number(o.lat)&&Number(o.lon)){
              if(m)
              m.addFeature({ draggable: true, lat: o.lat, lon: o.lon }, { zoom: 14 });
              me.trayLocation = 1;
            }
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
        me.$router.replace("/admin/hr/experience/" + nid);
    }
  },
});
</script>