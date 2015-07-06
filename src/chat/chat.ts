declare var Promise;
import Util from './../util/util';

export default
class Chat {
    private util:any;
    private boom:any;

    constructor(private db:any, private LISTS:any) {
        this.util = new Util(db);
        this.boom = require('boom')
    }

    /**
     * Returns a list of conversations by userid.
     * @param userid
     * @param callback
     */
    getConversationsByUserId = (userid:string) => {
        return this.util.retrieveAllValues(this.LISTS.LIST_CHAT_CONVERSATIONS, {userId: userid});
    };

    /**
     * Checks if a conversation of two users does not exist
     * @param userid
     * @param userid2
     */
    conversationDoesNotExist = (userid:string, userid2:string) => {
        return new Promise((resolve, reject) => {

            this.db.list(this.LISTS.LIST_CHAT_CONVERSATIONS_BY_TWO_USER, {
                userId: userid,
                userId2: userid2
            }, (err, result) => {
                if (err) {
                    return reject(this.boom.badRequest(err))
                }

                if(!result.length || result[0].delete) {
                    return resolve();
                }

                reject(result[0]);
            });
        });
    };

    /**
     * Update a conversation object with new value
     * @param conversationid
     * @param value
     */
    updateConversation = (conversationid:string, value:any) => {
        return new Promise((resolve, reject) => {
            this.util.updateDocumentWithCallback(conversationid, value, (err, res) => {

                if (err) {
                    return reject(err);
                }

                resolve(res);
            });
        })
    };

    /**
     * Create a new conversation.
     *
     * @param conversation:any
     * @param callback
     */
    createConversation = (conversation:any) => {
        return this.util.createDocument(conversation);
    };

    /**
     * Get conversation by conversationId
     *
     * @param conversationId:string
     * @param callback
     */
    getConversationById = (conversationId:string) => {
        return this.util.retrieveSingleValue(this.LISTS.LIST_CHAT_CONVERSATIONBYID, {key: conversationId});
    };

    /**
     * Get messages by conversationId
     *
     * @param conversationId:string
     * @param callback
     */
    getMessagesByConversionId = (conversationId:string, callback) => {
        this.db.list(this.LISTS.LIST_CHAT_MESSAGESBYCONVERSATIONID, {key: conversationId}, (err, data) => {
            if (err) {
                return callback(err);
            }
            data.sort((a, b) => {
                return a.timestamp - b.timestamp;
            });
            callback(null, data);
        });
    };

    getPagedMessagesByConversationId = (conversationId:string, query:any)=> {
        var options = {
            limit: query.elements,
            skip: query.elements * query.page,
            key: conversationId,
            include_docs: true
        };
        return new Promise((resolve, reject) => {
            this.db.view('chat/messagesByConversationIdPage', options, (err, res) => {

                if (err) {
                    return reject(this.boom.badRequest(err));
                }

                resolve(this.reduceData(res));
            })

        })
    };

    /**
     * Save new message
     *
     * @param messageObj
     * @param callback
     */
    saveMessage = (messageObj, callback) => {
        this.util.createDocument(messageObj, callback);
    };

    reduceData = (data:any) => {
        var r = [];

        data.forEach(function (value) {
            r.push(value)
        });

        return r
    }
}