<template>
  <v-form action="/admin/desarrollo-social/api/people" :header="(o.id ? 'Editar' : 'Crear') + '  Registro Datos'"
    :class="
      o.id < 0 || (o.tmpId && !o.synchronized)
        ? 'yellow'
        : o.tmpId
          ? 'green'
          : ''
    " store="people">
    <div class="v-form">
        <label>Documento Identidad:</label>
        <input v-model="o.dni" class="center"/>
        <label>Nombres:</label>
        <input v-model="o.names" />
        <label>Apellido Paterno:</label>
        <input v-model="o.fatherSurname" />
        <label>Apellido Materno:</label>
        <input v-model="o.motherSurname" />
        <label>Fecha Nacimiento:</label>
        <v-calendar v-model="o.fecha_nacimiento" @input="inputEdad"/>
        <label>Sexo:</label>
        <v-radio-group required="true" v-model="o.sex">
          <v-radio label="Masculino" value="M"></v-radio>
          <v-radio label="Femenino" value="F"></v-radio>
        </v-radio-group>
        <label>RUC:</label>
        <input v-model="o.ruc" />
        <label>Telefono:</label>
        <input v-model="o.phone" />
        <label>Celular:</label>
        <input v-model="o.cellPhone" />
        <label>Correo Electronico:</label>
        <input v-model="o.mail" />
        <label>estado Civil:</label>
        <input v-model="o.mail" />
        <label>Dirección:</label>
        <v-textarea v-model="o.address" maxlength="255"/>
        <label>Región:</label>
        <div>ANCASH</div>
        <label>Provincia:</label>
        <v-select ref="province" storage="province_selected" v-model="o.provinceCode" :required="true"
          @input="inputProvince">
          <option>Select One...</option>
          <v-options store="province" display-field="name" value-field="code" />
        </v-select>
        <label>Distrito:</label>
        <v-select ref="district" :autoload="false" store="district_selected" :disabled="!o.provinceCode"
          v-model="o.districtCode" name="district" required="true" @input="inputDistrict">
          <option value="">Select One...</option>
          <v-options store="district" value-field="code" display-field="name" />
        </v-select>
        <label>Nombre de Colegio Profesional:</label>
        <input v-model="o.collegeName" />
        <label>Colegio Profesional (si aplica, N° de Colegiatura):</label>
        <v-number v-model="o.collegeNumber" />
        <label>Cuenta con Habilitacion Vigente:</label>
        <v-switch v-model="o.enabledCollege" />
        <label>Perteneció a FFAA?:</label>
        <v-switch v-model="o.ffaa"/>
        <label>Es usted una persona con discapacidad?:</label>
        <v-switch v-model="o.disabledPeople"/>
        <label>Es deportista de Alto nivel?:</label>
        <v-switch v-model="o.higthLevelAthlete"/>
        <label>Autorizo expresamente que se me notifique toda documentación a mi correo electronico antes señalado:</label>
        <v-switch v-model="o.authorizeNotify"/>
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
  props: ["id"],
  data() {
    return {
      count: 0,
      red: [],
      age:null,
      financiador:[
        "NINGUNA","SIS", "ESSALUD", "PRIVADA", "PNP" 
      ],
      risk: [
        "INVIDENTE",
        "DIFICULTAD PIERNAS",
        "DISCAPACIDAD CARA",
        "DISCAPACIDAD CARA Y LABIOS",
        "DISCAPACIDAD MENTAL",
        "EXTREMIDADES",
        "MINUSVALIDA",
        "PARALISIS",
        "SORDO MUDO",
        "SINDROME DOWN",
        "SORDERA",
        "SORDO MUDO",
        "TARTAMUDO",
        "TRANSTORNO DE CADERA",
        "Otro",
      ],
      resultadoVisita: ["EJECUTADO", "RECHAZADO", "ABANDONADO"],
      trayLocation: null,
      o: {
        id: null,
        province_code:null,
        district_code:null,
        synchronized: null,
        lat: null,
        tmpId: null,
        lon: null,
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
      me.getStoredList("people").then((peoples) => {
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
              .transaction(["people"], "readwrite")
              .objectStore("people")
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
    async printCurrentPosition() {
      this.trayLocation = 1;
      const coordinates = await Geolocation.getCurrentPosition();
      var c = coordinates.coords;
      this.o.lat = c.latitude;
      this.o.lon = c.longitude;
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
      if (!this.trayLocation) {
        this.MsgBox("Debe tratar de obtener la geolocalización.");
        return false;
      }
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
        id = me.id, m = me.$refs.map;me.age=0;
      me.trayLocation = 0;
      if (id < 0) {
        me.getStoredList("people").then((people) => {
          people.forEach((e) => {
            if (e.tmpId == Math.abs(me.id)) {
              me.o = e;
              if(m)
              m.addFeature({ draggable: true, lat: me.o.lat, lon: me.o.lon }, { zoom: 14 });
              me.$refs.province.load({ code: me.o.region || "02" });
              me.trayLocation = Number(e.lat) && e.lon;
            }
          });
        });
      } else if (Number(id)) {
        axios
          .get("/admin/desarrollo-social/api/people/" + id)
          .then((response) => {
            var o = response.data;
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
            me.$refs.province.load({ code: o && o.region || '02' });
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
        me.$refs.province.load({ code: me.o && me.o.region || '02' });
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
        me.$router.replace("/admin/desarrollo-social/people/" + nid);
    },
    async getCurrentPosition() {
      var me = this;
      //const {Geolocation} = Plugins;
      const c = await Geolocation.getCurrentPosition();
      me.o.lat = c.coords.latitude;
      me.o.lon = c.coords.longitude;
    },
    getCoordinates() {
      var me = this;
      if (me.getCurrentPosition) {
        me.getCurrentPosition();
      } else
        _.getLocation().then(function (c) {
          me.o.lat = c.coords.latitude;
          me.o.lon = c.coords.longitude;
        });
    },
  },
});
</script>