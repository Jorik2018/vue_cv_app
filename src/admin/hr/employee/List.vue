<template>
    <ion-content :scroll-events="true">
        <v-form header="Empleados" action="/admin/hr/employee">
            <v-table :selectable="true" row-style-class="row.synchronized?'green':(row.tmpId>0?'yellow':'')"
                store="employee" @loaded="ll" :scrollable="true" rowKey="id" :pagination="20" @updated="app.bindLinks($el)"
                :filters="filters" src="/api/hr/employee">
                <template v-slot:header>
                    <v-button value="Enviar" v-if="app.connected" icon="fa-save" :disabled="!rowSelectedCount"
                        @click.prevent="sync"></v-button>
                    <v-button value="Crear" v-if="1 || can(perms.HR_REGISTER_employee)" icon="fa-plus"
                        class="on" @click.prevent="create"></v-button>
                    <v-button value="Editar" v-if="1 || can(perms.HR_REGISTER_employee)" icon="fa-pen"
                        @click.prevent="edit" :disabled="!rowSelectedCount"></v-button>
                    <v-button value="Verj" icon="fa-search" @click.prevent="view(getSelected()[0])"
                        :disabled="!rowSelectedCount"></v-button>
                    <v-button value="Eliminar" v-if="1 || can(perms.HR_REGISTER_employee)" icon="fa-trash"
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
                    <td width="120" header="DNI" class="center" >
                        <v-filter>
                            <input v-model="filters.dni" class="center" />
                        </v-filter>
                        {{ row.dni }}
                    </td>
                    <td width="320" header="Apellidos y Nombres" >
                        <v-filter>
                            <input v-model="filters.fullName" />
                        </v-filter>
                        {{ row.fullName }}
                    </td>
                    <td width="120" header="Telefono" class="center">
                        <v-filter>
                            <input v-model="filters.phone" />
                        </v-filter>
                        {{ row.phone }}
                    </td>
                    <td width="90" header="Fecha Nacimiento (Edad)" class="center">
                        <v-filter>
                            <input v-model="filters.birthday" />
                        </v-filter>
                        {{ row.birthday ||'---'}}
                        <br/><template v-if="row.edad||row.edad==0">({{ row.edad }})</template>
                    </td>
                    <td width="70" header="Sexo" class="center">
                        <v-filter>
                            <input v-model="filters.sex" />
                        </v-filter>
                        {{ row.sex }}
                    </td>
                    <td width="140" header="Telefono Contacto" class="center">
                        <v-filter>
                            <input v-model="filters.telefono_contacto" />
                        </v-filter>
                        {{ row.telefono_contacto }}
                    </td>
                    <td width="220" header="Inserted" class="center">
                        <v-filter>
                            <input v-model="filters.insert_date" />
                        </v-filter>
                        {{ row.insert_date | date}}
                    </td>
                    <td width="220" header="Updated" class="center">
                        <v-filter>
                            <input v-model="filters.updated_date" />
                        </v-filter>
                        {{ row.updated_date |date}}
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
            if (dr.employee && dl.employee) {
                dr.employee.forEach(pr => {
                    dl.employee.forEach(pl => {
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
		override(url){return '/admin'+url;},
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
        },
		view(o){
			this.open('/admin/hr/employee/'+o.id);
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