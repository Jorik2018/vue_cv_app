<template>
    <ion-content :scroll-events="true">
		<v-form>
            <div class="v-form">
                <label>Vehiculo</label>
                <div v-if="!o.plate">Debe tener seleccionado un vehiculo.
                   
                    <a class="bold v-button block center" style="margin:10px 0px" href="/admin/setting">
                    Ir a Configuración</a>
                </div>
                <template v-else>
                    <div>{{o.plate}}</div>
                    <label>Activar Tracking por GPS</label>
                    <v-switch class="v-switch" v-model="app.tracking" />
                    <v-button @click="app.guess(1000)" style="margin-top:10px" 
                        value="Enviar Geolocalización"/>
                    <template v-if="app.watcher">
                        <div class="center" style="padding:10px">{{app.watcher}}</div>
                        <img style="padding:50px;width: 100%;object-fit: cover;height: 200px;" 
                            src="@/cdn/images/marker.gif"/>
                    </template>
                    <ul v-if="locations.length" class="log-item" :key="'log-'+app.k">
                        <li v-for="(log,i) in locations" :class="log.error?'red':(log.id>0?'green':'yellow')" :key="i" v-on:click="app.po(log)">
                            {{log.time|date}} 
                            <template v-if="log.error"> - ERROR={{log.error}} {{log.msg}}</template>
                            <template v-if="log.id"> - ID={{log.id }}</template>
                        </li>
                    </ul>
                </template>
            </div>
		</v-form>
    </ion-content>		
</template>
<script>

export default window._.ui({
    data(){return {
        started:Date.now(),
        o:{plate:null}
    }},
    computed:{
        locations(){return this.app.locations;}
    },
    mounted() {
        var me=this,app=this.app;
        app.title='Administración';
        app.bindLinks(me.$el);
        me.o.tracking=!!app.watcher;
		let vehicle=localStorage.getItem('setting');
		if(vehicle)me.o.plate=JSON.parse(vehicle).vehicle;
        me.changeRoute();
        /*window.axios.post('asasas',{},{error(){alert(22)},mask(){alert('mask')}}).then(function(r){
            console.log(r);
            return false;
        });*/
    },
    methods:{
        changeRoute(){
            var me=this,app=this.app;
            me.o.tracking=!!app.watcher;
            app.logError=me.logError;
            app.logWatch=me.logWatch;
        },
        logError(error) {
            return this.locations.unshift({time:new Date(),error:error.name + ": " + error.message});
        },
        logWatch(msg) {
            this.locations.unshift({time:new Date(),msg:msg});
        },
        logLocation(location) {
            var me=this;
            return me.logWatch(location.latitude + ":" + location.longitude);
        },

    }
})
</script>
<style scoped>
.yellow {
    cursor:pointer;
}
.red {
    background-color: #ffc0c8 !important;
} 
.green {
    background-color: #baffba !important;
}
    .log-item{
        max-height: 400px;
        overflow-y: auto;
        margin-top: 10px;
    }
    .log-item > *{
        max-height: 400px;
        overflow-y: auto;
        background-color: #fffac9;
        margin-top: 10px;
        border: 1px solid gray;
        padding: 10px;
    }
    .log-item > *:first-child{
        margin-top: 0px;
    }
#dateDiff:empty,#msg:empty{
        display:none;
    }
    #dateDiff{
        border-radius:4px;background-color:#fdfad9;border:1px solid #dddddd;padding:5px 10px;margin-top:10px;
    }
    #msg{
        border-radius:4px;background-color:#ffd2d2;border:1px solid #dddddd;padding:5px 10px;margin-top:10px;
    }
    .i-coords{
        display:none !important;
    }
    .v-buttons{
        margin-top:5px;
    }
    .v-buttons > .v-button{
        width: 50%;
        font-size: 20px;
        padding: 20px;
    }
    #gallery > img{
        border:3px solid #61ff5f;
        max-width:100%;
    }
    #gallery > .synced{
        border:3px solid #dddddd !important;
    }
    #gallery{
        margin-bottom:18px;
    }
    .v-button,.v-switch > *{
        font-size: 20px;
        padding: 10px;
    }
</style>