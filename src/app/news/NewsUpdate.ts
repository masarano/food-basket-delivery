import { DeliveryStatus, DeliveryStatusColumn } from "../families/DeliveryStatus";
import { changeDate, buildSql } from "../model-shared/types";
import { StringColumn, NumberColumn, Entity } from "radweb";
import { HelperIdReadonly, HelperId } from "../helpers/helpers";
import { evilStatics } from "../auth/evil-statics";
import { Families, FamilyUpdateInfo } from "../families/families";
import { entityWithApi, entityApiSettings } from "../server/api-interfaces";


export let f = new Families();
export class NewsUpdate extends Entity<string> implements entityWithApi {

  id = new StringColumn();
  name = new StringColumn();
  courier = new HelperId("משנע");
  courierAssingTime = new changeDate('מועד שיוך למשנע');
  courierAssignUser = new HelperIdReadonly('מי שייכה למשנע');
  deliverStatus = new DeliveryStatusColumn('סטטוס שינוע');
  deliveryStatusDate = new changeDate('מועד סטטוס שינוע');
  deliveryStatusUser = new HelperIdReadonly('מי עדכן את סטטוס המשלוח');
  updateTime = new changeDate('מועד העדכון');
  updateUser = new HelperIdReadonly('מי עדכן');
  courierComments = new StringColumn('הערות מסירה');
  updateType = new NumberColumn();
  constructor() {
    super(() => new NewsUpdate(), evilStatics.dataSource, {
      caption: 'חדשות',
      name: 'news',
      dbName: buildSql("(select ", [f.id, f.name, f.courier, f.deliverStatus, f.deliveryStatusDate, f.courierAssingTime, f.courierAssignUser, f.deliveryStatusUser, f.courierComments], ", ", f.deliveryStatusDate, " updateTime, ", f.deliveryStatusUser, " updateUser, 1 updateType from ", f, " where ", f.deliveryStatusDate, " is not null ", "union select ", [f.id, f.name, f.courier, f.deliverStatus, f.deliveryStatusDate, f.courierAssingTime, f.courierAssignUser, f.deliveryStatusUser,f.courierComments], ", ", f.courierAssingTime, " updateTime, ", f.courierAssignUser, " updateUser, 2 updateType from ", f, " where ", f.courierAssingTime, " is not null", ") x")
    });
    this.initColumns();
  }
  describe() {
    return Families.GetUpdateMessage(this, this.updateType.value, this.courier.getValue());
  }
  getDataApiSettings(): entityApiSettings {
    return {}
  }
}