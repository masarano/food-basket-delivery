
import * as HelpersAndStats from "../delivery-follow-up/HelpersAndStats";
import * as FamilyDeliveryEventsView from "../families/FamilyDeliveryEventsView";
import * as ApplicationImages from "../manage/ApplicationImages";
import * as express from 'express';
import * as secure from 'express-force-https';
import * as compression from 'compression';
import { ExpressBridge } from 'radweb/server';
import { DataApi, DataApiSettings } from 'radweb/utils/server/DataApi';
import * as fs from 'fs';
import { myAuthInfo } from '../auth/my-auth-info';
import { evilStatics } from '../auth/evil-statics';
import { GetBasketStatusAction } from '../asign-family/get-basket-status-action';
import { serverInit, allEntities } from './serverInit';
import { ServerEventAuthorizeAction } from './server-event-authorize-action';
import { ServerEvents } from './server-events';


import { StatsAction } from '../families/stats-action';
import { DeliveryStatsAction } from '../delivery-follow-up/delivery-stats';
import { Families } from '../families/families';
import { ApplicationSettings } from '../manage/ApplicationSettings';
import { entityWithApi, ApiAccess } from "./api-interfaces";
import { DataApiRequest } from "radweb/utils/dataInterfaces1";

import { serverActionField, myServerAction, ServerContext } from "../auth/server-action";
import { SiteArea } from "radweb/utils/server/expressBridge";
import { AuthService } from "../auth/auth-service";
import { HelpersComponent } from "../helpers/helpers.component";
import { AsignFamilyComponent } from "../asign-family/asign-family.component";
import { DeliveryEventsComponent } from "../delivery-events/delivery-events.component";
import { SendSmsAction } from "../asign-family/send-sms-action";



;
serverInit().then(async () => {


    let app = express();
    //app.use(morgan('tiny')); 'logging';
    if (!process.env.DISABLE_SERVER_EVENTS) {
        let serverEvents = new ServerEvents(app);
        Families.SendMessageToBrowsers = x => serverEvents.SendMessage(x);
    }


    app.use(compression());

    if (!process.env.DISABLE_HTTPS)
        app.use(secure);
    let port = process.env.PORT || 3000;

    let eb = new ExpressBridge<myAuthInfo>(app);

    let allUsersAlsoNotLoggedIn = eb.addArea('/api');
    let loggedInApi = eb.addArea('/api', async x => x.authInfo != undefined);
    let adminApi = eb.addArea('/api', async x => x.authInfo && x.authInfo.admin);

    evilStatics.auth.tokenSignKey = process.env.TOKEN_SIGN_KEY;

    var addAction = (area: SiteArea<myAuthInfo>, a: any) => {
        let x = <myServerAction>a[serverActionField];
        if (!x) {
            throw 'failed to set server action, did you forget the RunOnServerDecorator?';
        }
        area.addAction(x);
    };


    evilStatics.auth.applyTo(eb, allUsersAlsoNotLoggedIn);
    [
        AuthService.login,
        AuthService.loginFromSms
    ].forEach(a => {
        addAction(allUsersAlsoNotLoggedIn, a);

    });

    [
        HelpersComponent.resetPassword,
        AsignFamilyComponent.AddBox,
        DeliveryEventsComponent.setDeliveryActive,
        DeliveryEventsComponent.copyFamiliesToActiveEvent

    ].forEach(a => addAction(adminApi, a));
    [
        new GetBasketStatusAction(),
        new ServerEventAuthorizeAction(),
        new SendSmsAction(),
        new StatsAction(),
        new DeliveryStatsAction(),
    ].forEach(a => adminApi.addAction(a));



    //add Api Entries
    allEntities.forEach(e => {
        let x = <entityWithApi><any>new e();
        if (x && x.getDataApiSettings) {
            let settings = x.getDataApiSettings();
            
            let createApi: (r: DataApiRequest<myAuthInfo>) => DataApi<any> = r => new DataApi(new ServerContext(r.authInfo).create(e));
            if (settings.apiSettings) {
                createApi = r => new DataApi(new ServerContext(r.authInfo).create(e), settings.apiSettings(r.authInfo));
            }

            switch (settings.apiAccess) {
                case ApiAccess.all:
                    allUsersAlsoNotLoggedIn.add(r => createApi(r));
                    break;
                case ApiAccess.loggedIn:
                    loggedInApi.add(r => createApi(r));
                    break;
                case ApiAccess.AdminOnly:
                default:
                    adminApi.add(r => createApi(r));
                    break;
            }
        }
    });




    app.get('/cache.manifest', (req, res) => {
        let result =
            `CACHE MANIFEST
    CACHE:
    /
    /home
    `;
        fs.readdirSync('dist').forEach(x => {
            result += `/${x}
        `;

        });
        result += `
    FALLBACK:
    / /
    
    NETWORK:
    /dataApi/`

        res.send(result);
    });
    app.use('/assets/apple-touch-icon.png', async (req, res) => {
        
        let imageBase = (await ApplicationImages.ApplicationImages.getAsync(new ServerContext({}))).base64PhoneHomeImage.value;
        res.contentType('png');
        if (imageBase) {
            try {
                res.send(Buffer.from(imageBase, 'base64'));
                return;
            }
            catch (err) {
            }
        }
        try {
            res.send(fs.readFileSync('dist/assets/apple-touch-icon.png'));
        } catch (err) {
            res.statusCode = 404;
            res.send(err);
        }
    });
    app.use('/favicon.ico', async (req, res) => {
        res.contentType('ico');
        let imageBase = (await ApplicationImages.ApplicationImages.getAsync(new ServerContext({}))).base64Icon.value;
        if (imageBase) {
            try {
                res.send(Buffer.from(imageBase, 'base64'));
                return;
            }
            catch (err) { }
        }
        try {
            res.send(fs.readFileSync('dist/favicon.ico'));
        }
        catch (err) {
            res.statusCode = 404;
            res.send(err);
        }
    });
    async function sendIndex(res: express.Response) {
        const index = 'dist/index.html';
        if (fs.existsSync(index)) {
            let x = (await ApplicationSettings.getAsync(new ServerContext({}))).organisationName.value;

            res.send(fs.readFileSync(index).toString().replace('!TITLE!', x));
        }
        else
            res.send('No Result');
    }

    app.get('', (req, res) => {

        sendIndex(res);
    });
    app.get('/index.html', (req, res) => {

        sendIndex(res);
    });
    app.use(express.static('dist'));

    app.use('/*', async (req, res) => {
        if (req.method == 'OPTIONS')
            res.send('');
        else {
            await sendIndex(res);
        }
    });
    app.listen(port);
});