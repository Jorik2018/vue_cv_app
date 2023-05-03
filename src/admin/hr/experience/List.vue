<template>
    <ion-content :scroll-events="true">
        <v-form header="Experiencias" action="/admin/hr/experience">
		<!--div><label>EMPLEADO:</label> {{session.people.display_name}}</div-->
            <v-table :selectable="true" row-style-class="row.synchronized?'green':(row.tmpId>0?'yellow':'')"
                store="experience" @loaded="ll" :scrollable="true" rowKey="id" :pagination="20" @updated="app.bindLinks($el)"
                :filters="filters" src="/api/hr/experience">
				
                <template v-slot:header>
				
                    <v-button value="Enviar" v-if="app.connected" icon="fa-save" :disabled="!rowSelectedCount"
                        @click.prevent="sync"></v-button>
                    <v-button value="Crear" v-if="1 || can(perms.HR_REGISTER_EXPERIENCE)" icon="fa-plus"
                        class="on" @click.prevent="create"></v-button>
                    <v-button value="Editar" v-if="1 || can(perms.HR_REGISTER_EXPERIENCE)" icon="fa-pen"
                        @click.prevent="edit" :disabled="!rowSelectedCount"></v-button>
                    <v-button value="Eliminar" v-if="1 || can(perms.HR_REGISTER_EXPERIENCE)" icon="fa-trash"
                        @click.prevent="destroy" :disabled="!rowSelectedCount"></v-button>
                    <v-button title="Refrescar" icon="fa-sync" @click.prevent="refresh"></v-button>
                </template>
                <template v-slot="{ row }">
                    <td width="80" class="center" header="ID">
                        <v-filter>
                            <input disabled />
                        </v-filter>
                        {{ pad(row.id, 4) }}
                    </td>
                    <td width="220" header="Empresa" >
                        <v-filter>
                            <input v-model="filters.entity" />
                        </v-filter>
                        {{ row.entity }}
                    </td>
                    <td width="220" header="Cargo" >
                        <v-filter>
                            <input v-model="filters.position" />
                        </v-filter>
                        {{ row.position }}
                    </td>
                    <td width="120" header="Fecha Ini" class="center">
                        <v-filter>
                            <input v-model="filters.startDate" />
                        </v-filter>
                        {{ row.startDate }}
                    </td>
                    <td width="120" header="Fecha Fin" class="center">
                        <v-filter>
                            <input v-model="filters.endDate" />
                        </v-filter>
                        {{ row.endDate }}
                    </td>
                    <td width="120" header="Especifica" class="center">
                        <v-filter>
                            <input v-model="filters.specific" />
                        </v-filter>
                        {{ row.specific }}
                    </td>
                    <td width="200" header="Documento" class="center">
                        <v-filter>
                            <input v-model="filters.attachment" />
                        </v-filter>
                        <a class="_" v-if="row.attachment" :href="'/uploads/'+row.attachment" target="_new">
      
      {{ row.attachment }}
    </a>
                    </td>
                    <td width="220" header="Inserted" class="center">
                        <v-filter>
                            <input v-model="filters.insertDate" />
                        </v-filter>
                        {{ row.insertDate | date}}
                    </td>
                    <td width="220" header="Updated" class="center">
                        <v-filter>
                            <input v-model="filters.updatedDate" />
                        </v-filter>
                        {{ row.updatedDate |date}}
                    </td>
                </template>
            </v-table>
        </v-form>
    </ion-content>
</template>
<script>
var _ = window._;
export default _.ui({
    data() {
        return { rowSelectedCount2: 0, page: 0, data: [], mode: 0, query: null }
    },
    created() {
        var me = this;
        me.filters.uid = me.user.uid;
        me.$on('sync', function (dr, dl) {//data remote -> data local
            if (dr.people && dl.people) {
                dr.people.forEach(pr => {
                    dl.people.forEach(pl => {
                        if (pl.tmpId == pr.tmpId) {
                            if (pr.id) {
                                pl.id = pr.id;
                                pl.tmpSynchronized = 1;
                            }
                            if (pr.encuesta_id) {
                                pl.encuesta_id = pr.encuesta_id;
                                pl.parent = pr.encuesta_id;
                            }
                            console.log(pl);
                        }
                    });
                });
            }
        });
    },
    updated() {
        this.app.bindLinks(this.$el);
    },
    methods: {
        ll(e) { console.log(e) },
        rss(e) {
            e = e.selection;
            this.rowSelectedCount2 = e ? e.length : 0;
        },
        can(o) {
            var m = this, u = m.user;
            return o || u.uid == 1;
            /*return u.uid == 1 || p.REGISTER_DESARROLLO_SOCIAL_SIVICO &&
            !o || o.user == u.id;*/
        },
        toInt(o) {
            return Array.isArray(o) ? o.length : o;
        }
    }
});
</script>
<style scoped>
.hg {
    background-color: green !important;
}

.hgd {
    background-color: #005d00 !important;
}

.hr {
    background-color: #bf0000 !important;
}

.hbd {
    background-color: #033d71 !important;
}
</style>