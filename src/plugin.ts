import User from './user/user';
import Trip from './trip/trip';
import Location from './location/location';
import StaticData from './staticdata/staticdata';
import Attachment from './attachment/attachment';
import Util from './util/util'
import Chat from './chat/chat'
import {setup} from './setup';
import {initLogging} from './logging/logging'

export interface IRegister {
    (server:any, options:any, next:any): void;
    attributes?: any;
}

export var DEFAULT_LOCATION = 'defaultLocation_StrandbarKonstanz';
export var DEFAULT_USER = 'locator-app';

/**
 * database plugin
 *
 * example call:
 *
 *      // local database (default)
 *      new Database('app');
 */
export default
class Database {
    private db:any;
    private cradle:any;
    private user:any;
    private trip:any;
    private location:any;
    private staticdata:any;
    private attachment:any;
    private util:any;
    private mail:any;
    private chat:any;
    private pass:string;

    // define Lists
    private LISTS = {

        // user
        LIST_USER_ALL: 'user/listall/user',
        LIST_USER_PUBLIC: 'user/listall/user_public',
        LIST_USER_LOGIN: 'user/listall/login',
        LIST_ADMIN_LOGIN: 'user/listall/loginAdmin',
        LIST_USER_UUID: 'user/listall/uuid',

        // locations
        LIST_LOCATION_USER: 'location/listall/locationByUser',
        LIST_LOCATION_LOCATION: 'location/listall/location',
        LIST_LOCATION_PRELOCATION_USER: 'location/listall/preLocationByUser',
        LIST_PUBLIC_LOCATION_BY_USER: 'location/listall/publicLocationByUser',
        LIST_PUBLIC_LOCATION_BY_CITY: 'location/listall/locationByCity',
        LIST_LOCATION_BY_CITY_AND_USER: 'location/listall/locationByCityAndUser',
        LIST_LOCATION_BY_TRIP: 'location/listall/locationByTrip',

        // search trips
        LIST_SEARCH_TRIP: 'search/searchlist/city',

        // static data
        LIST_DATA_CITY_TRIPS: 'data/listall/cities_trips',
        LIST_LOCATION_TAGS: 'data/listall/locationTags',

        // trips
        LIST_TRIP_ALL: 'trip/listall/trip',
        LIST_TRIP_CITY: 'trip/listall/city',
        LIST_TRIP_USER: 'trip/listall/tripByUserId',
        LIST_TRIP_MY: 'trip/listall/myTrips',
        LIST_TRIP_BY_LOCATION: 'trip/listall/tripsByLocation',
        LIST_PRETRIP_BY_ID: 'trip/listall/preTripById',

        // chat
        LIST_CHAT_CONVERSATIONS: 'chat/listallByUserId/conversationsByUserId',
        LIST_CHAT_CONVERSATIONBYID: 'chat/listall/conversationsById',
        LIST_CHAT_MESSAGESBYCONVERSATIONID: 'chat/listall/messagesByConversationId',
        LIST_CHAT_CONVERSATIONS_BY_TWO_USER: 'chat/getExistingConversationByUsers/conversationsByUserId'
    };


    /**
     * Constructor to create a database instance
     *
     * @param database:string
     *      represents the name of the database
     *
     * @param env:any
     *      env is an object with secrets (password etc)
     * @param url:string
     *      url to the storage location of the database
     * @param port
     *      port to connect to the storage location
     */
    constructor(private database:string, private env:any, url?:string, port?:number) {

        if (!this.env || !this.env.pass) {
            throw new Error('Credentials needed!!')
        }

        var dbEnv = this.env.db;

        // import database plugin
        this.cradle = require('cradle');

        this.pass = env.pass;
        // use specific setup options if committed
        if (dbEnv) {
            if (!dbEnv['COUCH_USERNAME'] || !dbEnv['COUCH_USERNAME']) {
                throw new Error('database: please set up credentials');
            }
            this.cradle.setup({
                host: url || 'localhost',
                port: port || 5984,
                auth: {
                    username: dbEnv['COUCH_USERNAME'],
                    password: dbEnv['COUCH_PASSWORD']
                }
            });
        }
        // register plugin
        this.register.attributes = {
            pkg: require('./../../package.json')
        };
        this.openDatabase(database);
    }

    // open database instance
    private openDatabase = (database:string)=> {
        this.db = new (this.cradle.Connection)().database(database);
        // check if database exists
        this.db.exists((err, exists) => {
            if (err) {
                throw new Error('Error: ' + this.database + ' does not exist!');
            }
            console.log('Database', this.database, 'exists');
        });

        this.user = new User(this.db, this.LISTS);
        this.trip = new Trip(this.db, this.LISTS);
        this.location = new Location(this.db, this.LISTS);
        this.staticdata = new StaticData(this.db, this.LISTS);
        this.attachment = new Attachment(this.db);
        this.util = new Util(this.db);
        this.chat = new Chat(this.db, this.LISTS);
    };

    /**
     * exposes functions to other plugins
     * @param server
     */
    exportApi(server) {
        server.expose('db', this.db);

        // user
        server.expose('getUserById', this.user.getUserById);
        server.expose('getUsers', this.user.getUsers);
        server.expose('getUserByUUID', this.user.getUserByUUID);
        server.expose('getUserLogin', this.user.getUserLogin);
        server.expose('getAdminLogin', this.user.getAdminLogin);
        server.expose('createUser', this.user.createUser);
        server.expose('updateUser', this.user.updateUser);
        server.expose('updateUserPassword', this.user.updateUserPassword);
        server.expose('deleteUserById', this.user.deleteUserById);
        server.expose('updateUserMail', this.user.updateUserMail);
        server.expose('isMailAvailable', this.user.isMailAvailable);

        // trip
        server.expose('getTrips', this.trip.getTrips);
        server.expose('getTripById', this.trip.getTripById);
        server.expose('getTripsByCity', this.trip.getTripsByCity);
        server.expose('searchTripsByQuery', this.trip.searchTripsByQuery);
        server.expose('updateTrip', this.trip.updateTrip);
        server.expose('createTrip', this.trip.createTrip);
        server.expose('deleteTripById', this.trip.deleteTripById);
        server.expose('getUserTrips', this.trip.getUserTrips);
        server.expose('getMyTrips', this.trip.getMyTrips);
        server.expose('updateTripsWithLocationImage', this.trip.updateTripsWithLocationImage);
        server.expose('togglePublicTrip', this.trip.togglePublicTrip);
        server.expose('removeLocationFromTrips', this.trip.removeLocationFromTrips);
        server.expose('getAllTrips', this.trip.getAllTrips);

        // location
        server.expose('getLocationsByUserId', this.location.getLocationsByUserId);
        server.expose('getLocationById', this.location.getLocationById);
        server.expose('deleteLocationsByUserId', this.location.deleteLocationsByUserId);
        server.expose('deleteLocationById', this.location.deleteLocationById);
        server.expose('createLocation', this.location.createLocation);
        server.expose('updateLocation', this.location.updateLocation);
        server.expose('getPreLocationsByUserId', this.location.getPreLocationsByUserId);
        server.expose('isLocationNotInUse', this.location.isLocationNotInUse);
        server.expose('togglePublicLocation', this.location.togglePublicLocation);
        server.expose('getPublicLocationsByUserId', this.location.getPublicLocationsByUserId);
        server.expose('getLocationsByCity', this.location.getLocationsByCity);
        server.expose('getLocationsByCityAndUser', this.location.getLocationsByCityAndUser);
        server.expose('getLocationsByTripId', this.location.getLocationsByTripId);
        server.expose('addDefaultLocationToUser', this.location.addDefaultLocationToUser);
        server.expose('getDefaultLocation', this.location.getDefaultLocation);
        server.expose('getAllLocations', this.location.getAllLocations);

        // static data
        server.expose('getCitiesWithTrips', this.staticdata.getCitiesWithTrips);
        server.expose('getAllTagsFromLocations', this.staticdata.getAllTagsFromLocations);
        server.expose('getDefaultLocation', this.staticdata.getDefaultLocation);

        // attachment
        server.expose('getPicture', this.attachment.getPicture);
        server.expose('savePicture', this.attachment.savePicture);

        // utility methods
        server.expose('updateDocument', this.util.updateDocument);
        server.expose('createView', this.util.createView);
        server.expose('entryExist', this.util.entryExist);
        server.expose('deleteDocument', this.util.deleteDocument);
        server.expose('updateDocumentWithoutCheck', this.util.updateDocumentWithoutCheck);
        server.expose('updateDocumentWithCallback', this.util.updateDocumentWithCallback);
        server.expose('copyDocument', this.util.copyDocument);

        // chat
        server.expose('getConversationsByUserId', this.chat.getConversationsByUserId);
        server.expose('createConversation', this.chat.createConversation);
        server.expose('getConversationById', this.chat.getConversationById);
        server.expose('getMessagesByConversionId', this.chat.getMessagesByConversionId);
        server.expose('saveMessage', this.chat.saveMessage);
        server.expose('getPagedMessagesByConversationId', this.chat.getPagedMessagesByConversationId);
        server.expose('conversationDoesNotExist', this.chat.conversationDoesNotExist);
        server.expose('updateConversation', this.chat.updateConversation);
    }


    register:IRegister = (server, options, next) => {
        server.bind(this);
        this.exportApi(server);
        initLogging(server);
        next();
    };

    errorInit(err) {
        if (err) {
            console.log('Error: init plugin failed:', err);
        }
    }

    /**
     * Method for setting up all needed documents in the database. Needs to be called at
     * least one time, before the application goes live.
     * @param callback
     */
    public setup(data, callback) {
        if (!data) {
            // intern database views
            setup(this.db, this.pass, callback);
        } else if (data.key) {
            // view document
            this.db.save(data.key, data.value, callback);
        } else {
            // regular document
            this.db.save(data, callback);
        }
    }

}
