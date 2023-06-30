<template>
  <v-form action="/api/hr/employee" :header="'Ver  Empleado'" @resize="onResize"
    :class="
      o.id < 0 || (o.tmpId && !o.synchronized)
        ? 'yellow'
        : o.tmpId
          ? 'green'
          : ''
    " store="people">
    <div class="v-form">
		<label>Documento:</label>
        <div>{{o.code}}</div>
		<label>Nombre Completo:</label>
		<div>{{o.surnames}} {{o.names}}</div>
		<v-fieldset legend="Estudios" closable="true">
			<v-table autoload="false" class="study" :scrollable="true" :width="width" :style="tableStyle"
			src="/api/hr/study/0/0" :value="o.study" store="emed_study"
			row-style-class="row.synchronized?'green':(row.tmpId>0?'yellow':'')" ref="study" :filters="filters"
			@row-select="selections.study = $event.current">
				<template v-slot:default="{ row, index }">
					<td header="N°" class="center" width="40">{{ pad(index+ 1, 2) }}</td>
					<td header="Grado" width="220">{{ row.grade }}</td>
					<td header="Nombre" width="220">{{ row.name }}</td>
					<td header="Entidad" width="220">{{ row.entity }}</td>
					<td header="Fecha Expedición" class="center" width="120">{{ row.expeditionDate }}</td>
				</template>
			</v-table>
			<div class="right" style="margin-top: 10px">
				<v-button icon="fa-trash" :disabled="!selections.study" @click="destroy"></v-button>
				<v-button icon="fa-pen" :disabled="!selections.study" @click="edit"></v-button>
				<v-button icon="fa-plus" @click="add('study', o)"></v-button>
			</div>
		</v-fieldset>
		<v-fieldset legend="Capacitaciones" closable="true">
			<v-table autoload="false" class="training" :scrollable="true" :width="width" :style="tableStyle"
			src="/api/hr/training/0/0" :value="o.training" store="emed_study"
			row-style-class="row.synchronized?'green':(row.tmpId>0?'yellow':'')" ref="training" :filters="filters"
			@row-select="selections.training = $event.current">
				<template v-slot:default="{ row, index }">
					<td header="N°" class="center" width="40">{{ pad(index+ 1, 2) }}</td>
					<td header="Nombre" width="220">{{ row.name }}</td>
					<td header="Horas" class="center" width="100">{{ row.hours }}</td>
					<td header="Entidad" width="220">{{ row.entity }}</td>
					<td header="Fecha Ini" class="center" width="120">{{ row.startDate }}</td>
					<td header="Fecha Fin" class="center" width="120">{{ row.endDate }}</td>
				</template>
			</v-table>
			<div class="right" style="margin-top: 10px">
				<v-button icon="fa-trash" :disabled="!selections.training" @click="destroy"></v-button>
				<v-button icon="fa-pen" :disabled="!selections.training" @click="edit"></v-button>
				<v-button icon="fa-plus" @click="add('training', o)"></v-button>
			</div>
		</v-fieldset>
		<v-fieldset legend="Experiencia laboral" closable="true">
			<v-table autoload="false" class="study" :scrollable="true" :width="width" :style="tableStyle"
			src="/api/hr/experience/0/0" :value="o.experience" store="emed_study"
			row-style-class="row.synchronized?'green':(row.tmpId>0?'yellow':'')" ref="experience" :filters="filters"
			@row-select="selections.experience = $event.current">
				<template v-slot:default="{ row, index }">
					<td header="N°" class="center" width="40">{{ pad(index+ 1, 2) }}</td>
					<td header="Cargo" width="220">{{ row.position }}</td>
					<td header="Entidad" width="220">{{ row.entity }}</td>
					<td header="Fecha Ini" class="center" width="120">{{ row.startDate }}</td>
					<td header="Fecha Fin" class="center" width="120">{{ row.endDate }}</td>
				</template>
			</v-table>
			<div class="right" style="margin-top: 10px">
				<v-button icon="fa-trash" :disabled="!selections.experience" @click="destroy"></v-button>
				<v-button icon="fa-pen" :disabled="!selections.experience" @click="edit"></v-button>
				<v-button icon="fa-plus" @click="add('experience', o)"></v-button>
			</div>
		</v-fieldset>
    </div>

	<center>
      <v-button value="Editar" icon="fa-pen" class="blue" @click.prevent="edit"></v-button>
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
	props: ["id"],
	data() {
		return {
			count: 0,
			red: [],
			age:null,
			trayLocation: null,
			width: null,
			tableStyle:{maxHeight: '400px',width:null},
			selections: { study: null, training: null, experience: null },
			o: {
				id: null,
				synchronized: null,
				tmpId: null,
				study:[],
				experience:[],
				training:[]
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
            if (e.study)
              e.study.forEach((e) => {
                if (o.study)
                  o.study.forEach((o) => {
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
		override(url){return '/admin'+url;},
		add(table, o) {
			this.open(
				'/admin/hr/employee/'+o.id+'/'+table.replace('_', '-')+'/create',
				this.$refs[table].load
			);
		},
		getScrollBarWidth() {
			var w = this.w;
			if (!w) {
				let el = document.createElement("div");
				el.style.cssText = "overflow:scroll; visibility:hidden; position:absolute;";
				document.body.appendChild(el);
				this.w = w = el.offsetWidth - el.clientWidth;
				el.remove();
			}
			return w;
		},
		onResize(e) {
			var w = e.$target.$el.offsetWidth - 44 - this.getScrollBarWidth();
			Array.prototype.forEach.call(
				this.$el.querySelectorAll(".v-datatable"),
				(e) => {
					this.tableStyle.width = w + "px";
					this.width = w;
					console.log(e);
				}
			);
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
          .get("/api/hr/employee/" + id)
          .then((response) => {
            var o = response.data;
            me.trayLocation = 0;
            me.o = o;
			for (const value of Object.values(me.$refs))value.kc++;
            //me.$refs.province.load({ code: o && o.region || '02' });
          });
      }/* else {
        try {
          var s = localStorage.getItem("setting");
          if (s) {
            s = JSON.parse(s);
            var o = this.o;
            o.town = s.town;
          }
        } catch (e) {
          console.log(e);
        }
      }*/
    },
	edit(){
		var me = this, o = me.o;
		var nid = o.tmpId ? -o.tmpId : o.id;
		me.$router.replace("/admin/hr/employee/" + nid+'/edit');
	},
	view(){
		var me = this, o = me.o;
		var nid = o.tmpId ? -o.tmpId : o.id;
		me.$router.replace("/admin/hr/employee/" + nid);
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
        me.$router.replace("/admin/hr/employee/" + nid);
    }
  },
});
</script>