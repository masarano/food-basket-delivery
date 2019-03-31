import { RunOnServer } from "../auth/server-action";
import { ApplicationSettings } from '../manage/ApplicationSettings';
import { Helpers } from '../helpers/helpers';
import * as fetch from 'node-fetch';
import { Context, ServerContext } from "../shared/context";



export class SendSmsAction {
    @RunOnServer({ allowed: c => c.isAdmin() })
    static async SendSms(helperId: string, reminder: Boolean, context?: ServerContext) {

        try {

            let currentUser = await (context.for(Helpers).findFirst(h => h.id.isEqualTo(context.info.helperId)));

            await SendSmsAction.generateMessage(context, helperId, context.getOrigin(), reminder, context.info.name, (phone, message) => {

                new SendSmsUtils().sendSms(phone, currentUser.phone.value, message);
            });
        }
        catch (err) {
            console.error(err);
        }
    }



    static async  generateMessage(ds: Context, id: string, origin: string, reminder: Boolean, senderName: string, then: (phone: string, message: string) => void) {

        if (!origin) {
            throw 'Couldnt determine origin for sms';
        }
        let helper = await ds.for(Helpers).findFirst(h => h.id.isEqualTo(id));
        if (helper) {
            if (helper.veryUrlKeyAndReturnTrueIfSaveRequired()) {
                await helper.save();
            }
            let message = '';
            if (reminder) {
                message = 'שלום ' + helper.name.value;
                message += " טרם נרשם במערכת שבוצעה החלוקה, אנא עדכן אותנו אם יש צורך בעזרה או עדכן שהמשלוח הגיע ליעדו"
                message += ' אנא לחץ על ' + origin + '/x/' + helper.shortUrlKey.value;
                helper.reminderSmsDate.dateValue = new Date();
            }
            else {
                let settings = await ApplicationSettings.getAsync(ds);
                message = settings.smsText.value;
                if (!message || message.trim().length == 0) {
                    message = 'שלום !משנע! לחלוקת חבילות !ארגון! לחץ על: !אתר! תודה !שולח!';

                }

                message = SendSmsAction.getMessage(message, settings.organisationName.value, helper.name.value, senderName, origin + '/x/' + helper.shortUrlKey.value);

            }
            then(helper.phone.value, message);
            await helper.save();


        }
    }
    static getMessage(template: string, orgName: string, courier: string, sender: string, url: string) {
        return template.replace('!משנע!', courier).replace('!שולח!', sender).replace('!ארגון!', orgName).replace('!אתר!', url)

    }
}

export interface SendSmsInfo {

    helperId: string;
    reminder: Boolean;
}
export interface SendSmsResponse {


}

class SendSmsUtils {
    un = process.env.SMS_UN;
    pw = process.env.SMS_PW;
    accid = process.env.SMS_ACCID;


    async sendSms(phone: string, from: string, text: string) {

        var t = new Date();
        var date = t.getFullYear() + '/' + (t.getMonth() + 1) + '/' + t.getDate() + ' ' + t.getHours() + ':' + t.getMinutes() + ':' + t.getSeconds();

        var data =
            '<?xml version="1.0" encoding="utf-8"?>' +
            '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' +
            '<soap12:Body>' +
            '<sendSmsToRecipients xmlns="apiItnewsletter">' +
            '<un>' + this.un + '</un>' +
            '<pw>' + this.pw + '</pw>' +
            '<accid>' + this.accid + '</accid>' +
            '<sysPW>' + 'itnewslettrSMS' + '</sysPW>' +
            '<t>' + date + '</t>' +
            '<txtUserCellular>' + from + '</txtUserCellular>' +
            '<destination>' + phone + '</destination>' +
            '<txtSMSmessage>' + text + '</txtSMSmessage>' +
            '<dteToDeliver></dteToDeliver>' +
            '<txtAddInf>jsnodetest</txtAddInf>' +
            '</sendSmsToRecipients>' +
            '</soap12:Body>' +
            '</soap12:Envelope>';
        console.log('sms request',data);


        try {
            let h = new fetch.Headers();
            h.append('Content-Type', 'text/xml; charset=utf-8');
            h.append('SOAPAction', 'apiItnewsletter/sendSmsToRecipients');
            let r = await fetch.default('https://sapi.itnewsletter.co.il/webservices/webservicesms.asmx', {
                method: 'POST',
                headers: h,
                body: data
            });
            console.log('sms response',r, await r.text());

        }
        catch (err) {
            console.error('sms error ', err);
        }


    }
}