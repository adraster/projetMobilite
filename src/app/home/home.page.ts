import {Component, OnInit} from '@angular/core';
import {MenuController, IonSlides, NavController} from '@ionic/angular';
import {ActionSheetController, Platform, AlertController, LoadingController, ToastController} from '@ionic/angular'; //Plugins supplémentaires
import {FirebaseService} from '../services/firebase.service';
import { //Import des plugins GoogleMaps nécessaires
    GoogleMaps,
    GoogleMap,
    GoogleMapsEvent,
    Marker,
    GoogleMapsAnimation,
    MyLocation,
    Environment,
    LatLng
} from '@ionic-native/google-maps';

import {Geolocation} from '@ionic-native/geolocation';
import {TimeInterval} from "rxjs";
import {Router} from "@angular/router";

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
    map: GoogleMap; //Instance de carte
    loading: any
    location: any;
    labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    labelIndex = 0;

    constructor(
        public menu: MenuController,
        public alertController: AlertController,
        public actionCtrl: ActionSheetController,
        public loadingCtrl: LoadingController,
        public toastCtrl: ToastController,
        private platform: Platform,
        public navCtrl: NavController,
        public firebaseService: FirebaseService,
        public router: Router
    ) {

    }

    async ngOnInit() {
        await this.platform.ready();
        await this.loadMap();
        await this.getAllMarkers();
        await this.getAllMarkerUser();
        await this.getPosition();
    }

    /**
     * Charger la map avec google map
     */
    loadMap() {
        Environment.setEnv({
            API_KEY_FOR_BROWSER_RELEASE: 'AIzaSyB_6JvTaVpooi1IF96UN4Cw-lo1nM9yfUo',
            API_KEY_FOR_BROWSER_DEBUG: 'AIzaSyB_6JvTaVpooi1IF96UN4Cw-lo1nM9yfUo'
        });

        this.map = GoogleMaps.create('map_canvas');
    }

    /**
     * Obtenir ca position actuelle
     */
    async getPosition() {
        this.map.setOptions({zoomControl: false});
        this.loading = await this.loadingCtrl.create({
            message: 'Patientez...'
        });
        await this.loading.present();

        // Récupération de la géolocalisation
        this.map.getMyLocation().then((location: MyLocation) => {
            this.loading.dismiss();
            this.location = location;
            // Animation de caméra
            this.map.animateCamera({
                target: location.latLng,
                zoom: 18,
                tilt: 30
            });

            // Ajout d'un marker
            let marker: Marker = this.map.addMarkerSync({
                title: 'Position',
                snippet: 'Vous êtes ici !',
                icon: 'red',
                position: location.latLng,
                animation: GoogleMapsAnimation.BOUNCE
            });

            /*marker.on(GoogleMapsEvent.MARKER_CLICK).subscribe(() => {
            let location = marker.get('position');
            console.log("Envoi location marker : " + location);
            this.router.navigate(['/liste-messages'],location);
        })*/

            marker.showInfoWindow();
        });
    }

    /**
     * Ajouter un marker
     * @param location
     */
    addMarker(location, color) {
        let marker: Marker = this.map.addMarkerSync({
            position: location.latLng,
            label: this.labels[this.labelIndex++ % this.labels.length],
            animation: GoogleMapsAnimation.BOUNCE,
            icon: color
        });

        /*marker.on(GoogleMapsEvent.MARKER_CLICK).subscribe(() => {
            let location = marker.get('position');
            console.log("Envoi location marker : " + location);
            this.router.navigate(['/liste-messages'],location);
        })*/
    }

    addMarkerAvecHeure(location, color, heure) {

        let marker: Marker = this.map.addMarkerSync({
            position: location.latLng,
            label: this.labels[this.labelIndex++ % this.labels.length],
            animation: GoogleMapsAnimation.BOUNCE,
            icon: color,
            title: 'Horodatage : ' + heure,
            snippet: 'Nombre de messages déposés : '
        });

        /*marker.on(GoogleMapsEvent.MARKER_CLICK).subscribe(() => {
            let location = marker.get('position');
            console.log("Envoi location marker : " + location);
            this.router.navigate(['/liste-messages'],location);
        })*/
    }

    /**
     * Sauvegarder un marker
     * @param location
     * @param message
     */
    saveMarkerPosition(location, message) {

        let value = {
            lat: location.latLng.lat,
            lgt: location.latLng.lng,
            date: location.time,
            msg: message
        };

        this.firebaseService.createUserPosition(value);
    }

    ionViewWillEnter() {
        this.menu.enable(true);
    }

    /**
     * Ouvrir la pop-up pour laisser un message sur un lieu
     * @returns {Promise<void>}
     */
    async presentMessageEvent() {
        const alert = await this.alertController.create({
            header: 'Ecrire un message',
            inputs: [{
                name: 'message',
                type: 'text',
                placeholder: 'Saisir votre message'
            }],
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                        console.log('Confirm Cancel');
                    }
                }, {
                    text: 'Valider',
                    handler: (messageData) => {
                        let that = this;
                        this.map.getMyLocation().then((location: MyLocation) => {
                            that.addMarker(location, 'red');
                            that.saveMarkerPosition(location, messageData.message);
                        });
                    }
                }
            ]
        });

        await alert.present();
    }


    getAllMarkerUser() {
        let that = this;
        this.firebaseService.getAllMarkerForCurrentUser().then(function (lieux) {
            for (let key of Object.keys(lieux)) {
                let lieu = lieux[key];
                let position = {
                    'latLng': {
                        'lat': lieu.lat,
                        'lng': lieu.lgt
                    }
                };
                that.addMarker(position, 'blue')
            }
        });
    }

    getAllMarkers() {
        let that = this;
        this.firebaseService.getAllMarkers().then(function (lieux) {
            for (let key of Object.keys(lieux)) {
                console.log(key);
                let lieu = lieux[key];
                let heure = lieu.horodatage;
                let position = {
                    'latLng': {
                        'lat': lieu.lat,
                        'lng': lieu.lgt
                    }
                };
                let timestamp = heure;
                that.addMarkerAvecHeure(position, 'green', timestamp);
            }
        });
    }
}
