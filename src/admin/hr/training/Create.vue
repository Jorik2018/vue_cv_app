<template>
  <v-form action="/api/hr/training" :header="(o.id ? 'Editar' : 'Crear') + ' Capacitaciones'"
    :class="
      o.id < 0 || (o.tmpId && !o.synchronized)
        ? 'yellow'
        : o.tmpId
          ? 'green'
          : ''
    " store="training">
    <div class="v-form">
		<label>Empleado:</label>
		<div><a :href="'/admin/hr/employee/'+o.employeeId"><template v-if="o.people">{{o.people.surnames}} {{o.people.names}}</template></a></div>
		<label>Denominacion:</label>
		<input v-model="o.name"/>
		<label>Fecha Inicio:</label>
		<v-calendar v-model="o.startDate"/>
		<label>Fecha Termino:</label>
		<v-calendar v-model="o.endDate"/>
		<label>Institución:</label>
		<input v-model="o.entity"/>
		<label>Ciudad / Pais:</label>
		<input v-model="o.city"/>
		<label>Horas Lectivas:</label>
		<v-number v-model="o.hours"/>
		<label>Documentación: </label>
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
var { _, axios } = window;
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
      me.getStoredList("training").then((trainings) => {
        trainings.forEach((e) => {
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
                e.trainingId = o.id;
              });
            _.db
              .transaction(["training"], "readwrite")
              .objectStore("training")
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
    onInputFUR(o) {
      if (o) {
        o = new Date(o);
        o.setFullYear(o.getFullYear() + 1);
        o.setMonth(o.getMonth() - 3);
        o.setDate(o.getDate() + 7);
      }
      this.o.gestanteFPP = _.toDate(o, "date-");
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
	async changeRoute() {
		var me = this,
		id = me.id;
		me.trayLocation = 0;
		if (id < 0) {
			me.getStoredList("training").then((training) => {
				training.forEach((e) => {
					if (e.tmpId == Math.abs(me.id)) {
						me.o = e;
						me.$refs.province.load({ code: me.o.region || "02" });
						me.trayLocation = Number(e.lat) && e.lon;
					}
				});
			});
		} else if (Number(id)) {
			axios.get("/api/hr/training/" + id).then((response) => {
				var o = response.data;
				if (o.province_code) {
				o.province_code = me.pad(o.province_code, 4);
				o.region = o.province_code.substring(0, 2);
				}
				me.o = o;
			});
		}else{
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
        me.$router.replace("/admin/hr/training/" + nid);
    },
    
  },
});
</script>